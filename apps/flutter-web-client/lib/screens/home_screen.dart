import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'business_detail_screen.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../components/category_filters.dart';
import '../components/business_card.dart';
import '../shared_utils/business_hours.dart';

// Business categories with their corresponding icons
const Map<String, IconData> BUSINESS_CATEGORIES = {
  'Restaurant': Icons.restaurant,
  'Pizzeria': Icons.local_pizza,
  'Bar': Icons.local_bar,
  'Cafe': Icons.coffee,
  'Bakery': Icons.cake,
  'Ice Cream Shop': Icons.icecream,
  'Hair Salon': Icons.content_cut,
  'Beauty Salon': Icons.face,
  'Spa': Icons.spa,
  'Gym': Icons.fitness_center,
  'Clothing Store': Icons.checkroom,
  'Shoe Store': Icons.shopping_bag,
  'Jewelry Store': Icons.diamond,
  'Bookstore': Icons.book,
  'Other': Icons.store,
};

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
  String? _selectedCategory;
  static const String _cardIdKey = 'retap_card_id';

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

  Future<void> _extractCardIdAndLoad() async {
    // Prima prova a estrarre l'ID dall'URL
    final uri = Uri.base;
    final segments = uri.pathSegments;
    String? urlCardId;
    
    if (segments.isNotEmpty && segments.first == 'c' && segments.length > 1) {
      urlCardId = segments[1];
    } else if (segments.isNotEmpty && segments.last.isNotEmpty) {
      urlCardId = segments.last;
    }
    
    // Ottieni le SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    
    // Se abbiamo trovato un ID nell'URL, lo salviamo nelle preferences
    if (urlCardId != null && urlCardId.isNotEmpty) {
      cardId = urlCardId;
      await prefs.setString(_cardIdKey, urlCardId);
    } 
    // Altrimenti, proviamo a recuperarlo dalle preferences
    else {
      cardId = prefs.getString(_cardIdKey);
    }
    
    // Se abbiamo un cardId valido, carichiamo i bilanci
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
      
      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');
      
      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei punti: ${response.statusCode} - ${response.body}');
      }
      
      final data = jsonDecode(response.body);
      print('API Response: $data'); // Debug log
      
      setState(() {
        _merchantBalances = (data['balances'] ?? []).where((b) => ((b['balance'] ?? 0) is int && (b['balance'] ?? 0) > 0)).toList();
        print('Filtered Balances: $_merchantBalances'); // Debug log
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading balances: $e'); // Debug log
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredMerchantBalances {
    if (_selectedCategory == null) return _merchantBalances;
    
    // Debug log
    print('Selected Category: $_selectedCategory');
    print('Filtering merchants...');
    
    final filtered = _merchantBalances.where((business) {
      final businessCategory = business['industry'];
      print('Business: ${business['merchant_name']}, Category: $businessCategory'); // Debug log
      return businessCategory == _selectedCategory;
    }).toList();
    
    print('Filtered Results: $filtered'); // Debug log
    return filtered;
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
                    'Hi Alberto',
                    style: AppTextStyles.displaySmall,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'good',
                        style: AppTextStyles.displaySmall.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'morning!',
                        style: AppTextStyles.displaySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Category filters
            CategoryFilters(
              selectedCategory: _selectedCategory,
              onCategorySelected: (cat) => setState(() => _selectedCategory = cat),
              businessCategories: BUSINESS_CATEGORIES,
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                      : _filteredMerchantBalances.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _selectedCategory != null 
                                        ? 'Nessun business trovato nella categoria ${_selectedCategory}'
                                        : 'Nessun business visitato',
                                    style: const TextStyle(color: Colors.grey),
                                    textAlign: TextAlign.center,
                                  ),
                                  if (_selectedCategory != null) ...[
                                    const SizedBox(height: 16),
                                    TextButton(
                                      onPressed: () {
                                        setState(() {
                                          _selectedCategory = null;
                                        });
                                      },
                                      child: const Text('Rimuovi filtro'),
                                    ),
                                  ],
                                ],
                              ),
                            )
                          : Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: GridView.builder(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 32,
                                  crossAxisSpacing: 24,
                                  childAspectRatio: 0.75,
                                ),
                                itemCount: _filteredMerchantBalances.length,
                                itemBuilder: (context, index) {
                                  final business = _filteredMerchantBalances[index];
                                  final category = business['industry'] ?? 'Other';
                                  final categoryIcon = BUSINESS_CATEGORIES[category] ?? Icons.store;
                                  final logoUrl = business['logo_url'] ?? _imageUrls[index % _imageUrls.length];
                                  final name = business['merchant_name'] ?? '';
                                  final hours = business['hours'];
                                  final isOpen = isBusinessOpen(hours);
                                  final checkpointsCurrent = business['checkpoints_current'] ?? 0;
                                  final checkpointsTotal = business['checkpoints_total'] ?? 0;
                                  final points = business['balance'] ?? 0;
                                  return BusinessCard(
                                    category: category,
                                    categoryIcon: categoryIcon,
                                    logoUrl: logoUrl,
                                    name: name,
                                    isOpen: isOpen,
                                    checkpointsCurrent: checkpointsCurrent,
                                    checkpointsTotal: checkpointsTotal,
                                    points: points,
                                    hours: hours,
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => BusinessDetailScreen(
                                            businessName: name,
                                            points: points,
                                          ),
                                        ),
                                      );
                                    },
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