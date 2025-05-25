import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'pos_home_page.dart';
import 'settings_screen.dart';

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

  final List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    _screens.addAll([
      POSHomePage(
        merchantId: widget.merchantId,
        merchantName: widget.merchantName,
      ),
      const SettingsScreen(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.point_of_sale),
            label: 'POS',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
} 