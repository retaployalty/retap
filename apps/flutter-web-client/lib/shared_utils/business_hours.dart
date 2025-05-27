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
  final weekday = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ][now.weekday - 1];
  final todayHours = hours[weekday];
  if (todayHours == null || todayHours is! List || todayHours.isEmpty) return false;
  for (final slot in todayHours) {
    final open = slot['open'];
    final close = slot['close'];
    if (open == null || close == null) continue;
    final openTime = _parseTime(open, now);
    final closeTime = _parseTime(close, now);
    if (openTime != null && closeTime != null) {
      if (now.isAfter(openTime) && now.isBefore(closeTime)) {
        return true;
      }
    }
  }
  return false;
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