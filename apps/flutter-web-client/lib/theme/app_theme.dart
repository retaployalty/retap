import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFE53935); // Rosso principale
  static const Color background = Colors.white;
  static const Color accent = Color(0xFFFFCDD2); // Rosso chiaro
  static const Color text = Colors.black87;
  static const Color badge = Color(0xFFFFEBEE); // Badge rosato
  static const Color navUnselected = Color(0xFFF8BBD0); // Rosso molto chiaro
}

final ThemeData appTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.background,
    background: AppColors.background,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: AppColors.background,
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
    unselectedItemColor: AppColors.navUnselected,
    selectedIconTheme: IconThemeData(color: AppColors.primary),
    unselectedIconTheme: IconThemeData(color: AppColors.navUnselected),
    showUnselectedLabels: true,
    showSelectedLabels: true,
    type: BottomNavigationBarType.fixed,
  ),
  textTheme: const TextTheme(
    titleMedium: TextStyle(
      color: AppColors.text,
      fontWeight: FontWeight.bold,
    ),
    bodyMedium: TextStyle(
      color: AppColors.text,
    ),
  ),
  fontFamily: 'Arial',
); 