import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'business_detail_screen.dart';
import '../theme/app_theme.dart';

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

  // Immagini placeholder (puoi sostituirle con asset reali in futuro)
  final List<String> _imageUrls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256',
  ];

  @override
  void initState() {
    super.initState();
    _extractCardIdAndLoad();
  }

  void _extractCardIdAndLoad() {
    final uri = Uri.base;
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
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ciao 👋',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontSize: 26,
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ecco i tuoi punti nei business visitati:',
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 18, color: Colors.black87),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                      : _merchantBalances.isEmpty
                          ? const Center(child: Text('Nessun business visitato'))
                          : Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: GridView.builder(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 32,
                                  crossAxisSpacing: 24,
                                  childAspectRatio: 0.75,
                                ),
                                itemCount: _merchantBalances.length,
                                itemBuilder: (context, index) {
                                  final business = _merchantBalances[index];
                                  final imageUrl = _imageUrls[index % _imageUrls.length];
                                  return AnimatedScale(
                                    scale: 1.0,
                                    duration: const Duration(milliseconds: 200),
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(24),
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
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(24),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppColors.primary.withOpacity(0.07),
                                              blurRadius: 16,
                                              offset: const Offset(0, 8),
                                            ),
                                          ],
                                        ),
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Container(
                                              width: 90,
                                              height: 90,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: AppColors.accent,
                                                border: Border.all(color: AppColors.primary.withOpacity(0.15), width: 2),
                                              ),
                                              child: ClipOval(
                                                child: Image.network(
                                                  imageUrl,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.store, color: AppColors.primary, size: 48),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 18),
                                            Text(
                                              business['merchant_name'] ?? '',
                                              style: theme.textTheme.titleMedium?.copyWith(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 20,
                                                color: AppColors.primary,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                            const SizedBox(height: 10),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary.withOpacity(0.10),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                'Punti: ${business['balance']}',
                                                style: const TextStyle(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 18,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }
} 