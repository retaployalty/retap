import 'package:flutter/material.dart';
import '../models/checkpoint.dart';
import '../services/api_service.dart';
import '../components/skeleton_components.dart';

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
  List<String> _redeemedRewardIds = [];

  @override
  void initState() {
    super.initState();
    if (widget.initialCheckpointData != null) {
      _initializeFromData(widget.initialCheckpointData!);
    } else {
      // Carica in background per non bloccare l'UI
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fetchCheckpoints();
      });
    }
    _fetchRedeemedRewards();
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

  Future<void> _fetchCheckpoints() async {
    if (!mounted) return;
    
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Chiamata diretta all'API con timeout ridotto
      final response = await ApiService.fetchCheckpoints(
        widget.merchantId,
        cardId: widget.cardId,
      ).timeout(const Duration(seconds: 5));
      
      final checkpoints = (response['checkpoint_offers'] as List?)
          ?.map((o) => Checkpoint.fromJson(o))
          .toList() ?? [];
      final currentStep = response['current_step'] as int? ?? 0;

      if (!mounted) return;
      
      setState(() {
        _checkpoints = checkpoints;
        _currentSteps = checkpoints.isNotEmpty 
            ? {checkpoints.first.id: currentStep}
            : {};
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

  Future<void> _fetchRedeemedRewards() async {
    if (widget.customerId == null) return;
    
    try {
      final response = await ApiService.fetchRedeemedCheckpointRewards(
        merchantId: widget.merchantId,
        customerId: widget.customerId!,
      ).timeout(const Duration(seconds: 3));
      
      final redeemedRewards = response['redeemed_rewards'] as List? ?? [];
      final redeemedIds = redeemedRewards
          .map((reward) => reward['checkpoint_reward_id'] as String)
          .toList();
      
      if (mounted) {
        setState(() {
          _redeemedRewardIds = redeemedIds;
        });
      }
    } catch (e) {
      debugPrint('Errore nel recupero dei premi riscattati: $e');
      // In caso di errore, inizializza con lista vuota
      if (mounted) {
        setState(() {
          _redeemedRewardIds = [];
        });
      }
    }
  }

  Future<void> _advanceCheckpoint(String offerId) async {
    if (widget.cardId == null || _isAdvancing) return;
    
    try {
      setState(() => _isAdvancing = true);
      
      final response = await ApiService.advanceCheckpoint(
        merchantId: widget.merchantId,
        cardId: widget.cardId!,
        offerId: offerId,
      );

      if (!mounted) return;

      // La risposta è ora un oggetto singolo, non una lista
      final data = response as Map<String, dynamic>;
      setState(() {
        _currentSteps[offerId] = (data['current_step'] as num?)?.toInt() ?? 1;
        _isAdvancing = false;
      });

      // Mostra feedback
      final rewardName = data['reward_name'] as String?;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(rewardName != null 
              ? '🎉 $rewardName sbloccato!' 
              : 'Checkpoint avanzato con successo!'),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Ricarica i dati per aggiornare l'UI
      _fetchCheckpoints();
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
      
      final response = await ApiService.rewindCheckpoint(
        merchantId: widget.merchantId,
        cardId: widget.cardId!,
        offerId: offerId,
      );

      if (!mounted) return;

      // La risposta è ora un oggetto singolo, non una lista
      final data = response as Map<String, dynamic>;
      setState(() {
        _currentSteps[offerId] = (data['current_step'] as num?)?.toInt() ?? 1;
        _isAdvancing = false;
      });

      // Mostra feedback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⏪ Checkpoint tornato indietro con successo!'),
            backgroundColor: Colors.orange,
          ),
        );
      }

      // Ricarica i dati per aggiornare l'UI
      _fetchCheckpoints();
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
      return SkeletonComponents.buildCheckpointOffersSkeleton();
    }

    if (_error != null) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              Icon(Icons.error, size: 48, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: TextStyle(color: Colors.red, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchCheckpoints,
                child: const Text('Riprova'),
              ),
            ],
          ),
        ),
      );
    }

    if (_checkpoints.isEmpty) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
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
                                        if (isCurrentStep && step.rewardId != null && !_redeemedRewardIds.contains(step.rewardId)) ...[
                                          const SizedBox(width: 8),
                                          SizedBox(
                                            height: 32,
                                            child: ElevatedButton.icon(
                                              onPressed: () async {
                                                try {
                                                  if (widget.customerId == null) {
                                                    throw Exception('CustomerId non disponibile');
                                                  }
                                                  await ApiService.post(
                                                    '/checkpoints/redeem-reward',
                                                    merchantId: widget.merchantId,
                                                    body: {
                                                      'customerId': widget.customerId!,
                                                      'rewardId': step.rewardId!,
                                                      'stepId': step.id,
                                                    },
                                                  );
                                                  if (!mounted) return;
                                                  
                                                  // Aggiorna immediatamente l'UI
                                                  setState(() {
                                                    _redeemedRewardIds.add(step.rewardId!);
                                                  });
                                                  
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('🎉 ${step.rewardName} riscattato con successo!'),
                                                      backgroundColor: Colors.green,
                                                    ),
                                                  );
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
                                        if (isCurrentStep && step.rewardId != null && _redeemedRewardIds.contains(step.rewardId)) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            height: 32,
                                            padding: const EdgeInsets.symmetric(horizontal: 12),
                                            decoration: BoxDecoration(
                                              color: Colors.grey[300],
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.check_circle, color: Colors.green, size: 16),
                                                const SizedBox(width: 4),
                                                const Text('Già riscattato', style: TextStyle(color: Colors.black54)),
                                              ],
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
