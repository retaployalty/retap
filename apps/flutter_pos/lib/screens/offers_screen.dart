import 'package:flutter/material.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';
import '../services/points_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class OffersScreen extends StatefulWidget {
  final String merchantId;
  final String merchantName;
  final String? cardId;

  const OffersScreen({
    super.key,
    required this.merchantId,
    required this.merchantName,
    this.cardId,
  });

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _userPoints = 0;
  bool _isLoadingPoints = true;
  bool _isLoadingCheckpoints = true;
  Map<String, dynamic>? _checkpointData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchPoints();
    _fetchCheckpoints();
  }

  Future<void> _fetchCheckpoints() async {
    if (widget.cardId == null) {
      setState(() => _isLoadingCheckpoints = false);
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/rewards-and-checkpoints?merchantId=${widget.merchantId}&cardId=${widget.cardId}'),
        headers: {
          'x-merchant-id': widget.merchantId,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (!mounted) return;
        setState(() {
          _checkpointData = data;
          _isLoadingCheckpoints = false;
        });
      } else {
        throw Exception('Failed to load checkpoints');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingCheckpoints = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore nel caricamento dei checkpoint: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _fetchPoints() async {
    if (widget.cardId == null) {
      setState(() => _isLoadingPoints = false);
      return;
    }

    try {
      final points = await PointsService.getCardBalance(widget.cardId!, widget.merchantId);
      if (!mounted) return;
      setState(() {
        _userPoints = points;
        _isLoadingPoints = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingPoints = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore nel caricamento dei punti: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Offerte - ${widget.merchantName}'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(
              icon: Icon(Icons.card_giftcard),
              text: 'Premi',
            ),
            Tab(
              icon: Icon(Icons.flag),
              text: 'Checkpoint',
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Quick action buttons
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          '/points',
                          arguments: {
                            'merchantId': widget.merchantId,
                            'merchantName': widget.merchantName,
                          },
                        );
                      },
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('Accredita Punti'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          '/checkpoints',
                          arguments: {
                            'merchantId': widget.merchantId,
                            'merchantName': widget.merchantName,
                          },
                        );
                      },
                      icon: const Icon(Icons.flag_outlined),
                      label: const Text('Checkpoint'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.secondary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Tab content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Premi tab
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        Expanded(
                          child: _isLoadingPoints
                              ? const Center(child: CircularProgressIndicator())
                              : RewardsList(
                                  merchantId: widget.merchantId,
                                  userPoints: _userPoints,
                                  compactMode: true,
                                  cardId: widget.cardId,
                                ),
                        ),
                      ],
                    ),
                  ),
                  // Checkpoint tab
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        Expanded(
                          child: _isLoadingCheckpoints
                              ? const Center(child: CircularProgressIndicator())
                              : CheckpointOffersList(
                                  merchantId: widget.merchantId,
                                  cardId: widget.cardId,
                                  compactMode: true,
                                  initialCheckpointData: _checkpointData,
                                ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
} 