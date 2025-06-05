class Checkpoint {
  final String id;
  final String merchantId;
  final String name;
  final String description;
  final int totalSteps;
  final List<CheckpointStep>? steps;

  Checkpoint({
    required this.id,
    required this.merchantId,
    required this.name,
    required this.description,
    required this.totalSteps,
    this.steps,
  });

  factory Checkpoint.fromJson(Map<String, dynamic> json) {
    return Checkpoint(
      id: json['id'] as String,
      merchantId: json['merchant_id'] as String? ?? '',
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      totalSteps: json['total_steps'] as int,
      steps: json['steps'] != null
          ? (json['steps'] as List)
              .map((step) => CheckpointStep.fromJson(step as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'merchant_id': merchantId,
      'name': name,
      'description': description,
      'total_steps': totalSteps,
      'steps': steps?.map((step) => step.toJson()).toList(),
    };
  }
}

class CheckpointStep {
  final String id;
  final int stepNumber;
  final int totalSteps;
  final String? rewardId;
  final String? rewardName;
  final String? rewardDescription;

  CheckpointStep({
    required this.id,
    required this.stepNumber,
    required this.totalSteps,
    this.rewardId,
    this.rewardName,
    this.rewardDescription,
  });

  factory CheckpointStep.fromJson(Map<String, dynamic> json) {
    final reward = json['reward'] as Map<String, dynamic>?;
    return CheckpointStep(
      id: json['id'] as String,
      stepNumber: json['step_number'] as int,
      totalSteps: json['total_steps'] as int? ?? 0,
      rewardId: json['reward_id'] as String?,
      rewardName: reward?['name'] as String?,
      rewardDescription: reward?['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'step_number': stepNumber,
      'total_steps': totalSteps,
      'reward_id': rewardId,
      'reward_name': rewardName,
      'reward_description': rewardDescription,
    };
  }
} 