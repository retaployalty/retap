import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TransactionHistory {
  final DateTime date;
  final int points;
  final String type; // 'transaction', 'checkpoint_reward', or 'checkpoint_advancement'
  final String? rewardName; // For checkpoint rewards
  final int? stepNumber; // For checkpoint steps
  final String? offerName; // For checkpoint offers
  final int? totalSteps; // For checkpoint advancements

  TransactionHistory({
    required this.date,
    required this.points,
    required this.type,
    this.rewardName,
    this.stepNumber,
    this.offerName,
    this.totalSteps,
  });
}

class MerchantHistory extends StatelessWidget {
  final List<TransactionHistory> history;

  const MerchantHistory({
    super.key,
    required this.history,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
            'Activity History',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 22,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w600,
              height: 1.10,
              letterSpacing: 0.66,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'All your activities with this business',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 16,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w500,
              height: 1.40,
              letterSpacing: 0.48,
            ),
          ),
          const SizedBox(height: 16),
          if (history.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'No activity to show',
                  style: TextStyle(
                    color: Color(0xFF666666),
                    fontSize: 15,
                    fontFamily: 'Fredoka',
                  ),
                ),
              ),
            )
          else
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: history.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final item = history[index];
                  return _HistoryItem(item: item);
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _HistoryItem extends StatelessWidget {
  final TransactionHistory item;

  const _HistoryItem({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon and type indicator
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _getPillIconColor(item.type).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getIcon(item.type),
              color: _getPillIconColor(item.type),
              size: 20,
            ),
          ),
          const SizedBox(height: 8),
          // Date and Time
          Text(
            '${_formatDate(item.date)} ${_formatTime(item.date)}',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 13,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          // Value
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _getPillIconColor(item.type).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _getValue(item),
              style: TextStyle(
                color: _getPillTextColor(item.type),
                fontSize: 14,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCheck = DateTime(date.year, date.month, date.day);

    if (dateToCheck == today) {
      return 'Today';
    } else if (dateToCheck == yesterday) {
      return 'Yesterday';
    } else {
      return '${date.day}/${date.month}';
    }
  }

  String _formatTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'transaction':
        return Icons.point_of_sale;
      case 'checkpoint_reward':
        return Icons.card_giftcard;
      case 'checkpoint_advancement':
        return Icons.flag;
      default:
        return Icons.info;
    }
  }

  Color _getPillIconColor(String type) {
    if (type == 'transaction') {
      return AppColors.primary;
    } else {
      return Colors.black;
    }
  }

  Color _getPillTextColor(String type) {
    if (type == 'transaction') {
      return AppColors.primary;
    } else {
      return Colors.black;
    }
  }

  String _getValue(TransactionHistory item) {
    switch (item.type) {
      case 'transaction':
        return '${item.points > 0 ? '+' : ''}${item.points}';
      case 'checkpoint_reward':
        return '+1';
      case 'checkpoint_advancement':
        return '+1';
      default:
        return '';
    }
  }
} 