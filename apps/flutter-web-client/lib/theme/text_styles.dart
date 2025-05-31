import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_theme.dart';

class AppTextStyles {
  static TextStyle _getFredoka({
    required double fontSize,
    required FontWeight fontWeight,
    double? height,
  }) {
    return GoogleFonts.fredoka(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: AppColors.textPrimary,
      letterSpacing: 0,
      height: height,
    ).copyWith(
      fontFamilyFallback: const ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    );
  }

  // Display
  static final displayLarge = _getFredoka(
    fontSize: 57,
    fontWeight: FontWeight.w700,
  );
  static final displayMedium = _getFredoka(
    fontSize: 45,
    fontWeight: FontWeight.w700,
  );
  static final displaySmall = _getFredoka(
    fontSize: 36,
    fontWeight: FontWeight.w600,
    height: 1.0,
  );

  // Headline
  static final headlineLarge = _getFredoka(
    fontSize: 32,
    fontWeight: FontWeight.w700,
  );
  static final headlineMedium = _getFredoka(
    fontSize: 28,
    fontWeight: FontWeight.w700,
  );
  static final headlineSmall = _getFredoka(
    fontSize: 24,
    fontWeight: FontWeight.w700,
  );

  // Title
  static final titleLarge = _getFredoka(
    fontSize: 22,
    fontWeight: FontWeight.w700,
  );
  static final titleMedium = _getFredoka(
    fontSize: 16,
    fontWeight: FontWeight.w700,
  );
  static final titleSmall = _getFredoka(
    fontSize: 14,
    fontWeight: FontWeight.w700,
  );

  // Body
  static final bodyLarge = _getFredoka(
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );
  static final bodyMedium = _getFredoka(
    fontSize: 14,
    fontWeight: FontWeight.w400,
  );
  static final bodySmall = _getFredoka(
    fontSize: 12,
    fontWeight: FontWeight.w400,
  );

  // Label
  static final labelLarge = _getFredoka(
    fontSize: 14,
    fontWeight: FontWeight.w700,
  );
  static final labelMedium = _getFredoka(
    fontSize: 12,
    fontWeight: FontWeight.w700,
  );
  static final labelSmall = _getFredoka(
    fontSize: 11,
    fontWeight: FontWeight.w700,
  );
} 