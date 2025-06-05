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
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 22),
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
      constraints: const BoxConstraints(
        maxHeight: 340,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Storico attività',
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
            'Tutte le tue attività con questo negozio',
            style: TextStyle(
              color: Color(0xFF1A1A1A),
              fontSize: 16,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w500,
              height: 1.40,
              letterSpacing: 0.48,
            ),
          ),
          const SizedBox(height: 18),
          if (history.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text(
                  'Nessuna attività da mostrare',
                  style: TextStyle(
                    color: Color(0xFF666666),
                    fontSize: 15,
                    fontFamily: 'Fredoka',
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: history.length,
                separatorBuilder: (context, index) => const Divider(height: 14, color: Colors.transparent),
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
    return Row(
      children: [
        // Data pill
        Container(
          constraints: const BoxConstraints(minWidth: 100, maxWidth: 130),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          height: 36,
          decoration: ShapeDecoration(
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _formatDate(item.date),
                style: const TextStyle(
                  color: Color(0xFF1A1A1A),
                  fontSize: 15,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Text(
                ' / ',
                style: TextStyle(
                  color: Color(0xFF666666),
                  fontSize: 15,
                  fontFamily: 'Fredoka',
                ),
              ),
              Text(
                _formatTime(item.date),
                style: const TextStyle(
                  color: Color(0xFF666666),
                  fontSize: 15,
                  fontFamily: 'Fredoka',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        // Reward/points pill
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          height: 36,
          decoration: ShapeDecoration(
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getIcon(item.type),
                  color: _getPillIconColor(item.type),
                  size: 20,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _getValue(item),
                style: TextStyle(
                  color: _getPillTextColor(item.type),
                  fontSize: 16,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCheck = DateTime(date.year, date.month, date.day);

    if (dateToCheck == today) {
      return 'Oggi';
    } else if (dateToCheck == yesterday) {
      return 'Ieri';
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