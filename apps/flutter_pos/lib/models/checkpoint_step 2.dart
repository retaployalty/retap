class CheckpointStep {
  final String id;
  final String merchantId;
  final int stepNumber;
  final int totalSteps;
  final String? rewardId;
  final String offerId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final CheckpointReward? reward;

  CheckpointStep({
    required this.id,
    required this.merchantId,
    required this.stepNumber,
    required this.totalSteps,
    this.rewardId,
    required this.offerId,
    required this.createdAt,
    required this.updatedAt,
    this.reward,
  });

  factory CheckpointStep.fromJson(Map<String, dynamic> json) {
    return CheckpointStep(
      id: json['id'],
      merchantId: json['merchant_id'],
      stepNumber: json['step_number'],
      totalSteps: json['total_steps'],
      rewardId: json['reward_id'],
      offerId: json['offer_id'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      reward: json['reward'] != null ? CheckpointReward.fromJson(json['reward']) : null,
    );
  }
}

class CheckpointReward {
  final String id;
  final String merchantId;
  final String name;
  final String description;
  final String icon;
  final DateTime createdAt;
  final DateTime updatedAt;

  CheckpointReward({
    required this.id,
    required this.merchantId,
    required this.name,
    required this.description,
    required this.icon,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CheckpointReward.fromJson(Map<String, dynamic> json) {
    return CheckpointReward(
      id: json['id'],
      merchantId: json['merchant_id'],
      name: json['name'],
      description: json['description'],
      icon: json['icon'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
} 