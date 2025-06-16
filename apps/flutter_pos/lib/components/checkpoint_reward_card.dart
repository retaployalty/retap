import 'package:flutter/material.dart';
import '../services/checkpoint_service.dart';

class CheckpointRewardCard extends StatelessWidget {
  final String customerId;
  final String merchantId;
  final String rewardId;
  final String stepId;
  final String rewardName;
  final String rewardDescription;
  final VoidCallback onRedeemed;

  const CheckpointRewardCard({
    Key? key,
    required this.customerId,
    required this.merchantId,
    required this.rewardId,
    required this.stepId,
    required this.rewardName,
    required this.rewardDescription,
    required this.onRedeemed,
  }) : super(key: key);

  Future<void> _redeemReward(BuildContext context) async {
    try {
      final checkpointService = CheckpointService();
      await checkpointService.redeemCheckpointReward(
        customerId: customerId,
        merchantId: merchantId,
        rewardId: rewardId,
        stepId: stepId,
      );
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reward riscattato con successo!'),
            backgroundColor: Colors.green,
          ),
        );
        onRedeemed();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Errore nel riscatto: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              rewardName,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              rewardDescription,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Center(
              child: ElevatedButton(
                onPressed: () => _redeemReward(context),
                child: const Text('Riscatta'),
              ),
            ),
          ],
        ),
      ),
    );
  }
} 