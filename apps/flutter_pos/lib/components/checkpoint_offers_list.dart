import 'package:flutter/material.dart';
import '../models/checkpoint_offer.dart';
import '../services/checkpoint_service.dart';
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
  List<CheckpointOffer> _offers = [];
  String? _error;
  Map<String, int> _currentSteps = {};

  @override
  void initState() {
    super.initState();
    _fetchOffers();
  }

  Future<void> _fetchOffers() async {
    try {
      final offers = await CheckpointService.fetchOffers(widget.merchantId);
      if (!mounted) return;
      
      // Fetch current steps only if cardId is provided
      if (widget.cardId != null) {
        for (var offer in offers) {
          final response = await http.get(
            Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/checkpoints?cardId=${widget.cardId}&offerId=${offer.id}'),
            headers: {
              'x-merchant-id': widget.merchantId,
              'Content-Type': 'application/json',
            },
          );
          
          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            _currentSteps[offer.id] = data['current_step'] ?? 1;
          }
        }
      }

      setState(() {
        _offers = offers;
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

    if (_offers.isEmpty) {
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
            ..._offers.map((offer) {
              final currentStep = _currentSteps[offer.id] ?? 1;
              final progress = (currentStep / offer.totalSteps).clamp(0.0, 1.0);
              
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
                        '$currentStep/${offer.totalSteps}',
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
                  if (offer.steps != null && offer.steps!.isNotEmpty)
                    ...offer.steps!.map<Widget>((step) {
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
                                  if (step.reward != null) ...[
                                    Text(
                                      step.reward!.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: isCurrentStep
                                            ? Theme.of(context).colorScheme.primary
                                            : Theme.of(context).colorScheme.onSurface,
                                        fontSize: 13,
                                      ),
                                    ),
                                    if (step.reward!.description.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        step.reward!.description,
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
            if (widget.cardId != null && _offers.isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: () => _advanceCheckpoint(_offers.first.id),
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
