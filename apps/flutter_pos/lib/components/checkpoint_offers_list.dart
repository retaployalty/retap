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
  final VoidCallback? onCheckpointAdvanced;

  const CheckpointOffersList({
    super.key,
    required this.merchantId,
    this.cardId,
    this.customerId,
    this.compactMode = false,
    this.initialCheckpointData,
    this.onCheckpointAdvanced,
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

      // Notifica che un checkpoint è stato avanzato per aggiornare la history
      widget.onCheckpointAdvanced?.call();

      // Ricarica i dati per aggiornare l'UI
      _fetchCheckpoints();
      _fetchRedeemedRewards();
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

      // Notifica che un checkpoint è stato modificato per aggiornare la history
      widget.onCheckpointAdvanced?.call();

      // Ricarica i dati per aggiornare l'UI
      _fetchCheckpoints();
      _fetchRedeemedRewards();
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

  Future<void> _redeemCheckpointReward(String stepId, String rewardId, String rewardName) async {
    if (widget.cardId == null || _isAdvancing) return;
    
    try {
      setState(() => _isAdvancing = true);
      
      final response = await ApiService.redeemCheckpointReward(
        merchantId: widget.merchantId,
        cardId: widget.cardId!,
        stepId: stepId,
        rewardId: rewardId,
      );

      if (!mounted) return;

      setState(() => _isAdvancing = false);

      // Aggiungi il reward alla lista dei riscattati
      setState(() {
        _redeemedRewardIds.add(rewardId);
      });

      // Mostra feedback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎁 $rewardName riscattato con successo!'),
            backgroundColor: Colors.green,

          ),
        );
      }

      // Notifica che un reward è stato riscattato per aggiornare la history
      widget.onCheckpointAdvanced?.call();
      
      // Ricarica i dati per aggiornare l'UI
      _fetchRedeemedRewards();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isAdvancing = false);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore nel riscatto: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _showAllOffersPreview() async {
    if (_checkpoints.isEmpty) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header della modal
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Icon(Icons.card_giftcard, color: Colors.orange[700], size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'All Checkpoint Offers',
                      style: TextStyle(
                        color: Colors.orange[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                ],
              ),
            ),
            
            // Contenuto scrollabile
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _checkpoints.length,
                itemBuilder: (context, index) {
                  final checkpoint = _checkpoints[index];
                  final currentStep = _currentSteps[checkpoint.id] ?? 0;
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.orange.withOpacity(0.2)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.orange.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header dell'offerta
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.orange[50],
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      checkpoint.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    if (checkpoint.description.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        checkpoint.description,
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.orange[700],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '$currentStep/${checkpoint.totalSteps}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        // Progress bar
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: LinearProgressIndicator(
                                  value: (currentStep / checkpoint.totalSteps).clamp(0.0, 1.0),
                                  backgroundColor: Colors.orange[100],
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.orange[700]!),
                                  minHeight: 8,
                                ),
                              ),
                              const SizedBox(height: 12),
                              
                              // Lista degli step con rewards
                              if (checkpoint.steps != null) ...[
                                Text(
                                  'Steps & Rewards:',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                ...checkpoint.steps!.map((step) {
                                  final isCompleted = step.stepNumber <= currentStep;
                                  final isRedeemed = step.rewardId != null && 
                                      _redeemedRewardIds.contains(step.rewardId);
                                  
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: isCompleted ? Colors.green[50] : Colors.grey[50],
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: isCompleted ? Colors.green.withOpacity(0.3) : Colors.grey.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            color: isCompleted ? Colors.green : Colors.grey,
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            isCompleted ? Icons.check : Icons.circle,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Step ${step.stepNumber}',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                  color: isCompleted ? Colors.green[700] : Colors.grey[700],
                                                ),
                                              ),
                                              if (step.rewardName != null) ...[
                                                const SizedBox(height: 2),
                                                Text(
                                                  step.rewardName!,
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: isCompleted ? Colors.green[600] : Colors.grey[600],
                                                  ),
                                                ),
                                                if (step.rewardDescription?.isNotEmpty ?? false) ...[
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    step.rewardDescription!,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.grey[500],
                                                    ),
                                                    maxLines: 2,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ],
                                              ],
                                            ],
                                          ),
                                        ),
                                        if (isRedeemed)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.green[100],
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              'Redeemed',
                                              style: TextStyle(
                                                color: Colors.green[700],
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return SkeletonComponents.buildCheckpointOffersSkeleton();
    }

    if (_error != null) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.orange.withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error, size: 48, color: Colors.orange[700]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(color: Colors.orange, fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchCheckpoints,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange[700],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_checkpoints.isEmpty) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.orange.withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.card_giftcard_outlined, size: 48, color: Colors.orange[400]),
            const SizedBox(height: 16),
            Text(
              'No offers available',
              style: TextStyle(
                color: Colors.orange[700],
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header con progresso generale
          Row(
            children: [
              Icon(Icons.flag, color: Colors.orange[700], size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Checkpoint Progress',
                  style: TextStyle(
                    color: Colors.orange[700],
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
              if (_checkpoints.isNotEmpty) ...[
                Builder(
                  builder: (context) {
                    final currentStep = _currentSteps[_checkpoints.first.id] ?? 1;
                    final totalSteps = _checkpoints.first.totalSteps;
                    return Text(
                      '$currentStep/$totalSteps',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange[700],
                      ),
                    );
                  },
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: () => _showAllOffersPreview(),
                  icon: Icon(Icons.visibility, color: Colors.orange[700], size: 20),
                  tooltip: 'View All Offers',
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.orange[100],
                    padding: const EdgeInsets.all(8),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          
          // Progress bar principale
          if (_checkpoints.isNotEmpty)
            Builder(
              builder: (context) {
                final currentStep = _currentSteps[_checkpoints.first.id] ?? 1;
                final totalSteps = _checkpoints.first.totalSteps;
                final progress = (currentStep / totalSteps).clamp(0.0, 1.0);
                return Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.orange[100],
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.orange[700]!),
                        minHeight: 12,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                );
              },
            ),

          // Sezione rewards disponibili per il riscatto
          if (_checkpoints.isNotEmpty && _checkpoints.first.steps != null)
            Builder(
              builder: (context) {
                final availableRewards = _checkpoints.first.steps!.where((step) => 
                  step.rewardId != null && 
                  step.stepNumber <= (_currentSteps[_checkpoints.first.id] ?? 1) &&
                  !_redeemedRewardIds.contains(step.rewardId)
                ).toList();
                
                if (availableRewards.isEmpty) {
                  return const SizedBox.shrink();
                }
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Available Rewards',
                      style: TextStyle(
                        color: Colors.orange[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...availableRewards.map((step) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.withOpacity(0.2)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.orange.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.orange[100],
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Icon(
                              Icons.card_giftcard,
                              color: Colors.orange[700],
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step.rewardName ?? 'Reward',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                if (step.rewardDescription?.isNotEmpty ?? false) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    step.rewardDescription!,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Text(
                                  'Step ${step.stepNumber}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          SizedBox(
                            height: 44,
                            child: ElevatedButton.icon(
                              onPressed: _isAdvancing ? null : () => _redeemCheckpointReward(
                                step.id,
                                step.rewardId!,
                                step.rewardName ?? 'Reward',
                              ),
                              icon: const Icon(Icons.card_giftcard, size: 18),
                              label: const Text('Redeem'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green[600],
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 20),
                  ],
                );
              },
            ),

          // Sezione rewards già riscattati
          if (_checkpoints.isNotEmpty && _checkpoints.first.steps != null)
            Builder(
              builder: (context) {
                final redeemedRewards = _checkpoints.first.steps!.where((step) => 
                  step.rewardId != null && 
                  _redeemedRewardIds.contains(step.rewardId)
                ).toList();
                
                if (redeemedRewards.isEmpty) {
                  return const SizedBox.shrink();
                }
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Redeemed Rewards',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...redeemedRewards.map((step) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.green[100],
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(
                              Icons.check,
                              color: Colors.green,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step.rewardName ?? 'Reward',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                if (step.rewardDescription?.isNotEmpty ?? false) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    step.rewardDescription!,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[500],
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Text(
                                  'Step ${step.stepNumber}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.green[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Redeemed',
                              style: TextStyle(
                                color: Colors.green[700],
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                    const SizedBox(height: 20),
                  ],
                );
              },
            ),

          // Pulsanti di controllo
          if (widget.cardId != null && _checkpoints.isNotEmpty)
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _isAdvancing ? null : () => _rewindCheckpoint(_checkpoints.first.id),
                      icon: const Icon(Icons.remove, size: 22),
                      label: const Text('Previous Step', style: TextStyle(fontSize: 15)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        foregroundColor: Colors.grey[700],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _isAdvancing ? null : () => _advanceCheckpoint(_checkpoints.first.id),
                      icon: const Icon(Icons.arrow_forward, size: 22),
                      label: const Text('Next Step', style: TextStyle(fontSize: 15)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange[700],
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
