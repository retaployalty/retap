import 'package:flutter/material.dart';
import '../shared_utils/platform_detector.dart';

class WalletStatusCard extends StatelessWidget {
  final VoidCallback onAddToWallet;
  final bool isLoading;

  const WalletStatusCard({
    super.key,
    required this.onAddToWallet,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isApplePlatform = PlatformDetector.isApplePlatform;
    final platformName = PlatformDetector.platformName;
    
    return Card(
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isApplePlatform ? Icons.phone_iphone : Icons.android,
                  color: const Color(0xFFFF6565),
                  size: 28,
                ),
                const SizedBox(width: 12),
                Text(
                  isApplePlatform ? 'Apple Wallet' : 'Google Wallet',
                  style: const TextStyle(
                    fontSize: 20,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Piattaforma rilevata: $platformName',
              style: const TextStyle(
                fontSize: 12,
                fontFamily: 'Fredoka',
                color: Color(0xFF999999),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isApplePlatform 
                ? 'Aggiungi la tua carta ReTap ad Apple Wallet per un accesso rapido e sicuro.'
                : 'Aggiungi la tua carta ReTap a Google Wallet per un accesso rapido e sicuro.',
              style: const TextStyle(
                fontSize: 14,
                fontFamily: 'Fredoka',
                color: Color(0xFF666666),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: isLoading ? null : onAddToWallet,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF6565),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  elevation: 0,
                ),
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isApplePlatform ? Icons.add_to_home_screen : Icons.account_balance_wallet,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isApplePlatform ? 'Aggiungi ad Apple Wallet' : 'Aggiungi a Google Wallet',
                            style: const TextStyle(
                              fontSize: 16,
                              fontFamily: 'Fredoka',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            if (isApplePlatform) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE9ECEF)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline,
                      size: 16,
                      color: Color(0xFF6C757D),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Il file .pkpass verrà scaricato. Aprilo per aggiungere la carta al Wallet.',
                        style: const TextStyle(
                          fontSize: 12,
                          fontFamily: 'Fredoka',
                          color: Color(0xFF6C757D),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
} 