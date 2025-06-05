import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _handleInitialRoute();
  }

  void _handleInitialRoute() {
    // Aspetta che il widget sia montato
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final uri = Uri.base;
      debugPrint('SplashScreen - Initial URI: $uri');
      
      // Estrai i parametri dall'URL
      final segments = uri.pathSegments;
      debugPrint('SplashScreen - Path segments: $segments');
      
      if (segments.isNotEmpty && segments.first == 'm') {
        // URL formato: /m/{merchantId}
        final merchantId = segments[1];
        debugPrint('SplashScreen - Merchant ID from URL: $merchantId');
        
        if (segments.length > 2 && segments[2] == 'c') {
          // URL formato: /m/{merchantId}/c/{cardId}
          final cardId = segments[3];
          debugPrint('SplashScreen - Card ID from URL: $cardId');
          context.go('/m/$merchantId/c/$cardId');
        } else {
          // URL formato: /m/{merchantId}
          context.go('/m/$merchantId');
        }
      } else {
        // Nessun parametro merchant, vai alla home
        debugPrint('SplashScreen - No merchant parameters, going to home');
        context.go('/');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
} 