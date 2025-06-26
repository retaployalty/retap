import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFFFF6565);
  static const Color primaryPressed = Color(0xFFE62C2C);
  static const Color primaryDisabled = Color(0xFFE6E6E6);

  // Secondary Colors
  static const Color secondary = Color(0xFFFFFFFF);
  static const Color secondaryPressed = Color(0xFFE0E0E0);
  static const Color secondaryDisabled = Color(0xFFF5F5F5);

  // Tertiary Colors
  static const Color tertiary = Color(0xFF1A1A1A);
  static const Color tertiaryPressed = Color(0xFF000000);

  // Status Colors
  static const Color success = Color(0xFF28A745);

  // Background Colors
  static const Color background = Colors.white;
  static const Color surface = Color(0xFFF8F9FA);

  // Text Colors
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textDisabled = Color(0xFF999999);
}

final ThemeData appTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    onPrimary: AppColors.secondary,
    primaryContainer: AppColors.primaryPressed,
    secondary: AppColors.secondary,
    onSecondary: AppColors.tertiary,
    secondaryContainer: AppColors.secondaryPressed,
    tertiary: AppColors.tertiary,
    onTertiary: AppColors.secondary,
    tertiaryContainer: AppColors.tertiaryPressed,
    background: AppColors.background,
    surface: AppColors.surface,
    error: Colors.red,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: const Color(0xFFF5F5F5),
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.background,
    foregroundColor: AppColors.primary,
    elevation: 0,
    iconTheme: IconThemeData(color: AppColors.primary),
    titleTextStyle: TextStyle(
      color: AppColors.primary,
      fontWeight: FontWeight.bold,
      fontSize: 22,
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.background,
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.textSecondary,
    selectedIconTheme: IconThemeData(color: AppColors.primary),
    unselectedIconTheme: IconThemeData(color: AppColors.textSecondary),
    showUnselectedLabels: true,
    showSelectedLabels: true,
    type: BottomNavigationBarType.fixed,
  ),
  textTheme: const TextTheme(
    titleLarge: TextStyle(
      color: AppColors.textPrimary,
      fontWeight: FontWeight.bold,
      fontSize: 24,
    ),
    titleMedium: TextStyle(
      color: AppColors.textPrimary,
      fontWeight: FontWeight.bold,
      fontSize: 18,
    ),
    bodyLarge: TextStyle(
      color: AppColors.textPrimary,
      fontSize: 16,
    ),
    bodyMedium: TextStyle(
      color: AppColors.textPrimary,
      fontSize: 14,
    ),
    bodySmall: TextStyle(
      color: AppColors.textSecondary,
      fontSize: 12,
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.secondary,
      disabledBackgroundColor: AppColors.primaryDisabled,
      disabledForegroundColor: AppColors.textDisabled,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primary,
      side: const BorderSide(color: AppColors.primary),
      disabledForegroundColor: AppColors.primaryDisabled,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.primary,
      disabledForegroundColor: AppColors.primaryDisabled,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.secondary,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.primaryDisabled),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.primaryDisabled),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: AppColors.primary),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Colors.red),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  ),
); 