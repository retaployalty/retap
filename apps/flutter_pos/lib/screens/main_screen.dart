import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'pos_home_page.dart';
import 'settings_screen.dart';
import '../components/bottom_nav_bar.dart';
import 'offers_screen.dart';

class MainScreen extends StatefulWidget {
  final String merchantId;
  final String merchantName;

  const MainScreen({
    super.key,
    required this.merchantId,
    required this.merchantName,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      POSHomePage(
        merchantId: widget.merchantId,
        merchantName: widget.merchantName,
      ),
      OffersScreen(
        merchantId: widget.merchantId,
        merchantName: widget.merchantName,
      ),
      const SettingsScreen(),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.nfc),
            label: 'NFC',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.card_giftcard),
            label: 'Offerte',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Impostazioni',
          ),
        ],
      ),
    );
  }
} 