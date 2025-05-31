import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/business_list_screen.dart';
import 'screens/settings_screen.dart';
import 'components/custom_bottom_nav_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Precarica il font Fredoka
  await GoogleFonts.pendingFonts([
    GoogleFonts.getFont('Fredoka'),
  ]);
  
  runApp(const ReTapWeb());
}

class ReTapWeb extends StatefulWidget {
  const ReTapWeb({super.key});

  @override
  State<ReTapWeb> createState() => _ReTapWebState();
}

class _ReTapWebState extends State<ReTapWeb> {
  int _selectedIndex = 0;
  final List<Widget> _screens = [
    const HomeScreen(),
    const BusinessListScreen(),
    const SettingsScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReTap Card',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: _screens[_selectedIndex],
        bottomNavigationBar: CustomBottomNavBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
        ),
      ),
    );
  }
}
