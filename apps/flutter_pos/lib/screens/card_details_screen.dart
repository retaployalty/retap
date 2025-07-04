import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';
import '../components/transaction_history.dart';
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
  bool _isLoadingHistory = false;
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
    
    // 2. Attiva il caricamento delle offerte e rewards
    futures.add(_activateOffersAndRewards());
    
    // Aspetta che la carta sia caricata
    await Future.wait(futures);
    
    // 3. Ora carica i punti (dopo che la carta è sicuramente disponibile)
    await _fetchPointsOnly();
    
    // 4. Attiva il caricamento della history
    _activateHistoryLoading();
    
    // 5. Fallback: se i punti non sono stati caricati, riprova dopo un breve delay
    if (_currentPoints == 0 && _card != null && mounted) {
      await Future.delayed(const Duration(milliseconds: 1000));
      if (mounted && _currentPoints == 0) {
        await _fetchPointsOnly();
      }
    }
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
          _error = 'Error retrieving card (${cardRes.statusCode})';
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
          SnackBar(
            content: const Text('New customer in your store! You can start assigning points.'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
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
    if (!mounted) return;
    
    final cacheKey = '${widget.cardUid}_${widget.merchantId}';
    
    // Se non abbiamo ancora la carta, aspetta un po' e riprova
    if (_card == null) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (_card == null) {
        // Se ancora non abbiamo la carta, esci
        return;
      }
    }
    
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

  void _activateHistoryLoading() {
    if (!mounted) return;
    
    setState(() {
      _isLoadingHistory = true;
    });
    
    // Attiva il caricamento della history dopo un breve delay
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() {
          _isLoadingHistory = false;
        });
      }
    });
  }

  void _refreshTransactionHistory() {
    if (!mounted) return;
    
    // Forza il rebuild del componente TransactionHistory
    setState(() {
      _isLoadingHistory = true;
    });
    
    // Dopo un breve delay, disattiva il loading per permettere il refresh
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        setState(() {
          _isLoadingHistory = false;
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
        
        // Aggiorna la transaction history
        _refreshTransactionHistory();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$points points credited'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        _priceController.clear();
        _pointsController.clear();
      } else {
        throw Exception('Error crediting points');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
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
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, size: 24),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Customer Card',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    _card?.uid ?? '',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              actions: [
                Container(
                  margin: const EdgeInsets.only(right: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.stars,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _isLoadingPoints ? '...' : '$_currentPoints',
                        style: const TextStyle(
                          color: Colors.white,
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
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _error = null;
                          _isLoadingCard = true;
                          _isLoadingPoints = true;
                        });
                        _fetchCardData();
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
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
                      // Credit points section
                      _isLoadingCard 
                        ? SkeletonComponents.buildCardSkeleton()
                        : Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                width: 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.add_circle_outline,
                                      color: Theme.of(context).colorScheme.primary,
                                      size: 24,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Credit Points',
                                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Stack(
                                  children: [
                                    TextField(
                                      controller: _priceController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                                      decoration: InputDecoration(
                                        labelText: 'Amount in €',
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                                            width: 2,
                                          ),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: Theme.of(context).colorScheme.primary,
                                            width: 2,
                                          ),
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
                                const SizedBox(height: 20),
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton.icon(
                                    onPressed: _isCrediting ? null : _creditPoints,
                                    icon: _isCrediting 
                                      ? SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        )
                                      : const Icon(Icons.add, size: 24),
                                    label: Text(
                                      _isCrediting ? 'Crediting...' : 'Credit Points',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Theme.of(context).colorScheme.primary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      elevation: 2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      const SizedBox(height: 12),

                      // Checkpoint offers section
                      if (_card != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.orange.withOpacity(0.1),
                              width: 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.flag,
                                    color: Colors.orange,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Checkpoint Offers',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.orange,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _isLoadingCheckpoints 
                                ? SkeletonComponents.buildCheckpointOffersSkeleton()
                                : CheckpointOffersList(
                                    merchantId: widget.merchantId,
                                    cardId: _card!.id,
                                    customerId: _card!.customerId,
                                    onCheckpointAdvanced: _refreshTransactionHistory,
                                  ),
                            ],
                          ),
                        ),
                      ],

                      // Rewards section
                      if (_card != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.green.withOpacity(0.1),
                              width: 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.card_giftcard,
                                    color: Colors.green,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Rewards',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _isLoadingRewards 
                                ? SkeletonComponents.buildRewardsSkeleton()
                                : RewardsList(
                                    merchantId: widget.merchantId,
                                    userPoints: _currentPoints,
                                    cardId: _card!.id,
                                    card: _card,
                                    onPointsUpdated: _updatePoints,
                                    onRewardRedeemed: _refreshTransactionHistory,
                                  ),
                            ],
                          ),
                        ),
                      ],

                      // Transaction History section
                      if (_card != null) ...[
                        _isLoadingHistory 
                          ? SkeletonComponents.buildTransactionHistorySkeleton()
                          : TransactionHistory(
                              merchantId: widget.merchantId,
                              cardId: _card!.id,
                              customerId: _card!.customerId,
                            ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
    );
  }
} 