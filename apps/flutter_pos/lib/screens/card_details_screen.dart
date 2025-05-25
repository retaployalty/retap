import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';
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

  @override
  void initState() {
    super.initState();
    _fetchCardData();
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
      appBar: AppBar(
        title: const Text('Dettagli Carta'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _card == null
                  ? const Center(child: Text('Nessuna carta trovata'))
                  : Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Informazioni Carta',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text('UID: ${_card!.uid}'),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Saldo nel tuo negozio',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  if (_card!.balances.isNotEmpty)
                                    ..._card!.balances
                                        .where((balance) => balance['merchant_id'] == widget.merchantId)
                                        .map((balance) => Text(
                                              '${balance['balance']} punti',
                                              style: const TextStyle(
                                                fontSize: 24,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.blue,
                                              ),
                                            ))
                                        .toList()
                                  else
                                    const Text(
                                      '0 punti',
                                      style: TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 50),
                            ),
                            onPressed: () async {
                              try {
                                final txRes = await http.post(
                                  Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/tx'),
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-merchant-id': widget.merchantId,
                                  },
                                  body: jsonEncode({
                                    'cardId': _card!.id,
                                    'points': 10,
                                  }),
                                );

                                if (txRes.statusCode == 200) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('10 punti accreditati con successo'),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                  _fetchCardData(); // Refresh data
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
                            child: const Text('Accredita 10 punti'),
                          ),
                        ],
                      ),
                    ),
    );
  }
} 