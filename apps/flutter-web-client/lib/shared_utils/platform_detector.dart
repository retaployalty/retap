import 'dart:html' as html;

class PlatformDetector {
  static bool get isApplePlatform {
    final userAgent = html.window.navigator.userAgent.toLowerCase();
    
    print('🔍 DEBUG PlatformDetector:');
    print('User Agent completo: ${html.window.navigator.userAgent}');
    print('User Agent lowercase: $userAgent');
    
    // iOS devices
    if (userAgent.contains('iphone') || 
        userAgent.contains('ipad') || 
        userAgent.contains('ipod')) {
      print('✅ Rilevato iOS device');
      return true;
    }
    
    // macOS
    if (userAgent.contains('macintosh') || 
        userAgent.contains('mac os') ||
        userAgent.contains('macos')) {
      print('✅ Rilevato macOS');
      return true;
    }
    
    // Safari browser (anche su Windows/Linux, ma più probabile su Apple)
    if (userAgent.contains('safari') && !userAgent.contains('chrome')) {
      print('✅ Rilevato Safari browser');
      return true;
    }
    
    print('❌ Non rilevata piattaforma Apple, usando Google Wallet');
    return false;
  }
  
  static bool get isIOS {
    final userAgent = html.window.navigator.userAgent.toLowerCase();
    return userAgent.contains('iphone') || 
           userAgent.contains('ipad') || 
           userAgent.contains('ipod');
  }
  
  static bool get isMacOS {
    final userAgent = html.window.navigator.userAgent.toLowerCase();
    return userAgent.contains('macintosh') || 
           userAgent.contains('mac os') ||
           userAgent.contains('macos');
  }
  
  static bool get isAndroid {
    final userAgent = html.window.navigator.userAgent.toLowerCase();
    return userAgent.contains('android');
  }
  
  static String get platformName {
    if (isIOS) return 'iOS';
    if (isMacOS) return 'macOS';
    if (isAndroid) return 'Android';
    return 'Web';
  }
  
  static String get walletType {
    if (isApplePlatform) return 'Apple Wallet';
    return 'Google Wallet';
  }
} 