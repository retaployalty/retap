import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';
import '../models/reward.dart';
import '../models/checkpoint.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';
import '../services/points_service.dart';
import 'package:uuid/uuid.dart';

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
  bool _isLoading = true;
  CardModel? _card;
  String? _error;
  final _priceController = TextEditingController();
  final _pointsController = TextEditingController();
  int _currentPoints = 0;

  @override
  void initState() {
    super.initState();
    _fetchCardData();
    _priceController.addListener(_updatePointsFromPrice);
  }

  @override
  void dispose() {
    _priceController.dispose();
    _pointsController.dispose();
    super.dispose();
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

  Future<void> _fetchCardData() async {
    try {
      debugPrint('Fetching card data for UID: ${widget.cardUid}');
      debugPrint('Using merchant ID: ${widget.merchantId}');
      
      final cardUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards?uid=${widget.cardUid}';
      debugPrint('Card API URL: $cardUrl');
      
      final cardRes = await http.get(
        Uri.parse(cardUrl),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
      );

      if (cardRes.statusCode != 200) {
        setState(() {
          _error = 'Errore nel recupero della carta (${cardRes.statusCode})';
          _isLoading = false;
        });
        return;
      }

      final cardData = jsonDecode(cardRes.body);
      
      // Aggiorna i punti usando PointsService
      final points = await PointsService.getCardBalance(cardData['id'], widget.merchantId);
      
      setState(() {
        _card = CardModel.fromJson({
          ...cardData,
          'balances': [{
            'merchant_id': widget.merchantId,
            'balance': points
          }]
        });
        _currentPoints = points;
        _isLoading = false;
      });

      if (cardData['is_new_merchant'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Nuovo cliente nel tuo negozio! Puoi iniziare ad assegnare punti.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error fetching card data: $e');
      setState(() {
        _error = 'Errore: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _updatePoints(int newPoints) async {
    setState(() {
      _currentPoints = newPoints;
    });
    
    // Aggiorna anche il modello della carta
    if (_card != null) {
      setState(() {
        _card = CardModel.fromJson({
          ..._card!.toJson(),
          'balances': [{
            'merchant_id': widget.merchantId,
            'balance': newPoints
          }]
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Chiude la tastiera quando si tocca fuori dal campo di input
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        appBar: AppBar(
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
                    '$_currentPoints',
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
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                : _card == null
                    ? const Center(child: Text('Nessuna carta trovata'))
                    : SafeArea(
                        child: Column(
                          children: [
                            // Main Content
                            Expanded(
                              child: SingleChildScrollView(
                                padding: const EdgeInsets.all(12.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Card(
                                      elevation: 2,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
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
                                                suffixIcon: _pointsController.text.isNotEmpty
                                                    ? Container(
                                                        margin: const EdgeInsets.all(8),
                                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                                        decoration: BoxDecoration(
                                                          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                                          borderRadius: BorderRadius.circular(16),
                                                        ),
                                                        child: Row(
                                                          mainAxisSize: MainAxisSize.min,
                                                          children: [
                                                            Icon(
                                                              Icons.star_outline,
                                                              color: Theme.of(context).colorScheme.primary,
                                                              size: 16,
                                                            ),
                                                            const SizedBox(width: 4),
                                                            Text(
                                                              '${_pointsController.text}',
                                                              style: TextStyle(
                                                                color: Theme.of(context).colorScheme.primary,
                                                                fontSize: 14,
                                                                fontWeight: FontWeight.w500,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      )
                                                    : null,
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                                              ),
                                              onChanged: (value) {
                                                _updatePointsFromPrice();
                                              },
                                            ),
                                            const SizedBox(height: 16),
                                            SizedBox(
                                              width: double.infinity,
                                              height: 56,
                                              child: ElevatedButton.icon(
                                                onPressed: () async {
                                                  if (_pointsController.text.isEmpty) {
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      const SnackBar(
                                                        content: Text('Inserisci un importo'),
                                                        backgroundColor: Colors.red,
                                                      ),
                                                    );
                                                    return;
                                                  }
                                                  try {
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
                                                    );

                                                    if (txRes.statusCode == 200) {
                                                      // Aggiorna i punti immediatamente
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
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('Errore: $e'),
                                                        backgroundColor: Colors.red,
                                                      ),
                                                    );
                                                  }
                                                },
                                                icon: const Icon(Icons.add, size: 24),
                                                label: const Text(
                                                  'Accredita',
                                                  style: TextStyle(fontSize: 16),
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

                                    if (_card != null)
                                      CheckpointOffersList(
                                        merchantId: widget.merchantId,
                                        cardId: _card!.id,
                                      ),
                                    const SizedBox(height: 12),

                                    if (_card != null)
                                      RewardsList(
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
                          ],
                        ),
                      ),
      ),
    );
  }
} 