import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';

class MerchantInfo extends StatelessWidget {
  final String name;
  final String address;
  final String? phone;
  final String? googleMapsUrl;
  final dynamic hours;
  final String industry;

  const MerchantInfo({
    super.key,
    required this.name,
    required this.address,
    this.phone,
    this.googleMapsUrl,
    required this.hours,
    required this.industry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: ShapeDecoration(
        color: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(33),
        ),
        shadows: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 8,
            spreadRadius: 1,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Informazioni',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 22,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w600,
              height: 1.10,
              letterSpacing: 0.66,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Dettagli e orari del negozio',
            style: TextStyle(
              color: Color(0xFF666666),
              fontSize: 14,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w400,
              height: 1.40,
              letterSpacing: 0.40,
            ),
          ),
          const SizedBox(height: 16),
          _InfoRow(
            icon: Icons.store,
            text: name,
            color: AppColors.primary,
            compact: true,
          ),
          const SizedBox(height: 8),
          _InfoRow(
            icon: Icons.category,
            text: industry,
            color: const Color(0xFF2196F3),
            compact: true,
          ),
          const SizedBox(height: 8),
          _InfoRow(
            icon: Icons.location_on,
            text: address,
            color: const Color(0xFFF44336),
            onTap: googleMapsUrl != null
                ? () async {
                    final url = Uri.parse(googleMapsUrl!);
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url);
                    }
                  }
                : null,
            compact: true,
          ),
          if (phone != null) ...[
            const SizedBox(height: 8),
            _InfoRow(
              icon: Icons.phone,
              text: phone!,
              color: const Color(0xFF9C27B0),
              onTap: () async {
                final url = Uri.parse('tel:$phone');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url);
                }
              },
              compact: true,
            ),
          ],
          const SizedBox(height: 16),
          const Text(
            'Orari',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 22,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w600,
              height: 1.10,
              letterSpacing: 0.66,
            ),
          ),
          const SizedBox(height: 8),
          if (hours != null) ...[
            ..._buildHoursList(hours),
          ] else
            const Text(
              'Orari non disponibili',
              style: TextStyle(
                color: Color(0xFF666666),
                fontSize: 14,
                fontFamily: 'Fredoka',
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildHoursList(dynamic hours) {
    final days = [
      'Lun',
      'Mar',
      'Mer',
      'Gio',
      'Ven',
      'Sab',
      'Dom'
    ];
    final List<Widget> widgets = [];

    for (var i = 0; i < days.length; i++) {
      final day = days[i];
      final dayHours = hours[day.toLowerCase()];
      final isOpen = dayHours != null && dayHours['open'] != null && dayHours['close'] != null;

      widgets.add(
        Container(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                day,
                style: const TextStyle(
                  color: Color(0xFF1A1A1A),
                  fontSize: 13,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                isOpen
                    ? '${dayHours['open']} - ${dayHours['close']}'
                    : 'Chiuso',
                style: TextStyle(
                  color: isOpen ? const Color(0xFF1A1A1A) : const Color(0xFF666666),
                  fontSize: 13,
                  fontFamily: 'Fredoka',
                  fontWeight: isOpen ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      );
      if (i < days.length - 1) {
        widgets.add(const SizedBox(height: 4));
      }
    }

    return widgets;
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  final VoidCallback? onTap;
  final bool compact;

  const _InfoRow({
    required this.icon,
    required this.text,
    required this.color,
    this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: compact ? 8 : 12,
          horizontal: compact ? 12 : 16,
        ),
        decoration: ShapeDecoration(
          color: const Color(0xFFF5F5F5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: compact ? 28 : 40,
              height: compact ? 28 : 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: color,
                size: compact ? 16 : 24,
              ),
            ),
            SizedBox(width: compact ? 8 : 16),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  color: onTap != null ? color : const Color(0xFF1A1A1A),
                  fontSize: compact ? 13 : 16,
                  fontFamily: 'Fredoka',
                  fontWeight: onTap != null ? FontWeight.w600 : FontWeight.w500,
                  decoration: onTap != null ? TextDecoration.underline : null,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
} 