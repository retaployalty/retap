import 'package:shared_preferences/shared_preferences.dart';

class MerchantService {
  static const String _merchantIdKey = 'selected_merchant_id';
  static const String _merchantNameKey = 'selected_merchant_name';

  static Future<void> saveSelectedMerchant(String merchantId, String merchantName) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_merchantIdKey, merchantId);
    await prefs.setString(_merchantNameKey, merchantName);
  }

  static Future<Map<String, String?>> getSelectedMerchant() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString(_merchantIdKey),
      'name': prefs.getString(_merchantNameKey),
    };
  }

  static Future<void> clearSelectedMerchant() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_merchantIdKey);
    await prefs.remove(_merchantNameKey);
  }
} 