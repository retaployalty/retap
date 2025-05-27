import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CategoryFilters extends StatelessWidget {
  final String? selectedCategory;
  final void Function(String?) onCategorySelected;
  final Map<String, IconData> businessCategories;
  final bool showAll;

  const CategoryFilters({
    Key? key,
    required this.selectedCategory,
    required this.onCategorySelected,
    required this.businessCategories,
    this.showAll = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final categories = showAll
        ? ['All', ...businessCategories.keys]
        : businessCategories.keys.toList();
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((category) {
          final isAll = category == 'All';
          final isSelected = (selectedCategory == null && isAll) || (selectedCategory == category);
          final icon = isAll ? null : businessCategories[category];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: GestureDetector(
              onTap: () => onCategorySelected(isAll ? null : category),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.grey[200],
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.10),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : [],
                ),
                child: Row(
                  children: [
                    if (icon != null) ...[
                      Icon(
                        icon,
                        color: isSelected ? Colors.white : Colors.grey,
                        size: 26,
                      ),
                      const SizedBox(width: 10),
                    ],
                    Text(
                      category,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey,
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
} 