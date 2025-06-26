import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'services/cache_service.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Imposta l'orientamento a portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Configurazioni per performance
  if (kReleaseMode) {
    debugPrint = (String? message, {int? wrapWidth}) {};
  }
  
  try {
    debugPrint('🚀 Initializing Supabase...');
    await Supabase.initialize(
      url: 'https://egmizgydnmvpfpbzmbnj.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
      debug: kDebugMode,
    );
    debugPrint('✅ Supabase initialized successfully');
  } catch (e) {
    debugPrint('❌ Error initializing Supabase: $e');
  }
  
  // Precarica rewards e checkpoints per migliorare le performance
  _preloadCommonData();

  runApp(const ReTapPOS());
}

// Precarica rewards e checkpoints per migliorare le performance
void _preloadCommonData() {
  // Questo verrà chiamato solo se abbiamo un merchantId di default
  // Per ora è un placeholder per future ottimizzazioni
  debugPrint('🚀 Precaricamento dati comuni in background...');
}

class ReTapPOS extends StatelessWidget {
  const ReTapPOS({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ReTap POS',
      theme: appTheme,
      home: const SplashScreen(),
      // Ottimizzazioni per performance
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(1.0),
          ),
          child: child!,
        );
      },
    );
  }
}