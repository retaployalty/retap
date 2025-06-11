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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
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
            'Contacts',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 22,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w600,
              height: 1.10,
              letterSpacing: 0.66,
            ),
          ),
          const SizedBox(height: 18),
          _InfoRow(
            icon: Icons.store,
            text: name,
            noBg: true,
          ),
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          _InfoRow(
            icon: Icons.category,
            text: industry,
            noBg: true,
          ),
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          _InfoRow(
            icon: Icons.location_on,
            text: address,
            onTap: googleMapsUrl != null
                ? () async {
                    final url = Uri.parse(googleMapsUrl!);
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url);
                    }
                  }
                : null,
            noBg: true,
          ),
          if (phone != null) ...[
            const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
            _InfoRow(
              icon: Icons.phone,
              text: phone!,
              onTap: () async {
                final url = Uri.parse('tel:$phone');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url);
                }
              },
              noBg: true,
            ),
          ],
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          const Text(
            'Orari',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 17,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w600,
              height: 1.10,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 12),
          if (hours != null)
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: _buildHoursList(hours),
              ),
            )
          else
            const Text(
              'Orari non disponibili',
              style: TextStyle(
                color: Color(0xFF666666),
                fontSize: 13,
                fontFamily: 'Fredoka',
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildHoursList(dynamic hours) {
    final days = [
      'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'
    ];
    final List<Widget> widgets = [];
    final now = DateTime.now();
    final currentDay = now.weekday - 1; // 0 = Monday, 6 = Sunday

    for (var i = 0; i < days.length; i++) {
      final day = days[i];
      final dayHours = hours[day.toLowerCase()];
      final isOpen = dayHours != null && dayHours['open'] != null && dayHours['close'] != null;
      final isToday = i == currentDay;

      widgets.add(
        Container(
          width: 100,
          margin: EdgeInsets.only(right: i < days.length - 1 ? 12 : 0),
          decoration: BoxDecoration(
            color: isToday ? AppColors.primary.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isToday ? AppColors.primary : const Color(0xFFE0E0E0),
              width: 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                day,
                style: TextStyle(
                  color: isToday ? AppColors.primary : const Color(0xFF1A1A1A),
                  fontSize: 14,
                  fontFamily: 'Fredoka',
                  fontWeight: isToday ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isOpen
                    ? '${dayHours['open']}\n${dayHours['close']}'
                    : 'Chiuso',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isOpen 
                      ? (isToday ? AppColors.primary : const Color(0xFF1A1A1A))
                      : const Color(0xFF666666),
                  fontSize: 12,
                  fontFamily: 'Fredoka',
                  fontWeight: isOpen ? FontWeight.w500 : FontWeight.normal,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return widgets;
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final VoidCallback? onTap;
  final bool noBg;

  const _InfoRow({
    required this.icon,
    required this.text,
    this.onTap,
    this.noBg = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 22,
              height: 22,
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: Colors.black,
                size: 18,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  color: Color(0xFF1A1A1A),
                  fontSize: 15,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w500,
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