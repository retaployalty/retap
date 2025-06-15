import 'package:flutter/material.dart';
import '../models/checkpoint.dart';
import '../services/checkpoint_service.dart';
import '../services/cache_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';

class CheckpointOffersList extends StatefulWidget {
  final String merchantId;
  final String? cardId;
  final String? customerId;
  final bool compactMode;
  final Map<String, dynamic>? initialCheckpointData;

  const CheckpointOffersList({
    super.key,
    required this.merchantId,
    this.cardId,
    this.customerId,
    this.compactMode = false,
    this.initialCheckpointData,
  });

  @override
  State<CheckpointOffersList> createState() => _CheckpointOffersListState();
}

class _CheckpointOffersListState extends State<CheckpointOffersList> {
  bool _isLoading = true;
  List<Checkpoint> _checkpoints = [];
  String? _error;
  Map<String, int> _currentSteps = {};
  bool _isAdvancing = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialCheckpointData != null) {
      _initializeFromData(widget.initialCheckpointData!);
    } else {
      _fetchCheckpoints();
    }
  }

  void _initializeFromData(Map<String, dynamic> data) {
    try {
      final offers = (data['offers'] as List).map((o) => Checkpoint.fromJson(o)).toList();
      final steps = (data['steps'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, value as int)
      );
      
      setState(() {
        _checkpoints = offers;
        _currentSteps = steps;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Errore nel parsing dei dati: $e';
        _isLoading = false;
      });
    }
  }

  @override
  void didUpdateWidget(CheckpointOffersList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.cardId != widget.cardId || oldWidget.initialCheckpointData != widget.initialCheckpointData) {
      if (widget.initialCheckpointData != null) {
        _initializeFromData(widget.initialCheckpointData!);
      } else {
        _fetchCheckpoints();
      }
    }
  }

  Future<void> _fetchCheckpoints() async {
    if (!mounted) return;
    
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final response = await CheckpointService.fetchOffers(widget.merchantId, cardId: widget.cardId);
      final offers = response['checkpoints'] as List<Checkpoint>;
      final currentStep = response['currentStep'] as int;
      
      if (!mounted) return;
      
      setState(() {
        _checkpoints = offers;
        _currentSteps = offers.isNotEmpty ? {offers.first.id: currentStep} : {};
        _isLoading = false;
      });

      // Cache in background
      if (offers.isNotEmpty) {
        Future.microtask(() => CacheService.cacheCheckpoints(widget.merchantId, offers));
      }
    } catch (e) {
      if (!mounted) return;
      
      try {
        final cachedCheckpoints = await CacheService.getCachedCheckpoints(widget.merchantId);
        if (cachedCheckpoints != null && mounted) {
          setState(() {
            _checkpoints = cachedCheckpoints;
            _currentSteps = {};
            _isLoading = false;
          });
          return;
        }
      } catch (cacheError) {
        debugPrint('Cache fallback failed: $cacheError');
      }
      
      setState(() {
        _error = 'Errore: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _advanceCheckpoint(String offerId) async {
    if (widget.cardId == null || _isAdvancing) return;
    
    try {
      setState(() => _isAdvancing = true);
      
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

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body)[0];
        setState(() {
          _currentSteps[offerId] = data['current_step'];
          _isAdvancing = false;
        });

        if (data['reward_name'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 ${data['reward_name']} sbloccato!'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Checkpoint avanzato con successo!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Errore ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isAdvancing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _rewindCheckpoint(String offerId) async {
    if (widget.cardId == null || _isAdvancing) return;
    
    try {
      setState(() => _isAdvancing = true);
      
      final response = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/checkpoints/rewind'),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'cardId': widget.cardId,
          'offerId': offerId,
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body)[0];
        setState(() {
          _currentSteps[offerId] = data['current_step'];
          _isAdvancing = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Checkpoint arretrato con successo!'),
            backgroundColor: Colors.orange,
          ),
        );
      } else {
        throw Exception('Errore ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isAdvancing = false);
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
            ..._checkpoints.map((checkpoint) {
              final currentStep = _currentSteps[checkpoint.id] ?? 1;
              final progress = (currentStep / checkpoint.totalSteps).clamp(0.0, 1.0);
              
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
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
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
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
                                            ],
                                          ),
                                        ),
                                        if (isCurrentStep && step.rewardId != null) ...[
                                          const SizedBox(width: 8),
                                          SizedBox(
                                            height: 32,
                                            child: ElevatedButton.icon(
                                              onPressed: () async {
                                                try {
                                                  if (widget.customerId == null) {
                                                    throw Exception('CustomerId non disponibile');
                                                  }
                                                  await CheckpointService().redeemCheckpointReward(
                                                    customerId: widget.customerId!,
                                                    merchantId: widget.merchantId,
                                                    rewardId: step.rewardId!,
                                                    stepId: step.id,
                                                  );
                                                  if (!mounted) return;
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('🎉 ${step.rewardName} riscattato con successo!'),
                                                      backgroundColor: Colors.green,
                                                    ),
                                                  );
                                                  _fetchCheckpoints();
                                                } catch (e) {
                                                  if (!mounted) return;
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('Errore: $e'),
                                                      backgroundColor: Colors.red,
                                                    ),
                                                  );
                                                }
                                              },
                                              icon: const Icon(Icons.card_giftcard, size: 16),
                                              label: const Text('Riscatta'),
                                              style: ElevatedButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                                backgroundColor: Colors.amber[700],
                                                foregroundColor: Colors.white,
                                                elevation: 2,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
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

            if (widget.cardId != null && _checkpoints.isNotEmpty)
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: _isAdvancing ? null : () => _rewindCheckpoint(_checkpoints.first.id),
                        icon: const Icon(Icons.remove, size: 24),
                        label: const Text(
                          'Togli',
                          style: TextStyle(fontSize: 16),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          backgroundColor: Theme.of(context).colorScheme.error,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 3,
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: _isAdvancing ? null : () => _advanceCheckpoint(_checkpoints.first.id),
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
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
