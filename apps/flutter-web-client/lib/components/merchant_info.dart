import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../shared_utils/business_hours.dart';

class MerchantInfo extends StatefulWidget {
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
  State<MerchantInfo> createState() => _MerchantInfoState();
}

class _MerchantInfoState extends State<MerchantInfo> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    
    // Centra automaticamente sul giorno corrente dopo il build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _centerOnCurrentDay();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _centerOnCurrentDay() {
    if (!_scrollController.hasClients) return;
    
    final now = DateTime.now();
    final currentDay = now.weekday - 1; // 0 = Monday, 6 = Sunday
    
    // Calcola la posizione per centrare il giorno corrente
    final itemWidth = 100.0; // larghezza di ogni item
    final spacing = 12.0; // margine tra gli item
    final screenWidth = MediaQuery.of(context).size.width;
    final containerPadding = 20.0; // padding del container
    
    // Calcola la posizione del giorno corrente
    final currentDayPosition = currentDay * (itemWidth + spacing);
    
    // Calcola la posizione di scroll per centrare
    final scrollPosition = currentDayPosition - (screenWidth - containerPadding * 2) / 2 + itemWidth / 2;
    
    // Applica lo scroll con animazione
    _scrollController.animateTo(
      scrollPosition.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOutCubic,
    );
  }

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
          Text(
            'Contacts',
            style: AppTextStyles.headlineSmall.copyWith(color: Color(0xFF1A1A1A)),
          ),
          const SizedBox(height: 18),
          _InfoRow(
            icon: Icons.store,
            text: widget.name,
            noBg: true,
          ),
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          _InfoRow(
            icon: Icons.category,
            text: widget.industry,
            noBg: true,
          ),
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          _InfoRow(
            icon: Icons.location_on,
            text: widget.address,
            onTap: widget.googleMapsUrl != null
                ? () async {
                    final url = Uri.parse(widget.googleMapsUrl!);
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url);
                    }
                  }
                : null,
            noBg: true,
          ),
          if (widget.phone != null) ...[
            const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
            _InfoRow(
              icon: Icons.phone,
              text: widget.phone!,
              onTap: () async {
                final url = Uri.parse('tel:${widget.phone}');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url);
                }
              },
              noBg: true,
            ),
          ],
          const Divider(height: 18, thickness: 1, color: Color(0xFFE6E6E6)),
          Text(
            'Opening Hours',
            style: AppTextStyles.titleMedium.copyWith(color: Color(0xFF1A1A1A)),
          ),
          const SizedBox(height: 12),
          if (widget.hours != null)
            SizedBox(
              height: 100,
              child: ListView(
                controller: _scrollController,
                scrollDirection: Axis.horizontal,
                children: _buildHoursList(widget.hours),
              ),
            )
          else
            Text(
              'Opening hours not available',
              style: AppTextStyles.bodySmall.copyWith(color: Color(0xFF666666)),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildHoursList(dynamic hours) {
    final days = [
      'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    ];
    final fullDayNames = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    final List<Widget> widgets = [];
    final now = DateTime.now();
    final currentDay = now.weekday - 1; // 0 = Monday, 6 = Sunday

    for (var i = 0; i < days.length; i++) {
      final day = days[i];
      final fullDayName = fullDayNames[i];
      final dayHours = _extractDayHours(hours, fullDayName);
      final isOpen = dayHours != null;
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
                style: AppTextStyles.bodySmall.copyWith(
                  color: isToday ? AppColors.primary : const Color(0xFF1A1A1A),
                  fontWeight: isToday ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isOpen ? dayHours! : 'Closed',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodySmall.copyWith(
                  color: isOpen 
                      ? (isToday ? AppColors.primary : const Color(0xFF1A1A1A))
                      : const Color(0xFF666666),
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

  String? _extractDayHours(dynamic hours, String dayKey) {
    if (hours == null || hours is! Map) return null;
    
    // Usa la stessa logica di business_hours.dart
    final dayData = hours[dayKey];
    if (dayData == null) return null;
    
    // Supporta sia lista che oggetto singolo
    final slots = dayData is List ? dayData : [dayData];
    final validSlots = slots.where((slot) => 
      slot is Map && 
      slot['closed'] != true && 
      slot['open'] != null && 
      slot['close'] != null
    ).toList();
    
    if (validSlots.isEmpty) return null;
    
    // Se c'è più di uno slot, concatena
    return validSlots.map((slot) => '${slot['open']}\n${slot['close']}').join(' / ');
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
    final bool isLink = onTap != null;
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
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      text,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: isLink ? Color(0xFF2563EB) : Color(0xFF1A1A1A),
                        fontWeight: isLink ? FontWeight.w600 : FontWeight.w500,
                        decoration: TextDecoration.none,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isLink)
                    Padding(
                      padding: const EdgeInsets.only(left: 2),
                      child: Icon(
                        Icons.open_in_new,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
} 