import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'business_detail_screen.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../components/category_filters.dart';
import '../components/business_card.dart';
import '../shared_utils/business_hours.dart';
import '../shared_utils/distance_calculator.dart';
import '../providers/location_provider.dart';
import '../providers/providers.dart';

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
  List<dynamic> _allMerchants = [];
  List<dynamic> _merchantBalances = [];
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
    
    // Se abbiamo un cardId valido, carichiamo i dati
    if (cardId != null && cardId!.isNotEmpty) {
      await _loadCustomerData();
      await _loadAllData();
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

  Future<void> _loadAllData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carica tutti i merchant
      await _loadAllMerchants();
      
      // Carica i bilanci se abbiamo un cardId
      if (cardId != null) {
        await _loadBalances(cardId!);
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading all data: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadAllMerchants() async {
    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchants'),
      );
      
      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei merchant: ${response.statusCode}');
      }
      
      final data = jsonDecode(response.body);
      setState(() {
        _allMerchants = data['merchants'] ?? [];
      });
    } catch (e) {
      print('Error loading merchants: $e');
      throw e;
    }
  }

  Future<void> _loadBalances(String cardId) async {
    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=$cardId'),
      );
      
      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei punti: ${response.statusCode}');
      }
      
      final data = jsonDecode(response.body);
      setState(() {
        _merchantBalances = data['balances'] ?? [];
      });
    } catch (e) {
      print('Error loading balances: $e');
      // Non blocchiamo il caricamento se i bilanci falliscono
      setState(() {
        _merchantBalances = [];
      });
    }
  }

  List<dynamic> get _filteredAndSortedMerchants {
    // Combina i dati dei merchant con i bilanci
    final merchantsWithData = _allMerchants.map((merchant) {
      final balanceData = _merchantBalances.firstWhere(
        (balance) => balance['merchant_id'] == merchant['id'],
        orElse: () => {
          'balance': 0,
          'checkpoints_current': 0,
          'checkpoints_total': 0,
          'reward_steps': [],
        },
      );

      return {
        ...merchant,
        'balance': balanceData['balance'] ?? 0,
        'checkpoints_current': balanceData['checkpoints_current'] ?? 0,
        'checkpoints_total': balanceData['checkpoints_total'] ?? 0,
        'reward_steps': balanceData['reward_steps'] ?? [],
      };
    }).toList();

    // Filtra solo i business dove l'utente ha dei punti (balance > 0)
    final merchantsWithPoints = merchantsWithData.where((business) {
      final balance = business['balance'] ?? 0;
      return balance > 0;
    }).toList();

    // Filtra per categoria se selezionata
    List<dynamic> filtered = merchantsWithPoints;
    if (_selectedCategory != null) {
      filtered = merchantsWithPoints.where((business) {
        final businessCategory = business['industry'];
        return businessCategory == _selectedCategory;
      }).toList();
    }

    // Ottieni la posizione corrente
    final locationState = ref.read(locationProvider);
    final userLocation = locationState.userPosition;

    // Se abbiamo la posizione dell'utente, calcola le distanze e ordina
    if (userLocation != null) {
      final merchantsWithDistance = filtered.map((merchant) {
        final latitude = merchant['latitude'];
        final longitude = merchant['longitude'];
        
        double? distance;
        String? distanceFormatted;
        
        if (latitude != null && longitude != null) {
          distance = DistanceCalculator.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            latitude.toDouble(),
            longitude.toDouble(),
          );
          distanceFormatted = DistanceCalculator.formatDistance(distance);
        }
        
        return {
          ...merchant,
          'distance': distance,
          'distanceFormatted': distanceFormatted,
        };
      }).toList();

      // Ordina per distanza (prima quelli più vicini)
      merchantsWithDistance.sort((a, b) {
        final distanceA = a['distance'] ?? double.infinity;
        final distanceB = b['distance'] ?? double.infinity;
        return distanceA.compareTo(distanceB);
      });

      return merchantsWithDistance;
    }

    // Se non abbiamo la posizione, restituisci senza ordinare per distanza
    return filtered.map((merchant) => {
      ...merchant,
      'distance': null,
      'distanceFormatted': null,
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locationState = ref.watch(locationProvider);
    
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
                  // Indicatore di posizione
                  if (locationState.status == LocationStatus.loading)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Localizzando...',
                            style: TextStyle(
                              color: Colors.blue[700],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else if (locationState.status == LocationStatus.error || locationState.status == LocationStatus.permissionDenied)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.location_off, color: Colors.red[700], size: 16),
                          const SizedBox(width: 8),
                          Text(
                            locationState.errorMessage ?? 'Errore posizione',
                            style: TextStyle(
                              color: Colors.red[700],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else if (locationState.userPosition != null)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.location_on, color: Colors.green[700], size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'Posizione attiva',
                            style: TextStyle(
                              color: Colors.green[700],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
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
                      : _filteredAndSortedMerchants.isEmpty
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
                                itemCount: _filteredAndSortedMerchants.length,
                                itemBuilder: (context, index) {
                                  final business = _filteredAndSortedMerchants[index];
                                  final category = business['industry'] ?? 'Other';
                                  final categoryIcon = BUSINESS_CATEGORIES[category] ?? Icons.store;
                                  final logoUrl = business['logo_url'] ?? _imageUrls[index % _imageUrls.length];
                                  final name = business['name'] ?? '';
                                  final hours = business['hours'];
                                  final isOpen = isBusinessOpen(hours);
                                  final checkpointsCurrent = business['checkpoints_current'] ?? 0;
                                  final checkpointsTotal = business['checkpoints_total'] ?? 0;
                                  final points = business['balance'] ?? 0;
                                  final rewardSteps = (business['reward_steps'] as List<dynamic>?)?.map((e) => e as int).toList() ?? [];
                                  final distance = business['distanceFormatted'];
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
                                            merchantId: business['id'],
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