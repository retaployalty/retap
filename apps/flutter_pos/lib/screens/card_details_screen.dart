import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';
import '../components/skeleton_components.dart';
import '../services/points_service.dart';
import 'dart:async';

class CardDetailsScreen extends StatefulWidget {
  final String cardUid;
  final String merchantId;

  const CardDetailsScreen({
    super.key,
    required this.cardUid,
    required this.merchantId,
  });

  @override
  State<CardDetailsScreen> createState() => _CardDetailsScreenState();
}

class _CardDetailsScreenState extends State<CardDetailsScreen> {
  bool _isLoadingCard = true;
  bool _isLoadingPoints = true;
  bool _isLoadingRewards = false;
  bool _isLoadingCheckpoints = false;
  CardModel? _card;
  String? _error;
  final _priceController = TextEditingController();
  final _pointsController = TextEditingController();
  int _currentPoints = 0;
  bool _isCrediting = false;
  Timer? _debounceTimer;
  
  // Cache per evitare ricaricamenti
  static final Map<String, CardModel> _cardCache = {};
  static final Map<String, int> _pointsCache = {};

  @override
  void initState() {
    super.initState();
    _priceController.addListener(_debouncedUpdatePoints);
    
    // Carica tutto in parallelo per massimizzare la velocità
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCachedData();
      _fetchAllDataInParallel();
    });
  }

  @override
  void dispose() {
    _priceController.dispose();
    _pointsController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _debouncedUpdatePoints() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      _updatePointsFromPrice();
    });
  }

  void _updatePointsFromPrice() {
    if (_priceController.text.isEmpty) {
      _pointsController.text = '';
      setState(() {});
      return;
    }
    try {
      final price = double.parse(_priceController.text.replaceAll(',', '.'));
      final points = (price * 10).round();
      _pointsController.text = points.toString();
      setState(() {});
    } catch (e) {
      // Ignore parsing errors
    }
  }

  void _loadCachedData() {
    // Carica dati dalla cache se disponibili
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    if (_cardCache.containsKey(cacheKey)) {
      setState(() {
        _card = _cardCache[cacheKey];
        _isLoadingCard = false;
      });
    }
    
    if (_pointsCache.containsKey(cacheKey)) {
      setState(() {
        _currentPoints = _pointsCache[cacheKey]!;
        _isLoadingPoints = false;
      });
    }
  }

  Future<void> _fetchAllDataInParallel() async {
    if (!mounted) return;
    
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    
    // Se abbiamo già i dati in cache, carica solo i punti e attiva le offerte
    if (_cardCache.containsKey(cacheKey)) {
      await _fetchPointsOnly();
      _activateOffersAndRewards();
      return;
    }

    // Carica tutto in parallelo per massimizzare la velocità
    final futures = <Future>[];
    
    // 1. Carica i dati della carta
    futures.add(_fetchCardDataOnly());
    
    // 2. Carica i punti in parallelo
    futures.add(_fetchPointsOnly());
    
    // 3. Attiva il caricamento delle offerte e rewards
    futures.add(_activateOffersAndRewards());
    
    // Aspetta che tutto sia completato
    await Future.wait(futures);
  }

  Future<void> _fetchCardDataOnly() async {
    if (!mounted) return;
    
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    
    try {
      final cardUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards?uid=${widget.cardUid}';
      
      final cardRes = await http.get(
        Uri.parse(cardUrl),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 6));

      if (!mounted) return;

      if (cardRes.statusCode != 200) {
        setState(() {
          _error = 'Errore nel recupero della carta (${cardRes.statusCode})';
          _isLoadingCard = false;
        });
        return;
      }

      final cardData = jsonDecode(cardRes.body);
      
      // Crea il modello carta
      final cardModel = CardModel.fromJson({
        ...cardData,
        'balances': [{
          'merchant_id': widget.merchantId,
          'balance': 0 // Verrà aggiornato con i punti reali
        }]
      });
      
      // Salva in cache
      _cardCache[cacheKey] = cardModel;
      
      setState(() {
        _card = cardModel;
        _isLoadingCard = false;
      });

      // Mostra il messaggio di nuovo cliente solo se necessario
      if (cardData['is_new_merchant'] == true && mounted) {
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Nuovo cliente nel tuo negozio! Puoi iniziare ad assegnare punti.'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 5),
              ),
            );
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Errore: $e';
        _isLoadingCard = false;
      });
    }
  }

  Future<void> _fetchPointsOnly() async {
    if (!mounted || _card == null) return;
    
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    
    try {
      final points = await PointsService.getCardBalance(_card!.id, widget.merchantId)
          .timeout(const Duration(seconds: 4));
      
      if (!mounted) return;
      
      // Salva in cache
      _pointsCache[cacheKey] = points;
      
      setState(() {
        _currentPoints = points;
        _isLoadingPoints = false;
      });
      
      // Aggiorna il modello carta con i punti reali
      if (_card != null) {
        setState(() {
          _card = CardModel.fromJson({
            ..._card!.toJson(),
            'balances': [{
              'merchant_id': widget.merchantId,
              'balance': points
            }]
          });
        });
        _cardCache[cacheKey] = _card!;
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingPoints = false;
      });
    }
  }

  Future<void> _activateOffersAndRewards() async {
    if (!mounted) return;
    
    // Attiva il caricamento delle offerte e rewards dopo un breve delay
    // per dare priorità ai dati principali
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (!mounted) return;
    
    setState(() {
      _isLoadingCheckpoints = true;
      _isLoadingRewards = true;
    });
    
    // Le offerte e rewards si caricheranno automaticamente nei loro componenti
    // dopo un breve delay per non sovraccaricare l'API
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        setState(() {
          _isLoadingCheckpoints = false;
          _isLoadingRewards = false;
        });
      }
    });
  }

  Future<void> _fetchCardData() async {
    // Metodo legacy mantenuto per compatibilità
    await _fetchAllDataInParallel();
  }

  Future<void> _updatePoints(int newPoints) async {
    if (!mounted) return;
    
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    _pointsCache[cacheKey] = newPoints;
    
    setState(() {
      _currentPoints = newPoints;
    });
    
    if (_card != null) {
      final updatedCard = CardModel.fromJson({
        ..._card!.toJson(),
        'balances': [{
          'merchant_id': widget.merchantId,
          'balance': newPoints
        }]
      });
      
      setState(() {
        _card = updatedCard;
      });
      _cardCache[cacheKey] = updatedCard;
    }
  }

  Future<void> _creditPoints() async {
    if (_pointsController.text.isEmpty || _isCrediting) return;
    
    // Chiudi la tastiera
    FocusScope.of(context).unfocus();
    
    try {
      setState(() => _isCrediting = true);
      
      final points = int.parse(_pointsController.text);
      final txRes = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/tx'),
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': widget.merchantId,
        },
        body: jsonEncode({
          'cardId': _card!.id,
          'points': points,
        }),
      ).timeout(const Duration(seconds: 10));

      if (!mounted) return;

      if (txRes.statusCode == 200) {
        final newPoints = _currentPoints + points;
        await _updatePoints(newPoints);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$points punti accreditati'),
            backgroundColor: Colors.green,
          ),
        );
        _priceController.clear();
        _pointsController.clear();
      } else {
        throw Exception('Errore nell\'accredito dei punti');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isCrediting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        appBar: _isLoadingCard 
          ? PreferredSize(
              preferredSize: const Size.fromHeight(56),
              child: SkeletonComponents.buildAppBarSkeleton(),
            )
          : AppBar(
              backgroundColor: Theme.of(context).colorScheme.secondary,
              foregroundColor: Colors.white,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cliente',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    _card?.uid ?? '',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              actions: [
                Container(
                  margin: const EdgeInsets.only(right: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.stars,
                        color: Theme.of(context).colorScheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _isLoadingPoints ? '...' : '$_currentPoints',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
        body: _error != null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, size: 64, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      _error!,
                      style: TextStyle(color: Colors.red, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _error = null;
                          _isLoadingCard = true;
                          _isLoadingPoints = true;
                        });
                        _fetchCardData();
                      },
                      child: const Text('Riprova'),
                    ),
                  ],
                ),
              )
            : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sezione accredito punti
                      _isLoadingCard 
                        ? SkeletonComponents.buildCardSkeleton()
                        : Card(
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Accredita Punti',
                                    style: Theme.of(context).textTheme.titleLarge,
                                  ),
                                  const SizedBox(height: 16),
                                  Stack(
                                    children: [
                                      TextField(
                                        controller: _priceController,
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                                        decoration: InputDecoration(
                                          labelText: 'Importo in €',
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          prefixIcon: const Icon(Icons.euro, size: 28),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                                        ),
                                      ),
                                      if (_pointsController.text.isNotEmpty)
                                        Positioned(
                                          right: 0,
                                          top: 0,
                                          bottom: 0,
                                          child: Container(
                                            margin: const EdgeInsets.all(8),
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(
                                                color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                                              ),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  Icons.stars,
                                                  color: Theme.of(context).colorScheme.primary,
                                                  size: 20,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  '${_pointsController.text}',
                                                  style: TextStyle(
                                                    color: Theme.of(context).colorScheme.primary,
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  SizedBox(
                                    width: double.infinity,
                                    height: 56,
                                    child: ElevatedButton.icon(
                                      onPressed: _isCrediting ? null : _creditPoints,
                                      icon: const Icon(Icons.add, size: 24),
                                      label: Text(
                                        _isCrediting ? 'Accredito in corso...' : 'Accredita',
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      const SizedBox(height: 12),

                      // Sezione checkpoint offers
                      if (_card != null)
                        _isLoadingCheckpoints 
                          ? SkeletonComponents.buildCheckpointOffersSkeleton()
                          : CheckpointOffersList(
                              merchantId: widget.merchantId,
                              cardId: _card!.id,
                              customerId: _card!.customerId,
                            ),
                      const SizedBox(height: 12),

                      // Sezione rewards
                      if (_card != null)
                        _isLoadingRewards 
                          ? SkeletonComponents.buildRewardsSkeleton()
                          : RewardsList(
                              merchantId: widget.merchantId,
                              userPoints: _currentPoints,
                              cardId: _card!.id,
                              card: _card,
                              onPointsUpdated: _updatePoints,
                            ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
} 