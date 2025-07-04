import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:html' as html;
import 'dart:io' show Platform;
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'lost_card_tutorial_screen.dart';
import '../shared_utils/google_wallet_service.dart';
import '../shared_utils/apple_wallet_service.dart';
import '../shared_utils/platform_detector.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _locationEnabled = true;
  bool _biometricEnabled = false;
  bool _isLoading = false;
  String? _error;
  String? _cardId;
  String? _customerId;
  
  // Supabase client
  final _supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _loadCardId();
  }

  Future<void> _loadCardId() async {
    final prefs = await SharedPreferences.getInstance();
    _cardId = prefs.getString('retap_card_id');
    
    if (_cardId != null) {
      await _loadCustomerData();
    }
  }

  Future<void> _loadCustomerData() async {
    try {
      final cardResponse = await _supabase
          .from('cards')
          .select('customer_id')
          .eq('id', _cardId!)
          .maybeSingle();

      if (cardResponse != null) {
        _customerId = cardResponse['customer_id'] as String;
      }
    } catch (e) {
      print('Error loading customer data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Settings',
          style: AppTextStyles.titleLarge.copyWith(color: AppColors.primary),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error display
            if (_error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            
            // Profile Section
            _buildSectionHeader('Account'),
            const SizedBox(height: 16),
            _buildProfileCard(),
            const SizedBox(height: 32),

            // Wallet Section
            _buildSectionHeader('Wallet'),
            const SizedBox(height: 16),
            _buildWalletSection(),
            const SizedBox(height: 32),

            // Security Section
            _buildSectionHeader('Security & Privacy'),
            const SizedBox(height: 16),
            _buildSecuritySection(),
            const SizedBox(height: 32),

            // Preferences Section
            _buildSectionHeader('Preferences'),
            const SizedBox(height: 16),
            _buildPreferencesSection(),
            const SizedBox(height: 32),

            // Support Section
            _buildSectionHeader('Support'),
            const SizedBox(height: 16),
            _buildSupportSection(),
            const SizedBox(height: 32),

            // About Section
            _buildSectionHeader('About'),
            const SizedBox(height: 16),
            _buildAboutSection(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: AppTextStyles.titleMedium.copyWith(
        color: AppColors.textPrimary,
        fontSize: 18,
      ),
    );
  }

  Widget _buildProfileCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Icon(
              Icons.person,
              color: AppColors.primary,
              size: 30,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'John Doe',
                  style: AppTextStyles.titleMedium.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'john.doe@example.com',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.edit,
            color: AppColors.textSecondary,
            size: 20,
          ),
        ],
      ),
    );
  }

  Widget _buildWalletSection() {
    return Column(
      children: [
        _buildSettingsTile(
          icon: Icons.account_balance_wallet,
          title: 'Add Card to Wallet',
          subtitle: _isLoading ? 'Adding to wallet...' : 'Add your card to digital wallet',
          onTap: _isLoading ? null : () {
            _addToWallet();
          },
          trailing: _isLoading ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ) : null,
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.credit_card,
          title: 'Lost Physical Card',
          subtitle: 'Replace your lost physical card',
          onTap: () {
            _navigateToLostCardReplacement();
          },
          isDestructive: true,
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.history,
          title: 'Transaction History',
          subtitle: 'View all your transactions',
          onTap: () {
            // Navigate to transaction history
          },
        ),
      ],
    );
  }

  Widget _buildSecuritySection() {
    return Column(
      children: [
        _buildSettingsTile(
          icon: Icons.lock,
          title: 'Change Password',
          subtitle: 'Update your account password',
          onTap: () {
            // Navigate to change password
          },
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.fingerprint,
          title: 'Biometric Login',
          subtitle: 'Use fingerprint or face ID',
          onTap: null,
          trailing: Switch(
            value: _biometricEnabled,
            onChanged: (value) {
              setState(() {
                _biometricEnabled = value;
              });
            },
            activeColor: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.security,
          title: 'Two-Factor Authentication',
          subtitle: 'Add an extra layer of security',
          onTap: () {
            // Navigate to 2FA settings
          },
        ),
      ],
    );
  }

  Widget _buildPreferencesSection() {
    return Column(
      children: [
        _buildSettingsTile(
          icon: Icons.notifications,
          title: 'Push Notifications',
          subtitle: 'Receive updates about your rewards',
          onTap: null,
          trailing: Switch(
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() {
                _notificationsEnabled = value;
              });
            },
            activeColor: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.location_on,
          title: 'Location Services',
          subtitle: 'Find nearby businesses',
          onTap: null,
          trailing: Switch(
            value: _locationEnabled,
            onChanged: (value) {
              setState(() {
                _locationEnabled = value;
              });
            },
            activeColor: AppColors.primary,
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.language,
          title: 'Language',
          subtitle: 'English',
          onTap: () {
            // Navigate to language settings
          },
        ),
      ],
    );
  }

  Widget _buildSupportSection() {
    return Column(
      children: [
        _buildSettingsTile(
          icon: Icons.help,
          title: 'Help Center',
          subtitle: 'Get help and support',
          onTap: () {
            // Navigate to help center
          },
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.contact_support,
          title: 'Contact Support',
          subtitle: 'Get in touch with our team',
          onTap: () {
            // Navigate to contact support
          },
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.feedback,
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          onTap: () {
            // Navigate to feedback form
          },
        ),
      ],
    );
  }

  Widget _buildAboutSection() {
    return Column(
      children: [
        _buildSettingsTile(
          icon: Icons.info,
          title: 'App Version',
          subtitle: '1.0.0',
          onTap: null,
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.privacy_tip,
          title: 'Privacy Policy',
          subtitle: 'Read our privacy policy',
          onTap: () {
            // Navigate to privacy policy
          },
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.description,
          title: 'Terms of Service',
          subtitle: 'Read our terms of service',
          onTap: () {
            // Navigate to terms of service
          },
        ),
        const SizedBox(height: 12),
        _buildSettingsTile(
          icon: Icons.logout,
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          onTap: () {
            _showSignOutDialog();
          },
          isDestructive: true,
        ),
      ],
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback? onTap,
    Widget? trailing,
    bool isDestructive = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isDestructive 
                ? Colors.red.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            color: isDestructive ? Colors.red : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(
          title,
          style: AppTextStyles.titleSmall.copyWith(
            color: isDestructive ? Colors.red : AppColors.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        trailing: trailing ?? (onTap != null ? const Icon(
          Icons.chevron_right,
          color: AppColors.textSecondary,
          size: 20,
        ) : null),
        onTap: onTap,
      ),
    );
  }



  void _showSignOutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.logout,
                  color: Colors.red,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Sign Out',
                style: AppTextStyles.titleMedium.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          content: Text(
            'Are you sure you want to sign out? You\'ll need to sign in again to access your account.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Cancel',
                style: AppTextStyles.labelLarge.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Perform sign out
                _performSignOut();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: Text(
                'Sign Out',
                style: AppTextStyles.labelLarge.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _navigateToLostCardReplacement() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const LostCardTutorialScreen(),
      ),
    );
  }

  void _performSignOut() {
    // TODO: Implement sign out logic
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Sign out successful'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  Future<void> _addToWallet() async {
    try {
      print('🚀 Inizio _addToWallet');
      
      if (_cardId == null) {
        throw Exception('Card ID not found');
      }

      print('📋 Card ID: $_cardId');

      // Get card details from Supabase
      final cardResponse = await _supabase
          .from('cards')
          .select('customer_id, uid')
          .eq('id', _cardId!)
          .single();

      final customerResponse = await _supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', cardResponse['customer_id'])
          .single();

      final customerName = '${customerResponse['first_name']} ${customerResponse['last_name']}';
      final cardUid = cardResponse['uid'];

      print('👤 Customer Name: $customerName');
      print('🆔 Card UID: $cardUid');

      // Usa il nuovo PlatformDetector
      final isApplePlatform = PlatformDetector.isApplePlatform;
      final platformName = PlatformDetector.platformName;
      
      print('🖥️  Piattaforma rilevata: $platformName');
      print('🍎 È piattaforma Apple: $isApplePlatform');
      print('👛 Tipo wallet: ${PlatformDetector.walletType}');

      setState(() {
        _isLoading = true;
        _error = null;
      });

      if (isApplePlatform) {
        print('🍎 Avvio generazione Apple Wallet...');
        // Crea il pass per Apple Wallet
        await AppleWalletService.createPass(
          cardId: _cardId!,
          customerName: customerName,
          cardUid: cardUid,
        );
        print('✅ Apple Wallet completato');
      } else {
        print('🤖 Avvio generazione Google Wallet...');
        // Crea il pass per Google Wallet
        final saveUrl = await GoogleWalletService.createLoyaltyCard(
          cardId: _cardId!,
          customerName: customerName,
          cardUid: cardUid,
        );

        print('🔗 Google Wallet URL: $saveUrl');
        // Apri l'URL in una nuova tab
        html.window.open(saveUrl, '_blank');
        print('✅ Google Wallet completato');
      }

      // Mostra messaggio di successo
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isApplePlatform 
              ? 'Apple Wallet pass successfully downloaded. Open the file to add it to your Wallet.'
              : 'Card successfully added to Google Wallet'
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      print('❌ Errore nell\'aggiunta al wallet: $e');
      setState(() {
        _error = e.toString();
      });
      
      // Mostra messaggio di errore
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding to wallet: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
} 