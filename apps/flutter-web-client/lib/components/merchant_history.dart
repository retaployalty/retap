import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

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
    if (history.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Nessuna attività recente',
            style: TextStyle(
              color: Color(0xFF666666),
              fontSize: 16,
              fontFamily: 'Fredoka',
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: history.length,
      itemBuilder: (context, index) {
        final item = history[index];
        final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
        
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: item.type == 'transaction' 
                    ? const Color(0xFF4CAF50).withOpacity(0.1)
                    : const Color(0xFF2196F3).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                item.type == 'transaction' 
                    ? Icons.point_of_sale 
                    : item.type == 'checkpoint_reward'
                        ? Icons.card_giftcard
                        : Icons.flag,
                color: item.type == 'transaction' 
                    ? const Color(0xFF4CAF50)
                    : const Color(0xFF2196F3),
              ),
            ),
            title: Text(
              item.type == 'transaction'
                  ? '${item.points > 0 ? '+' : ''}${item.points} punti'
                  : item.type == 'checkpoint_reward'
                      ? '${item.offerName ?? 'Checkpoint'} - Step ${item.stepNumber}'
                      : '${item.offerName ?? 'Checkpoint'} - Avanzato a step ${item.stepNumber}/${item.totalSteps}',
              style: const TextStyle(
                color: Color(0xFF1A1A1A),
                fontSize: 16,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w500,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.type == 'checkpoint_reward' && item.rewardName != null)
                  Text(
                    item.rewardName!,
                    style: const TextStyle(
                      color: Color(0xFF666666),
                      fontSize: 14,
                      fontFamily: 'Fredoka',
                    ),
                  ),
                Text(
                  dateFormat.format(item.date),
                  style: const TextStyle(
                    color: Color(0xFF666666),
                    fontSize: 14,
                    fontFamily: 'Fredoka',
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
} 