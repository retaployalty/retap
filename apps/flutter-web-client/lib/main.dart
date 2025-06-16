import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/business_list_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/merchant_details_screen.dart';
import 'screens/merchant_showcase_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/registration_screen.dart';
import 'components/custom_bottom_nav_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://egmizgydnmvpfpbzmbnj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
  );
  
  // Precarica il font Fredoka
  await GoogleFonts.pendingFonts([
    GoogleFonts.getFont('Fredoka'),
  ]);
  
  runApp(const ReTapWeb());
}

class ReTapWeb extends StatelessWidget {
  const ReTapWeb({super.key});

  Future<String> _getInitialRoute() async {
    print('Starting _getInitialRoute check...'); // Debug log
    
    // Estrai l'ID dall'URL
    final uri = Uri.base;
    final segments = uri.pathSegments;
    String? urlCardId;
    String? urlMerchantId;
    
    print('URL segments: $segments'); // Debug log
    
    // Controlla se è un URL di merchant
    if (segments.isNotEmpty && segments.first == 'm' && segments.length > 1) {
      urlMerchantId = segments[1];
      print('Merchant URL detected: $urlMerchantId'); // Debug log
      return '/m/$urlMerchantId';
    }
    
    // Controlla se è un URL di carta cliente
    if (segments.isNotEmpty && segments.first == 'c' && segments.length > 1) {
      urlCardId = segments[1];
      print('Customer card URL detected: $urlCardId'); // Debug log
    } else if (segments.isNotEmpty && segments.last.isNotEmpty) {
      urlCardId = segments.last;
    }
    
    print('URL Card ID: $urlCardId'); // Debug log
    
    // Ottieni le SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    
    // Se abbiamo trovato un ID nell'URL, lo salviamo nelle preferences
    if (urlCardId != null && urlCardId.isNotEmpty) {
      await prefs.setString('retap_card_id', urlCardId);
      print('Saved card ID to preferences: $urlCardId'); // Debug log
    } 
    // Altrimenti, proviamo a recuperarlo dalle preferences
    else {
      urlCardId = prefs.getString('retap_card_id');
      print('Retrieved card ID from preferences: $urlCardId'); // Debug log
    }

    if (urlCardId == null || urlCardId.isEmpty) {
      print('No card ID found, redirecting to onboarding'); // Debug log
      return '/onboarding';
    }

    // Controlla se il cliente ha già i dati registrati
    final supabase = Supabase.instance.client;
    try {
      print('Checking card in database: $urlCardId'); // Debug log
      final cardResponse = await supabase
          .from('cards')
          .select('customer_id')
          .eq('id', urlCardId)
          .maybeSingle();

      print('Card response: $cardResponse'); // Debug log

      if (cardResponse == null) {
        print('Card not found in database, redirecting to onboarding'); // Debug log
        return '/onboarding';
      }

      final customerId = cardResponse['customer_id'] as String;
      print('Customer ID found: $customerId'); // Debug log

      final customerResponse = await supabase
          .from('customers')
          .select('first_name, last_name, phone_number')
          .eq('id', customerId)
          .maybeSingle();

      print('Customer response: $customerResponse'); // Debug log

      // Se il cliente non esiste o non ha i dati completi, vai all'onboarding
      if (customerResponse == null || 
          customerResponse['first_name'] == null || 
          customerResponse['first_name'].toString().trim().isEmpty ||
          customerResponse['last_name'] == null || 
          customerResponse['last_name'].toString().trim().isEmpty ||
          customerResponse['phone_number'] == null || 
          customerResponse['phone_number'].toString().trim().isEmpty) {
        print('Customer data incomplete, redirecting to onboarding'); // Debug log
        return '/onboarding';
      }

      print('All checks passed, redirecting to home'); // Debug log
      return '/';
    } catch (e) {
      print('Error checking customer data: $e'); // Debug log
      return '/onboarding';
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ReTap Card',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      routerConfig: GoRouter(
        initialLocation: '/splash',
        redirect: (context, state) async {
          print('Router redirect called for: ${state.matchedLocation}'); // Debug log
          if (state.matchedLocation == '/splash') {
            final initialRoute = await _getInitialRoute();
            print('Initial route determined: $initialRoute'); // Debug log
            if (initialRoute != '/splash') {
              return initialRoute;
            }
          }
          return null;
        },
        routes: [
          // Splash screen
          GoRoute(
            path: '/splash',
            builder: (context, state) => const SplashScreen(),
          ),
          // Onboarding flow
          GoRoute(
            path: '/onboarding',
            builder: (context, state) {
              print('Building OnboardingScreen'); // Debug log
              return const OnboardingScreen();
            },
          ),
          GoRoute(
            path: '/onboarding/register',
            builder: (context, state) {
              print('Building RegistrationScreen'); // Debug log
              return const RegistrationScreen();
            },
          ),
          // Rotte separate senza bottom navigation bar
          GoRoute(
            path: '/m/:merchantId',
            builder: (context, state) {
              debugPrint('Building MerchantShowcaseScreen');
              debugPrint('MerchantId: ${state.pathParameters['merchantId']}');
              final merchantId = state.pathParameters['merchantId']!;
              return MerchantShowcaseScreen(
                merchantId: merchantId,
              );
            },
          ),
          GoRoute(
            path: '/m/:merchantId/c/:cardId',
            builder: (context, state) {
              debugPrint('Building MerchantDetailsScreen');
              debugPrint('MerchantId: ${state.pathParameters['merchantId']}');
              debugPrint('CardId: ${state.pathParameters['cardId']}');
              final merchantId = state.pathParameters['merchantId']!;
              final cardId = state.pathParameters['cardId']!;
              return MerchantDetailsScreen(
                merchantId: merchantId,
                cardId: cardId,
              );
            },
          ),
          // Rotte principali con bottom navigation bar
          ShellRoute(
            builder: (context, state, child) {
              debugPrint('ShellRoute builder - Current location: ${state.matchedLocation}');
              return Scaffold(
                body: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (Widget child, Animation<double> animation) {
                    return FadeTransition(
                      opacity: animation,
                      child: child,
                    );
                  },
                  child: KeyedSubtree(
                    key: ValueKey(state.matchedLocation),
                    child: child,
                  ),
                ),
                bottomNavigationBar: CustomBottomNavBar(
                  currentIndex: _calculateSelectedIndex(state),
                  onTap: (index) => _onItemTapped(context, index),
                ),
              );
            },
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) {
                  debugPrint('Building HomeScreen');
                  return const HomeScreen();
                },
              ),
              GoRoute(
                path: '/businesses',
                builder: (context, state) => const BusinessListScreen(),
              ),
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(GoRouterState state) {
    debugPrint('Calculating selected index for: ${state.matchedLocation}');
    if (state.matchedLocation.startsWith('/businesses')) return 1;
    if (state.matchedLocation.startsWith('/settings')) return 2;
    return 0;
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/businesses');
        break;
      case 2:
        context.go('/settings');
        break;
    }
  }
}
