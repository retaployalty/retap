import 'package:intl/intl.dart';

/// Esempio di struttura hours:
/// {
///   "monday": [{"open": "09:00", "close": "18:00"}],
///   "tuesday": [{"open": "09:00", "close": "18:00"}],
///   ...
/// }

bool isBusinessOpen(dynamic hours) {
  if (hours == null || hours is! Map) return false;
  final now = DateTime.now();
  final weekdayLower = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ][now.weekday - 1];
  final weekdayUpper = weekdayLower[0].toUpperCase() + weekdayLower.substring(1);

  // Prova entrambe le versioni della chiave
  final todayHours = hours[weekdayLower] ?? hours[weekdayUpper];
  if (todayHours == null) return false;

  // Supporta sia lista che oggetto singolo
  final slots = todayHours is List ? todayHours : [todayHours];

  for (final slot in slots) {
    if (slot is Map && slot['closed'] == true) continue;
    final open = slot['open'];
    final close = slot['close'];
    if (open == null || close == null) continue;
    final openTime = _parseTime(open, now);
    var closeTime = _parseTime(close, now);
    if (openTime != null && closeTime != null) {
      // Se open == close, consideriamo sempre aperto
      if (open == close) return true;
      // Se close <= open, la chiusura è il giorno dopo
      if (!closeTime.isAfter(openTime)) {
        closeTime = closeTime.add(const Duration(days: 1));
      }
      if (now.isAfter(openTime) && now.isBefore(closeTime)) {
        return true;
      }
    }
  }
  return false;
}

String getTodayOpeningHours(dynamic hours) {
  if (hours == null || hours is! Map) return '';
  final now = DateTime.now();
  final weekdayLower = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ][now.weekday - 1];
  final weekdayUpper = weekdayLower[0].toUpperCase() + weekdayLower.substring(1);
  final todayHours = hours[weekdayLower] ?? hours[weekdayUpper];
  if (todayHours == null) return '';
  final slots = todayHours is List ? todayHours : [todayHours];
  final validSlots = slots.where((slot) => slot is Map && slot['closed'] != true && slot['open'] != null && slot['close'] != null).toList();
  if (validSlots.isEmpty) return '';
  // Se c'è più di uno slot, concatena
  return validSlots.map((slot) => '${slot['open']} - ${slot['close']}').join(' / ');
}

DateTime? _parseTime(String time, DateTime reference) {
  try {
    final parts = time.split(':');
    if (parts.length != 2) return null;
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);
    return DateTime(reference.year, reference.month, reference.day, hour, minute);
  } catch (_) {
    return null;
  }
} 