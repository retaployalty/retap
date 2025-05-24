import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'login_screen.dart';
import 'merchant_selection_screen.dart';
import 'main_screen.dart';
import '../services/merchant_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Aggiungiamo un piccolo delay per mostrare la splash screen
    Future.delayed(const Duration(milliseconds: 500), () {
      _checkAuth();
    });
  }

  Future<void> _checkAuth() async {
    if (!mounted) return;

    try {
      final session = Supabase.instance.client.auth.currentSession;
      
      if (!mounted) return;

      if (session != null) {
        // Controlla se c'è un merchant salvato
        final merchant = await MerchantService.getSelectedMerchant();
        
        if (!mounted) return;

        if (merchant['id'] != null && merchant['name'] != null) {
          // Se c'è un merchant salvato, vai direttamente alla main screen
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => MainScreen(
                merchantId: merchant['id']!,
                merchantName: merchant['name']!,
              ),
            ),
          );
        } else {
          // Se non c'è un merchant salvato, vai alla selezione
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const MerchantSelectionScreen(),
            ),
          );
        }
      } else {
        // Se l'utente non è autenticato, vai al login
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const LoginScreen(),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      
      // In caso di errore, vai comunque al login
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FlutterLogo(size: 100),
            SizedBox(height: 24),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
} 