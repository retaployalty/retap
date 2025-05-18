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
    url: 'https://retap.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NjQ5NzAsImV4cCI6MjA2MDU0MDk3MH0.2QwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ',
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
      title: 'ReTap',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const CardPage(),
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
  const CardPage({super.key});

  @override
  State<CardPage> createState() => _CardPageState();
}

class _CardPageState extends State<CardPage> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _cardData;

  @override
  void initState() {
    super.initState();
    _loadCardData();
  }

  Future<void> _loadCardData() async {
    try {
      // Estrai l'ID della carta dall'URL
      final uri = Uri.base;
      final cardId = uri.pathSegments.last;
      
      if (cardId.isEmpty) {
        setState(() {
          _error = 'ID carta non trovato nell\'URL';
          _isLoading = false;
        });
        return;
      }

      // Chiedi il saldo al backend
      final response = await http.get(
        Uri.parse('http://10.220.12.203:4000/tx/balance/$cardId'),
        headers: {
          'x-merchant-id': '11111111-1111-1111-1111-111111111111',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero del saldo');
      }

      final data = jsonDecode(response.body);
      
      setState(() {
        _cardData = {
          'id': cardId,
          'points': data['balance'],
        };
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
      appBar: AppBar(
        title: const Text('ReTap'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.credit_card,
                        size: 64,
                        color: Colors.blue,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        '${_cardData!['points']} punti',
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'ID: ${_cardData!['id']}',
                        style: const TextStyle(
                          color: Colors.grey,
                        ),
                      ),
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
