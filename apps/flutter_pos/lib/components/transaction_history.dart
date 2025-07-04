import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api_service.dart';
import 'skeleton_components.dart';

class TransactionHistory extends StatefulWidget {
  final String merchantId;
  final String cardId;
  final String? customerId;
  final VoidCallback? onRefresh;

  const TransactionHistory({
    super.key,
    required this.merchantId,
    required this.cardId,
    this.customerId,
    this.onRefresh,
  });

  @override
  State<TransactionHistory> createState() => _TransactionHistoryState();
}

class _TransactionHistoryState extends State<TransactionHistory> {
  bool _isLoading = true;
  List<TransactionItem> _transactions = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTransactionHistory();
  }

  @override
  void didUpdateWidget(TransactionHistory oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Se il widget è stato aggiornato, ricarica la history
    if (oldWidget.cardId != widget.cardId || 
        oldWidget.merchantId != widget.merchantId) {
      _fetchTransactionHistory();
    }
  }

  // Metodo pubblico per aggiornare la history
  void refreshHistory() {
    _fetchTransactionHistory();
  }

  Future<void> _fetchTransactionHistory() async {
    if (!mounted) return;
    
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchant-history?merchantId=${widget.merchantId}&cardId=${widget.cardId}'),
        headers: {
          'x-merchant-id': widget.merchantId,
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 8));

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final transactions = data['transactions'] as List<dynamic>;
        final checkpoints = data['checkpoints'] as List<dynamic>;
        
        final List<TransactionItem> historyItems = [];
        
        // Add transactions
        for (var tx in transactions) {
          historyItems.add(TransactionItem(
            date: DateTime.parse(tx['created_at']),
            points: tx['points'],
            type: TransactionType.transaction,
            description: tx['points'] > 0 ? 'Points credited' : 'Points spent',
          ));
        }
        
        // Add checkpoints
        for (var cp in checkpoints) {
          if (cp['type'] == 'checkpoint_reward') {
            historyItems.add(TransactionItem(
              date: DateTime.parse(cp['redeemed_at']),
              points: 0,
              type: TransactionType.checkpointReward,
              description: 'Checkpoint reward: ${cp['reward_name'] ?? 'Unknown'}',
              stepNumber: cp['step_number'],
              offerName: cp['offer_name'],
            ));
          } else if (cp['type'] == 'checkpoint_advancement') {
            historyItems.add(TransactionItem(
              date: DateTime.parse(cp['date']),
              points: 0,
              type: TransactionType.checkpointAdvancement,
              description: 'Checkpoint advanced',
              stepNumber: cp['step_number'],
              offerName: cp['offer_name'],
              totalSteps: cp['total_steps'],
            ));
          }
        }
        
        // Sort by date, most recent first
        historyItems.sort((a, b) => b.date.compareTo(a.date));
        
        setState(() {
          _transactions = historyItems;
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load transaction history');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return SkeletonComponents.buildTransactionHistorySkeleton();
    }

    if (_error != null) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.blue[50],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blue.withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error, size: 48, color: Colors.blue[700]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchTransactionHistory,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[700],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_transactions.isEmpty) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.blue[50],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.blue.withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.history, size: 48, color: Colors.blue[400]),
            const SizedBox(height: 16),
            Text(
              'No transaction history',
              style: TextStyle(
                color: Colors.blue[700],
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Transaction history will appear here.',
              style: TextStyle(
                color: Colors.blue[900]?.withOpacity(0.6),
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
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
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(
                Icons.history,
                color: Colors.blue[700],
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'Transaction History',
                style: TextStyle(
                  color: Colors.blue[700],
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const Spacer(),
              Text(
                '${_transactions.length} items',
                style: TextStyle(
                  color: Colors.blue[700]?.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.builder(
              itemCount: _transactions.length,
              itemBuilder: (context, index) {
                final transaction = _transactions[index];
                return _TransactionItem(transaction: transaction);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class TransactionItem {
  final DateTime date;
  final int points;
  final TransactionType type;
  final String description;
  final int? stepNumber;
  final String? offerName;
  final int? totalSteps;

  TransactionItem({
    required this.date,
    required this.points,
    required this.type,
    required this.description,
    this.stepNumber,
    this.offerName,
    this.totalSteps,
  });
}

enum TransactionType {
  transaction,
  checkpointReward,
  checkpointAdvancement,
}

class _TransactionItem extends StatelessWidget {
  final TransactionItem transaction;

  const _TransactionItem({required this.transaction});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.blue.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.05),
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
              color: _getIconColor().withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              _getIcon(),
              color: _getIconColor(),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(transaction.date),
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
                if (transaction.stepNumber != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Step ${transaction.stepNumber}${transaction.totalSteps != null ? '/${transaction.totalSteps}' : ''}',
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (transaction.points != 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: transaction.points > 0 ? Colors.green[100] : Colors.red[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${transaction.points > 0 ? '+' : ''}${transaction.points}',
                style: TextStyle(
                  color: transaction.points > 0 ? Colors.green[700] : Colors.red[700],
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
        ],
      ),
    );
  }

  IconData _getIcon() {
    switch (transaction.type) {
      case TransactionType.transaction:
        return Icons.point_of_sale;
      case TransactionType.checkpointReward:
        return Icons.card_giftcard;
      case TransactionType.checkpointAdvancement:
        return Icons.flag;
    }
  }

  Color _getIconColor() {
    switch (transaction.type) {
      case TransactionType.transaction:
        return Colors.blue[700]!;
      case TransactionType.checkpointReward:
        return Colors.orange[700]!;
      case TransactionType.checkpointAdvancement:
        return Colors.green[700]!;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCheck = DateTime(date.year, date.month, date.day);

    if (dateToCheck == today) {
      return 'Today at ${_formatTime(date)}';
    } else if (dateToCheck == yesterday) {
      return 'Yesterday at ${_formatTime(date)}';
    } else {
      return '${date.day}/${date.month}/${date.year} at ${_formatTime(date)}';
    }
  }

  String _formatTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
} 