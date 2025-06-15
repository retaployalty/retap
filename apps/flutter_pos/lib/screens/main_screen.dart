import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'pos_home_page.dart';
import 'settings_screen.dart';
import '../components/bottom_nav_bar.dart';
import 'offers_screen.dart';
import '../services/checkpoint_service.dart';
import '../components/checkpoint_reward_card.dart';

class MainScreen extends StatefulWidget {
  final String customerId;
  final String merchantId;

  const MainScreen({
    Key? key,
    required this.customerId,
    required this.merchantId,
  }) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  final CheckpointService _checkpointService = CheckpointService();
  Map<String, dynamic>? _currentReward;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      POSHomePage(
        merchantId: widget.merchantId,
        merchantName: widget.merchantId,
      ),
      OffersScreen(
        merchantId: widget.merchantId,
        merchantName: widget.merchantId,
      ),
      const SettingsScreen(),
    ];
  }

  Future<void> _advanceCheckpoint() async {
    try {
      final result = await _checkpointService.advanceCheckpoint(
        customerId: widget.customerId,
        merchantId: widget.merchantId,
      );

      if (result['reward_id'] != null) {
        setState(() {
          _currentReward = result;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Errore nell\'avanzamento: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _onRewardRedeemed() {
    setState(() {
      _currentReward = null;
    });
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