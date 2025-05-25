import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'login_screen.dart';
import 'merchant_selection_screen.dart';
import '../services/merchant_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Settings',
          style: AppTextStyles.titleLarge,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(
                'Profile',
                style: AppTextStyles.titleMedium,
              ),
              subtitle: Text(
                'Manage your account settings',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // TODO: Navigate to profile settings
              },
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.store_outlined),
              title: Text(
                'Change Merchant',
                style: AppTextStyles.titleMedium,
              ),
              subtitle: Text(
                'Select a different merchant',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                await MerchantService.clearSelectedMerchant();
                if (!context.mounted) return;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const MerchantSelectionScreen()),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout),
              title: Text(
                'Sign Out',
                style: AppTextStyles.titleMedium.copyWith(
                  color: Colors.red,
                ),
              ),
              onTap: () async {
                await Supabase.instance.client.auth.signOut();
                await MerchantService.clearSelectedMerchant();
                if (!context.mounted) return;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
} 