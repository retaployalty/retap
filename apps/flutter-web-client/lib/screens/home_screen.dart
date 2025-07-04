import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'business_detail_screen.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../components/category_filters.dart';
import '../components/business_card.dart';
import '../shared_utils/business_hours.dart';
import '../shared_utils/distance_calculator.dart';
import '../providers/location_provider.dart';

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

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _merchantBalances = [];
  List<dynamic> _merchantsWithCoordinates = [];
  String? cardId;
  String? _selectedCategory;
  String? _customerName;
  bool _showGreeting = false;
  static const String _cardIdKey = 'retap_card_id';

  // Immagini placeholder (puoi sostituirle con asset reali in futuro)
  final List<String> _imageUrls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256',
  ];

  final _supabase = Supabase.instance.client;

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
      await _loadCustomerData();
      _loadBalances(cardId!);
    } else {
      setState(() {
        _isLoading = false;
        _error = "Card ID non trovata nell'URL";
      });
    }
  }

  Future<void> _loadCustomerData() async {
    try {
      // Prima otteniamo l'ID del cliente dalla carta
      final cardResponse = await _supabase
          .from('cards')
          .select('customer_id')
          .eq('id', cardId!)
          .maybeSingle();

      if (cardResponse == null) {
        throw Exception('Carta non trovata');
      }

      final customerId = cardResponse['customer_id'] as String;

      // Poi otteniamo i dati del cliente
      final customerResponse = await _supabase
          .from('customers')
          .select('first_name')
          .eq('id', customerId)
          .maybeSingle();

      if (customerResponse == null) {
        throw Exception('Cliente non trovato');
      }

      setState(() {
        _customerName = customerResponse['first_name'] as String?;
        _showGreeting = true; // Mostra il saluto solo dopo aver caricato il nome
      });
    } catch (e) {
      print('Error loading customer data: $e');
      setState(() {
        _error = 'Errore nel caricamento dei dati';
      });
    }
  }

  Future<void> _loadBalances(String cardId) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Carica i bilanci
      final balanceResponse = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=$cardId'),
      );
      
      print('Balance Response status: ${balanceResponse.statusCode}');
      print('Balance Response body: ${balanceResponse.body}');
      
      if (balanceResponse.statusCode != 200) {
        throw Exception('Errore nel recupero dei punti: ${balanceResponse.statusCode} - ${balanceResponse.body}');
      }
      
      final balanceData = jsonDecode(balanceResponse.body);
      print('Balance API Response: $balanceData'); // Debug log
      
      final balances = (balanceData['balances'] ?? []).where((b) => ((b['balance'] ?? 0) is int && (b['balance'] ?? 0) > 0)).toList();
      
      // Carica i merchant con coordinate
      final merchantsResponse = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchants'),
      );
      
      if (merchantsResponse.statusCode != 200) {
        throw Exception('Errore nel recupero dei merchant: ${merchantsResponse.statusCode}');
      }
      
      final merchantsData = jsonDecode(merchantsResponse.body);
      final merchants = merchantsData['merchants'] ?? [];
      
      // Combina i dati: aggiungi coordinate ai bilanci
      final balancesWithCoordinates = balances.map((balance) {
        final merchantId = balance['merchant_id'];
        final merchant = merchants.firstWhere(
          (m) => m['id'] == merchantId,
          orElse: () => {},
        );
        
        return {
          ...balance,
          'latitude': merchant['latitude'],
          'longitude': merchant['longitude'],
          'cover_image_url': merchant['cover_image_url'],
        };
      }).toList();
      
      setState(() {
        _merchantBalances = balancesWithCoordinates;
        _merchantsWithCoordinates = merchants;
        print('Combined Balances: $_merchantBalances'); // Debug log
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading data: $e'); // Debug log
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

  List<dynamic> get _sortedMerchantBalances {
    final locationState = ref.read(locationProvider);
    if (locationState.latitude == null || locationState.longitude == null) {
      return _filteredMerchantBalances;
    }
    
    // Converti la lista in Map per usare il metodo sortByDistance
    final businessesAsMaps = _filteredMerchantBalances.map((business) {
      return {
        'merchant_id': business['merchant_id'],
        'merchant_name': business['merchant_name'],
        'industry': business['industry'],
        'logo_url': business['logo_url'],
        'hours': business['hours'],
        'balance': business['balance'],
        'checkpoints_current': business['checkpoints_current'],
        'checkpoints_total': business['checkpoints_total'],
        'reward_steps': business['reward_steps'],
        'cover_image_url': business['cover_image_url'],
        'latitude': business['latitude'],
        'longitude': business['longitude'],
      };
    }).toList();
    
    final sorted = DistanceCalculator.sortByDistance(
      businessesAsMaps, 
      locationState.latitude!, 
      locationState.longitude!
    );
    
    return sorted;
  }

  String _getDistanceText(dynamic business) {
    return business['distanceFormatted'] ?? '';
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
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_customerName != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AnimatedTextKit(
                          animatedTexts: [
                            TypewriterAnimatedText(
                              'Hi $_customerName',
                              textStyle: AppTextStyles.displaySmall,
                              speed: const Duration(milliseconds: 50),
                              cursor: '',
                            ),
                          ],
                          totalRepeatCount: 1,
                          displayFullTextOnTap: true,
                          onFinished: () {
                            setState(() {
                              _showGreeting = true;
                            });
                          },
                        ),
                        if (_showGreeting)
                          AnimatedTextKit(
                            animatedTexts: [
                              TypewriterAnimatedText(
                                'good morning!',
                                textStyle: AppTextStyles.displaySmall.copyWith(
                                  color: AppColors.primary,
                                ),
                                speed: const Duration(milliseconds: 50),
                                cursor: '',
                              ),
                            ],
                            totalRepeatCount: 1,
                            displayFullTextOnTap: true,
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
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                      : _sortedMerchantBalances.isEmpty
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
                          : SingleChildScrollView(
                              child: ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _sortedMerchantBalances.length,
                                itemBuilder: (context, index) {
                                  final business = _sortedMerchantBalances[index];
                                  final category = business['industry'] ?? 'Other';
                                  final categoryIcon = BUSINESS_CATEGORIES[category] ?? Icons.store;
                                  final logoUrl = business['logo_url'] ?? _imageUrls[index % _imageUrls.length];
                                  final name = business['merchant_name'] ?? '';
                                  final hours = business['hours'];
                                  final isOpen = isBusinessOpen(hours);
                                  final checkpointsCurrent = business['checkpoints_current'] ?? 0;
                                  final checkpointsTotal = business['checkpoints_total'] ?? 0;
                                  final points = business['balance'] ?? 0;
                                  final rewardSteps = (business['reward_steps'] as List<dynamic>?)?.map((e) => e as int).toList() ?? [];
                                  final distance = _getDistanceText(business);
                                  return BusinessCard(
                                    category: category,
                                    categoryIcon: categoryIcon,
                                    logoUrl: logoUrl,
                                    name: name,
                                    isOpen: isOpen,
                                    checkpointsCurrent: checkpointsCurrent,
                                    checkpointsTotal: checkpointsTotal,
                                    points: points,
                                    rewardSteps: rewardSteps,
                                    distance: distance,
                                    hours: hours,
                                    onTap: () {
                                      print('HomeScreen - Business data: $business'); // Debug log
                                      print('HomeScreen - Cover images: ${business['cover_image_url']}'); // Debug log
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => BusinessDetailScreen(
                                            businessName: name,
                                            points: points,
                                            logoUrl: logoUrl,
                                            coverImageUrls: (business['cover_image_url'] is List) ? List<String>.from(business['cover_image_url']) : [],
                                            isOpen: isOpen,
                                            hours: hours,
                                            merchantId: business['merchant_id'],
                                            cardId: cardId!,
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