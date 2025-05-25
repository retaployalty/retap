import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';
import '../models/reward.dart';
import '../models/checkpoint.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';
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

  @override
  void initState() {
    super.initState();
    _fetchCardData();
    // Add listener to price controller to update points
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
      return;
    }
    try {
      final price = double.parse(_priceController.text.replaceAll(',', '.'));
      final points = (price * 10).round(); // 1€ = 10 punti
      _pointsController.text = points.toString();
    } catch (e) {
      // Ignore parsing errors
    }
  }

  void _updatePriceFromPoints() {
    if (_pointsController.text.isEmpty) {
      _priceController.text = '';
      return;
    }
    try {
      final points = int.parse(_pointsController.text);
      final price = (points / 10).toStringAsFixed(2); // 10 punti = 1€
      _priceController.text = price;
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

      debugPrint('Card API response status: ${cardRes.statusCode}');
      debugPrint('Card API response headers: ${cardRes.headers}');
      debugPrint('Card API response body: ${cardRes.body}');

      if (cardRes.statusCode != 200) {
        setState(() {
          _error = 'Errore nel recupero della carta (${cardRes.statusCode})';
          _isLoading = false;
        });
        return;
      }

      final cardData = jsonDecode(cardRes.body);
      debugPrint('Card data: $cardData');
      
      // Poi otteniamo il saldo
      final balanceRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=${cardData['id']}'),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
      );

      debugPrint('Balance API response status: ${balanceRes.statusCode}');
      debugPrint('Balance API response body: ${balanceRes.body}');

      if (balanceRes.statusCode != 200) {
        setState(() {
          _error = 'Errore nel recupero del saldo (${balanceRes.statusCode})';
          _isLoading = false;
        });
        return;
      }

      final balanceData = jsonDecode(balanceRes.body);
      debugPrint('Balance data: $balanceData');
      
      setState(() {
        _card = CardModel.fromJson({
          ...cardData,
          'balances': balanceData['balances'] ?? [],
        });
        _isLoading = false;
      });

      // Se è un nuovo merchant per questa carta, mostriamo un messaggio
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _card == null
                  ? const Center(child: Text('Nessuna carta trovata'))
                  : SafeArea(
                      child: Column(
                        children: [
                          // Header Card with Customer Info and Balance
                          Container(
                            padding: const EdgeInsets.all(8.0),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                // Customer Icon and UID
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.credit_card,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                // Customer Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Cliente',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 12,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _card!.uid,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Balance
                                Container(
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
                                        _card!.balances.isNotEmpty
                                            ? '${_card!.balances.firstWhere((b) => b['merchant_id'] == widget.merchantId, orElse: () => {'balance': 0})['balance']}'
                                            : '0',
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
                          ),

                          // Main Content
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Add Points - Minimal Style
                                  Card(
                                    elevation: 2,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.add_circle_outline,
                                                color: Theme.of(context).colorScheme.primary,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              const Text(
                                                'Accredita Punti',
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 16),
                                          // Amount Input
                                          TextField(
                                            controller: _priceController,
                                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                                            decoration: InputDecoration(
                                              labelText: 'Importo in €',
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              prefixIcon: const Icon(Icons.euro, size: 24),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          // Points Preview
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                            decoration: BoxDecoration(
                                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  Icons.star_outline,
                                                  color: Theme.of(context).colorScheme.primary,
                                                  size: 20,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  _pointsController.text.isEmpty
                                                      ? 'Inserisci l\'importo per vedere i punti'
                                                      : '${_pointsController.text} punti',
                                                  style: TextStyle(
                                                    color: Theme.of(context).colorScheme.primary,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          // Submit Button
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
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('$points punti accreditati'),
                                                        backgroundColor: Colors.green,
                                                      ),
                                                    );
                                                    _priceController.clear();
                                                    _pointsController.clear();
                                                    _fetchCardData();
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

                                  // Rewards List
                                  if (_card != null)
                                    RewardsList(
                                      merchantId: widget.merchantId,
                                      userPoints: _card!.balances
                                          .firstWhere(
                                            (b) => b['merchant_id'] == widget.merchantId,
                                            orElse: () => {'balance': 0},
                                          )['balance'] as int,
                                    ),
                                  const SizedBox(height: 12),

                                  // Checkpoints List
                                  if (_card != null)
                                    CheckpointOffersList(
                                      merchantId: widget.merchantId,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }
} 