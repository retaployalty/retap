import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class BusinessListScreen extends StatefulWidget {
  const BusinessListScreen({super.key});

  @override
  State<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends State<BusinessListScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _businesses = [];

  @override
  void initState() {
    super.initState();
    _loadBusinesses();
  }

  Future<void> _loadBusinesses() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchants'),
      );
      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei business');
      }
      final data = jsonDecode(response.body);
      setState(() {
        _businesses = data['merchants'] ?? [];
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
      appBar: AppBar(title: const Text('Tutti i Business')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : ListView.builder(
                  itemCount: _businesses.length,
                  itemBuilder: (context, index) {
                    final business = _businesses[index];
                    return ListTile(
                      leading: const Icon(Icons.store, color: Colors.red),
                      title: Text(business['name'] ?? ''),
                      subtitle: Text(business['industry'] ?? ''),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        // TODO: Naviga al dettaglio business
                      },
                    );
                  },
                ),
    );
  }
} 