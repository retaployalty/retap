import 'checkpoint_step.dart';

class CheckpointOffer {
  final String id;
  final String merchantId;
  final String name;
  final String description;
  final int totalSteps;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<CheckpointStep>? steps;

  CheckpointOffer({
    required this.id,
    required this.merchantId,
    required this.name,
    required this.description,
    required this.totalSteps,
    required this.createdAt,
    required this.updatedAt,
    this.steps,
  });

  factory CheckpointOffer.fromJson(Map<String, dynamic> json) {
    return CheckpointOffer(
      id: json['id'],
      merchantId: json['merchant_id'],
      name: json['name'],
      description: json['description'],
      totalSteps: json['total_steps'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      steps: json['steps'] != null 
        ? (json['steps'] as List).map((step) => CheckpointStep.fromJson(step)).toList()
        : null,
    );
  }
} 