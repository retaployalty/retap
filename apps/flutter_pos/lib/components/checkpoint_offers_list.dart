import 'package:flutter/material.dart';
import '../models/checkpoint.dart';
import '../services/checkpoint_service.dart';
import '../services/cache_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class CheckpointOffersList extends StatefulWidget {
  final String merchantId;
  final String? cardId;
  final bool compactMode;

  const CheckpointOffersList({
    super.key,
    required this.merchantId,
    this.cardId,
    this.compactMode = false,
  });

  @override
  State<CheckpointOffersList> createState() => _CheckpointOffersListState();
}

class _CheckpointOffersListState extends State<CheckpointOffersList> {
  bool _isLoading = true;
  List<Checkpoint> _checkpoints = [];
  String? _error;
  Map<String, int> _currentSteps = {};

  @override
  void initState() {
    super.initState();
    _fetchCheckpoints();
  }

  Future<void> _fetchCheckpoints() async {
    try {
      // Prima prova a recuperare i dati dalla cache
      final cachedCheckpoints = await CacheService.getCachedCheckpoints(widget.merchantId);
      
      if (cachedCheckpoints != null) {
        if (!mounted) return;
        setState(() {
          _checkpoints = cachedCheckpoints;
          _isLoading = false;
        });
      }

      // In ogni caso, aggiorna i dati dal server
      final offers = await CheckpointService.fetchOffers(widget.merchantId);
      final checkpoints = offers.map((offer) => Checkpoint(
        id: offer.id,
        merchantId: offer.merchantId,
        name: offer.name,
        description: offer.description,
        totalSteps: offer.totalSteps,
        steps: offer.steps?.map((step) => CheckpointStep(
          id: step.id,
          stepNumber: step.stepNumber,
          totalSteps: step.totalSteps,
          rewardId: step.rewardId,
          rewardName: step.reward?.name,
          rewardDescription: step.reward?.description,
        )).toList(),
      )).toList();
      
      // Salva i nuovi dati in cache
      await CacheService.cacheCheckpoints(widget.merchantId, checkpoints);
      
      if (!mounted) return;
      setState(() {
        _checkpoints = checkpoints;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Errore: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _advanceCheckpoint(String offerId) async {
    if (widget.cardId == null) return;
    
    try {
      final response = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/checkpoints/advance'),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'cardId': widget.cardId,
          'offerId': offerId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _currentSteps[offerId] = data['current_step'];
        });

        // Show success message if there's a reward
        if (data['reward_name'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 ${data['reward_name']} sbloccato!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(child: Text(_error!, style: const TextStyle(color: Colors.red)));
    }

    if (_checkpoints.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.card_giftcard_outlined,
              size: 48,
              color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'Nessuna offerta disponibile',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
              ),
            ),
          ],
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // List of offers with details
            ..._checkpoints.map((checkpoint) {
              final currentStep = _currentSteps[checkpoint.id] ?? 1;
              final progress = (currentStep / checkpoint.totalSteps).clamp(0.0, 1.0);
              
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress indicator
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                            minHeight: 8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$currentStep/${checkpoint.totalSteps}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Steps timeline
                  if (checkpoint.steps != null && checkpoint.steps!.isNotEmpty)
                    ...checkpoint.steps!.map<Widget>((step) {
                      final isCurrentStep = step.stepNumber == currentStep;
                      final isCompleted = step.stepNumber < currentStep;
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isCurrentStep
                              ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                              : Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isCurrentStep
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).colorScheme.outline.withOpacity(0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: isCompleted
                                    ? Colors.green
                                    : isCurrentStep
                                        ? Theme.of(context).colorScheme.primary
                                        : Theme.of(context).colorScheme.outline.withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: isCompleted
                                    ? const Icon(Icons.check, color: Colors.white, size: 16)
                                    : Text(
                                        '${step.stepNumber}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (step.rewardName != null) ...[
                                    Text(
                                      step.rewardName!,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: isCurrentStep
                                            ? Theme.of(context).colorScheme.primary
                                            : Theme.of(context).colorScheme.onSurface,
                                        fontSize: 13,
                                      ),
                                    ),
                                    if (step.rewardDescription?.isNotEmpty ?? false) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        step.rewardDescription!,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                                        ),
                                      ),
                                    ],
                                  ] else ...[
                                    Text(
                                      'Step ${step.stepNumber}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                ],
              );
            }).toList(),

            const SizedBox(height: 16),

            // Large advance button at the bottom
            if (widget.cardId != null && _checkpoints.isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: () => _advanceCheckpoint(_checkpoints.first.id),
                  icon: const Icon(Icons.add, size: 24),
                  label: const Text(
                    'Avanza Checkpoint',
                    style: TextStyle(fontSize: 16),
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.zero,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
