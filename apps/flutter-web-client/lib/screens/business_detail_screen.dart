import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../shared_utils/business_hours.dart';
import '../components/reward_list.dart';

class BusinessDetailScreen extends StatefulWidget {
  final String businessName;
  final int points;
  final String logoUrl;
  final List<String> coverImageUrls;
  final bool isOpen;
  final dynamic hours;
  final String merchantId;

  const BusinessDetailScreen({
    super.key,
    required this.businessName,
    required this.points,
    required this.logoUrl,
    required this.isOpen,
    required this.hours,
    required this.coverImageUrls,
    required this.merchantId,
  });

  @override
  State<BusinessDetailScreen> createState() => _BusinessDetailScreenState();
}

class _BusinessDetailScreenState extends State<BusinessDetailScreen> {
  bool isLoading = true;
  List<RewardItem> rewards = [];
  // checkpoint_offers: puoi aggiungere qui la struttura se vuoi mostrarli in futuro

  @override
  void initState() {
    super.initState();
    fetchRewardsAndCheckpoints();
  }

  Future<void> fetchRewardsAndCheckpoints() async {
    setState(() => isLoading = true);
    final url = Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/rewards-and-checkpoints?merchantId=${widget.merchantId}');
    final res = await http.get(url);
    print('API status: \\${res.statusCode}');
    print('API body: \\${res.body}');
    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      print('Decoded data: \\${data}');
      final rewardsData = data['rewards'] as List<dynamic>;
      final offersData = data['checkpoint_offers'] as List<dynamic>?;
      print('rewardsData: \\${rewardsData}');
      print('checkpoint_offers: \\${offersData}');
      setState(() {
        rewards = rewardsData.map((r) => RewardItem(
          imageUrl: r['image_path'] ?? '',
          title: r['name'] ?? '',
          price: r['price_coins'] ?? 0,
        )).toList();
        isLoading = false;
      });
    } else {
      setState(() => isLoading = false);
      print('API error: \\${res.statusCode} - \\${res.body}');
      // In produzione: gestisci errore
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // The entire screen scrolls so the header collapses naturally if content grows.
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BusinessHeader(
              businessName: widget.businessName,
              logoUrl: widget.logoUrl,
              coverImageUrls: widget.coverImageUrls,
              isOpen: widget.isOpen,
              hours: widget.hours,
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 6,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.schedule,
                          size: 16,
                          color: widget.isOpen ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          widget.isOpen ? 'Aperto' : 'Chiuso',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: widget.isOpen ? Colors.green : Colors.red,
                            fontSize: 14,
                          ),
                        ),
                        if (getTodayOpeningHours(widget.hours).isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Text(
                            getTodayOpeningHours(widget.hours),
                            style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.w500, fontSize: 13),
                          ),
                        ]
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
            // --- REWARD LIST UI ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: isLoading
                  ? const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
                  : RewardList(
                      userPoints: widget.points,
                      rewards: rewards,
                    ),
            ),
            const SizedBox(height: 24),
            // Info business (ex Center)
            Column(
              children: [
                const Icon(Icons.store, color: Colors.red, size: 64),
                const SizedBox(height: 24),
                Text(
                  widget.businessName,
                  style: const TextStyle(
                      fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text(
                  'Punti: ${widget.points}',
                  style: const TextStyle(
                      fontSize: 40,
                      color: Colors.red,
                      fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

/// Top banner inspired by the provided mock-up.
/// Replace every `Image.network` with your own assets or network URLs.
class BusinessHeader extends StatefulWidget {
  final String businessName;
  final String logoUrl;
  final List<String> coverImageUrls;
  final bool isOpen;
  final dynamic hours;

  const BusinessHeader({
    super.key,
    required this.businessName,
    required this.logoUrl,
    required this.isOpen,
    required this.hours,
    required this.coverImageUrls,
  });

  @override
  State<BusinessHeader> createState() => _BusinessHeaderState();
}

class _BusinessHeaderState extends State<BusinessHeader> {
  int _currentPage = 0;
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final covers = widget.coverImageUrls;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            clipBehavior: Clip.none,
            children: [
              // Carousel delle cover
              PageView.builder(
                controller: _pageController,
                itemCount: covers.length,
                onPageChanged: (i) => setState(() => _currentPage = i),
                itemBuilder: (context, i) {
                  final url = covers[i];
                  return url.isNotEmpty
                      ? Image.network(url, fit: BoxFit.cover)
                      : Container(color: Colors.grey[200]);
                },
              ),
              // Gradient overlay
              IgnorePointer(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.55),
                      ],
                    ),
                  ),
                ),
              ),
              // Back button
              Positioned(
                top: topPadding + 8,
                left: 16,
                child: _CircleButton(
                  icon: Icons.arrow_back,
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
              ),
              // Page indicators dinamici
              if (covers.length > 1)
                Positioned(
                  top: topPadding + 16,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      covers.length,
                      (i) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: _Dot(active: i == _currentPage),
                      ),
                    ),
                  ),
                ),
              // LOGO: bordo rosso sottile e immagine profilo grande
              Positioned(
                left: 16,
                bottom: -70, // metà del nuovo diametro (132/2)
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Bordo esterno rosso sottile
                    Container(
                      width: 136,
                      height: 136,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.red, width: 3),
                      ),
                    ),
                    // Spazio trasparente tra bordo e immagine
                    Container(
                      width: 130,
                      height: 130,
                      color: Colors.transparent,
                    ),
                    // Immagine profilo più grande
                    CircleAvatar(
                      radius: 66,
                      backgroundColor: Colors.transparent,
                      child: ClipOval(
                        child: Image.network(
                          widget.logoUrl,
                          fit: BoxFit.cover,
                          width: 124,
                          height: 124,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Business name in basso a destra sopra la cover
              Positioned(
                right: 24,
                bottom: 24,
                left: null,
                child: SizedBox(
                  width: 220,
                  child: Text(
                    widget.businessName,
                    maxLines: 2,
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      shadows: [Shadow(blurRadius: 8, color: Colors.black26)],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Simple circular button helper used for the back arrow.
class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;

  const _CircleButton({required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withOpacity(0.8),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Icon(icon, color: Colors.black),
        ),
      ),
    );
  }
} 

/// Small page-indicator dot.
class _Dot extends StatelessWidget {
  final bool active;

  const _Dot({this.active = false});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: active ? 10 : 6,
      height: active ? 10 : 6,
      decoration: BoxDecoration(
        color: active ? Colors.white : Colors.white54,
        shape: BoxShape.circle,
      ),
    );
  }
}