import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_theme.dart';
import '../components/business_list_card.dart';
import '../components/category_filters.dart';
import '../screens/business_detail_screen.dart';
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

class BusinessListScreen extends ConsumerStatefulWidget {
  const BusinessListScreen({super.key});

  @override
  ConsumerState<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends ConsumerState<BusinessListScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _businesses = [];
  String? _selectedCategory;
  final TextEditingController _searchController = TextEditingController();
  String? cardId;
  static const String _cardIdKey = 'retap_card_id';
  
  // Immagini placeholder (puoi sostituirle con asset reali in futuro)
  final List<String> _imageUrls = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=512&h=256',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=512&h=256',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=512&h=256',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=512&h=256',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=512&h=256',
  ];

  @override
  void initState() {
    super.initState();
    _loadBusinesses();
    _loadCardId();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
      print('Debug - API Response: ${data['_debug']}'); // Debug log
      
      List<dynamic> businesses = data['merchants'] ?? [];
      
      // Se abbiamo la posizione dell'utente, ordina per distanza
      final locationState = ref.read(locationProvider);
      if (locationState.latitude != null && locationState.longitude != null) {
        businesses = DistanceCalculator.sortByDistance(
          businesses.cast<Map<String, dynamic>>(),
          locationState.latitude!,
          locationState.longitude!,
        );
      }
      
      setState(() {
        _businesses = businesses;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadCardId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      cardId = prefs.getString(_cardIdKey);
    });
  }

  // Funzione per ottenere gli orari formattati
  String _getFormattedHours(Map<String, dynamic> business) {
    final openingHours = business['hours'];
    if (openingHours == null) return 'Orari non disponibili';

    final now = DateTime.now();
    final dayOfWeek = now.weekday - 1; // 0 = Monday, 6 = Sunday
    final days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    final currentDay = days[dayOfWeek];

    final dayHours = openingHours[currentDay];
    if (dayHours == null) return 'Chiuso oggi';

    final openTime = dayHours['open'];
    final closeTime = dayHours['close'];
    if (openTime == null || closeTime == null) return 'Orari non disponibili';

    return '$openTime - $closeTime';
  }

  // Funzione per ottenere l'immagine del business
  String _getBusinessImage(Map<String, dynamic> business) {
    print('Debug - Business: ${business['name']}, Cover Images: ${business['cover_image_url']}'); // Debug log
    
    // Prima controlla se ha immagini di copertina
    final coverImages = business['cover_image_url'];
    if (coverImages is List && coverImages.isNotEmpty) {
      final firstImage = coverImages[0];
      if (firstImage != null && firstImage.toString().isNotEmpty) {
        return firstImage.toString();
      }
    }

    // Se non ha immagini di copertina, prova con il logo
    final logoUrl = business['logo_url'];
    if (logoUrl != null && logoUrl.toString().isNotEmpty) {
      return logoUrl.toString();
    }

    // Altrimenti usa un'immagine di default basata sull'industria
    final industry = (business['industry'] ?? '').toString().toLowerCase();
    print('Debug - Using default image for industry: $industry'); // Debug log
    
    // Mappa delle immagini di default per categoria
    final defaultImages = {
      'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=facearea&w=512&h=256',
      'pizzeria': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=facearea&w=512&h=256',
      'bar': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=facearea&w=512&h=256',
      'cafe': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=facearea&w=512&h=256',
      'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=facearea&w=512&h=256',
      'salon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=facearea&w=512&h=256',
      'beauty': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=facearea&w=512&h=256',
      'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=facearea&w=512&h=256',
      'clothing': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=facearea&w=512&h=256',
      'shoe': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=facearea&w=512&h=256',
      'jewelry': 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=facearea&w=512&h=256',
      'bookstore': 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=facearea&w=512&h=256',
    };

    // Cerca un'immagine di default che corrisponda all'industria
    for (final entry in defaultImages.entries) {
      if (industry.contains(entry.key)) {
        return entry.value;
      }
    }

    // Se non trova corrispondenze, usa un'immagine generica
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=512&h=256';
  }

  List<dynamic> get _filteredBusinesses {
    var filtered = _businesses;
    
    // Filtra per categoria
    if (_selectedCategory != null) {
      filtered = filtered.where((business) => 
        business['industry'] == _selectedCategory
      ).toList();
    }
    
    // Filtra per ricerca
    if (_searchController.text.isNotEmpty) {
      final searchLower = _searchController.text.toLowerCase();
      filtered = filtered.where((business) =>
        business['name'].toString().toLowerCase().contains(searchLower) ||
        business['address'].toString().toLowerCase().contains(searchLower)
      ).toList();
    }
    
    // Mantieni l'ordinamento per distanza se disponibile
    final locationState = ref.read(locationProvider);
    if (locationState.latitude != null && locationState.longitude != null) {
      filtered = DistanceCalculator.sortByDistance(
        filtered.cast<Map<String, dynamic>>(),
        locationState.latitude!,
        locationState.longitude!,
      );
    }
    
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Barra di ricerca
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(32),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: 'Cerca business...',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.only(left: 16, right: 8),
                              child: Icon(Icons.search, color: AppColors.primary),
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(32),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(32),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(32),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            filled: true,
                            fillColor: Colors.grey[200],
                          ),
                          onChanged: (value) => setState(() {}),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.filter_list, color: AppColors.primary),
                      onPressed: () {
                        // TODO: Implementa il filtro avanzato
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Filtri categoria
                CategoryFilters(
                  selectedCategory: _selectedCategory,
                  onCategorySelected: (category) => setState(() => _selectedCategory = category),
                  businessCategories: BUSINESS_CATEGORIES,
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                    : _filteredBusinesses.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  _searchController.text.isNotEmpty
                                      ? 'Nessun business trovato per "${_searchController.text}"'
                                      : _selectedCategory != null
                                          ? 'Nessun business trovato nella categoria ${_selectedCategory}'
                                          : 'Nessun business disponibile',
                                  style: const TextStyle(color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                                if (_searchController.text.isNotEmpty || _selectedCategory != null) ...[
                                  const SizedBox(height: 16),
                                  TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _searchController.clear();
                                        _selectedCategory = null;
                                      });
                                    },
                                    child: const Text('Rimuovi filtri'),
                                  ),
                                ],
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            separatorBuilder: (_, __) => const SizedBox(height: 16),
                            itemCount: _filteredBusinesses.length,
                            itemBuilder: (context, index) {
                              final business = _filteredBusinesses[index];
                              return BusinessListCard(
                                name: business['name'] ?? '',
                                industry: business['industry'],
                                address: business['address'],
                                imageUrl: (business['cover_image_url'] is List && (business['cover_image_url'] as List).isNotEmpty) 
                                    ? business['cover_image_url'][0].toString()
                                    : _getBusinessImage(business),
                                openingHours: business['hours'],
                                rewards: business['rewards'],
                                checkpointOffers: business['checkpoint_offers'],
                                distance: business['distanceFormatted'],
                                onTap: () async {
                                  if (cardId == null) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Card not found. Please try again later.')),
                                    );
                                    return;
                                  }

                                  // Get merchant details including points
                                  try {
                                    final response = await http.get(
                                      Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchant-details?merchantId=${business['id']}&cardId=$cardId'),
                                    );
                                    
                                    int points = 0;
                                    if (response.statusCode == 200) {
                                      final data = jsonDecode(response.body);
                                      points = data['balance'] ?? 0;
                                    }
                                    
                                    if (!mounted) return;
                                    
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => BusinessDetailScreen(
                                          businessName: business['name'] ?? '',
                                          points: points,
                                          logoUrl: business['logo_url'] ?? '',
                                          coverImageUrls: (business['cover_image_url'] is List) ? List<String>.from(business['cover_image_url']) : [],
                                          isOpen: isBusinessOpen(business['hours']),
                                          hours: business['hours'],
                                          merchantId: business['id'],
                                          cardId: cardId!,
                                        ),
                                      ),
                                    );
                                  } catch (e) {
                                    // If there's an error, still open the screen with 0 points
                                    if (!mounted) return;
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => BusinessDetailScreen(
                                          businessName: business['name'] ?? '',
                                          points: 0,
                                          logoUrl: business['logo_url'] ?? '',
                                          coverImageUrls: (business['cover_image_url'] is List) ? List<String>.from(business['cover_image_url']) : [],
                                          isOpen: isBusinessOpen(business['hours']),
                                          hours: business['hours'],
                                          merchantId: business['id'],
                                          cardId: cardId!,
                                        ),
                                      ),
                                    );
                                  }
                                },
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
} 