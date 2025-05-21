import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await dotenv.load(fileName: ".env");
  
  // Initialize Supabase
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );
  
  runApp(const ReTapWeb());
}

// Router configuration
final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/c/:cardId',
      builder: (context, state) => CardDetailsPage(
        cardId: state.pathParameters['cardId']!,
      ),
    ),
  ],
);

class ReTapWeb extends StatelessWidget {
  const ReTapWeb({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReTap Card',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: CardPage(cardUrl: Uri.base.toString()),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ReTap'),
      ),
      body: const Center(
        child: Text('Scansiona una carta ReTap per vedere i dettagli'),
      ),
    );
  }
}

class CardPage extends StatefulWidget {
  final String cardUrl;

  const CardPage({super.key, required this.cardUrl});

  @override
  State<CardPage> createState() => _CardPageState();
}

class _CardPageState extends State<CardPage> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _cardData;
  List<Map<String, dynamic>> _merchantBalances = [];

  @override
  void initState() {
    super.initState();
    _loadCardData();
  }

  Future<void> _loadCardData() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Estrai l'ID della carta dall'URL
      final uri = Uri.parse(widget.cardUrl);
      final cardId = uri.pathSegments.lastWhere((segment) => segment.isNotEmpty);
      debugPrint('Card ID from URL: $cardId');

      // Recupera i dati della carta
      final cardResponse = await Supabase.instance.client
          .from('cards')
          .select('*, customers(*)')
          .eq('id', cardId)
          .single();

      // Recupera i saldi per tutti i merchant
      final apiUrl = dotenv.env['SUPABASE_URL'] ?? 'https://retap.supabase.co';
      final balanceResponse = await http.get(
        Uri.parse('$apiUrl/functions/v1/api/balance?cardId=$cardId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${dotenv.env['SUPABASE_ANON_KEY']}',
        },
      );

      debugPrint('Balance API response:');
      debugPrint('Status code: ${balanceResponse.statusCode}');
      debugPrint('Body: ${balanceResponse.body}');

      if (balanceResponse.statusCode != 200) {
        final errorData = jsonDecode(balanceResponse.body);
        throw Exception(errorData['error'] ?? 'Errore nel recupero del saldo (${balanceResponse.statusCode})');
      }

      final balanceData = jsonDecode(balanceResponse.body);
      if (balanceData['balances'] == null) {
        throw Exception('Formato risposta non valido');
      }

      setState(() {
        _cardData = cardResponse;
        _merchantBalances = List<Map<String, dynamic>>.from(balanceData['balances']);
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading card data: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ReTap'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Card Owner Section
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Proprietario',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _cardData?['customers']?['email'] ?? 'N/A',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Points Section
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Punti Totali',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${_merchantBalances.fold<int>(0, (sum, merchant) => sum + (merchant['balance'] as int))} punti',
                                style: const TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Merchants Section
                      const Text(
                        'Negozi',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ..._merchantBalances.map((merchant) => Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          merchant['merchant_name'] ?? 'N/A',
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        if (merchant['is_issuer'] == true)
                                          const Text(
                                            'Emittente',
                                            style: TextStyle(
                                              color: Colors.green,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${merchant['balance']} punti',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )),
                    ],
                  ),
                ),
    );
  }
}

class CardDetailsPage extends ConsumerStatefulWidget {
  final String cardId;

  const CardDetailsPage({
    super.key,
    required this.cardId,
  });

  @override
  ConsumerState<CardDetailsPage> createState() => _CardDetailsPageState();
}

class _CardDetailsPageState extends ConsumerState<CardDetailsPage> {
  bool _isLoading = true;
  Map<String, dynamic>? _cardData;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCardData();
  }

  Future<void> _loadCardData() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final response = await Supabase.instance.client
          .from('cards')
          .select('*, customers(*)')
          .eq('id', widget.cardId)
          .single();

      setState(() {
        _cardData = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Errore nel caricamento dei dati della carta';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Errore'),
        ),
        body: Center(
          child: Text(_error!),
        ),
      );
    }

    final points = _cardData?['points'] ?? 0;
    final createdAt = _cardData?['created_at'] != null
        ? DateFormat('dd/MM/yyyy').format(DateTime.parse(_cardData!['created_at']))
        : 'N/A';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dettagli Carta'),
      ),
      body: Padding(
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
                    Text(
                      'Punti: $points',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Registrata il: $createdAt',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: Implementare l'aggiunta al Wallet
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Funzionalità in arrivo!'),
                    ),
                  );
                },
                icon: const Icon(Icons.phone_android),
                label: const Text('Aggiungi a Wallet'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<Map<String, dynamic>> fetchCardBalance(String cardId) async {
  try {
    final apiUrl = dotenv.env['SUPABASE_URL'] ?? 'https://retap.supabase.co';
    final response = await http.get(
      Uri.parse('$apiUrl/functions/v1/api/balance?cardId=$cardId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${dotenv.env['SUPABASE_ANON_KEY']}',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Errore nel recupero del saldo (${response.statusCode})');
    }

    final data = jsonDecode(response.body);
    if (data['balances'] == null) {
      throw Exception('Formato risposta non valido');
    }
    
    return {
      'id': cardId,
      'points': data['balances'].fold<int>(0, (sum, merchant) => sum + (merchant['balance'] as int)),
    };
  } catch (e) {
    debugPrint('Error fetching card balance: $e');
    throw Exception('Errore nel recupero del saldo: ${e.toString()}');
  }
}
