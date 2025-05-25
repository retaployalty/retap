import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

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
  Map<String, dynamic>? _cardData;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCardData();
  }

  Future<void> _fetchCardData() async {
    try {
      final cardRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards?uid=${widget.cardUid}'),
        headers: {
          'x-merchant-id': widget.merchantId,
        },
      );

      if (cardRes.statusCode != 200) {
        setState(() {
          _error = 'Carta non trovata';
          _isLoading = false;
        });
        return;
      }

      final card = jsonDecode(cardRes.body);
      
      // Fetch balance
      final balanceRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=${card['id']}'),
        headers: {
          'x-merchant-id': widget.merchantId,
        },
      );

      if (balanceRes.statusCode != 200) {
        setState(() {
          _error = 'Errore nel recupero del saldo';
          _isLoading = false;
        });
        return;
      }

      final balanceData = jsonDecode(balanceRes.body);
      
      setState(() {
        _cardData = {
          ...card,
          'balance': balanceData['balance'] ?? 0,
        };
        _isLoading = false;
      });
    } catch (e) {
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
                              Text('UID: ${_cardData!['uid']}'),
                              Text('ID Carta: ${_cardData!['id']}'),
                              Text('ID Cliente: ${_cardData!['customer_id']}'),
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
                                'Saldo',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '${_cardData!['balance']} punti',
                                style: const TextStyle(
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
                                'cardId': _cardData!['id'],
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