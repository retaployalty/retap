import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'business_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _merchantBalances = [];
  String? cardId;

  @override
  void initState() {
    super.initState();
    _extractCardIdAndLoad();
  }

  void _extractCardIdAndLoad() {
    final uri = Uri.base;
    // Cerca la cardId nell'ultima parte del path se siamo su /c/:cardId
    final segments = uri.pathSegments;
    if (segments.isNotEmpty && segments.first == 'c' && segments.length > 1) {
      cardId = segments[1];
    } else if (segments.isNotEmpty && segments.last.isNotEmpty) {
      cardId = segments.last;
    }
    if (cardId != null && cardId!.isNotEmpty) {
      _loadBalances(cardId!);
    } else {
      setState(() {
        _isLoading = false;
        _error = "Card ID non trovata nell'URL";
      });
    }
  }

  Future<void> _loadBalances(String cardId) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=$cardId'),
      );
      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei punti');
      }
      final data = jsonDecode(response.body);
      setState(() {
        _merchantBalances = (data['balances'] ?? []).where((b) => ((b['balance'] ?? 0) is int && (b['balance'] ?? 0) > 0)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('I tuoi Business')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _merchantBalances.isEmpty
                  ? const Center(child: Text('Nessun business visitato'))
                  : ListView.builder(
                      itemCount: _merchantBalances.length,
                      itemBuilder: (context, index) {
                        final business = _merchantBalances[index];
                        return ListTile(
                          leading: const Icon(Icons.store, color: Colors.red),
                          title: Text(business['merchant_name'] ?? ''),
                          subtitle: Text('Punti: ${business['balance']}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => BusinessDetailScreen(
                                  businessName: business['merchant_name'] ?? '',
                                  points: business['balance'] ?? 0,
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
    );
  }
} 