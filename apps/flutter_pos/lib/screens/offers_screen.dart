import 'package:flutter/material.dart';
import '../components/rewards_list.dart';
import '../components/checkpoint_offers_list.dart';

class OffersScreen extends StatefulWidget {
  final String merchantId;
  final String merchantName;

  const OffersScreen({
    super.key,
    required this.merchantId,
    required this.merchantName,
  });

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
      body: TabBarView(
        controller: _tabController,
        children: [
          RewardsList(merchantId: widget.merchantId),
          CheckpointOffersList(merchantId: widget.merchantId),
        ],
      ),
    );
  }
} 