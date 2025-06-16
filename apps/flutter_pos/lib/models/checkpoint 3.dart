class Checkpoint {
  final String id;
  final String merchantId;
  final String name;
  final String description;
  final int totalSteps;
  final List<CheckpointStep> steps;

  Checkpoint({
    required this.id,
    required this.merchantId,
    required this.name,
    required this.description,
    required this.totalSteps,
    required this.steps,
  });

  factory Checkpoint.fromJson(Map<String, dynamic> json) {
    return Checkpoint(
      id: json['id'],
      merchantId: json['merchant_id'],
      name: json['name'],
      description: json['description'],
      totalSteps: json['total_steps'],
      steps: (json['steps'] as List)
          .map((step) => CheckpointStep.fromJson(step))
          .toList(),
    );
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
    return CheckpointStep(
      id: json['id'],
      stepNumber: json['step_number'],
      totalSteps: json['total_steps'],
      rewardId: json['reward_id'],
      rewardName: json['reward_name'],
      rewardDescription: json['reward_description'],
    );
  }
} 