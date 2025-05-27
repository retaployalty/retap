import 'package:flutter/material.dart';
import '../shared_utils/business_hours.dart';

class BusinessDetailScreen extends StatelessWidget {
  final String businessName;
  final int points;
  final String logoUrl;
  final List<String> coverImageUrls;
  final bool isOpen;
  final dynamic hours;

  const BusinessDetailScreen({
    super.key,
    required this.businessName,
    required this.points,
    required this.logoUrl,
    required this.isOpen,
    required this.hours,
    required this.coverImageUrls,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // The entire screen scrolls so the header collapses naturally if content grows.
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BusinessHeader(
                  businessName: businessName,
                  logoUrl: logoUrl,
                  coverImageUrls: coverImageUrls,
                  isOpen: isOpen,
                  hours: hours,
                ),
                // Stato orari pillola sotto il nome merchant, centrata
                Padding(
                  padding: const EdgeInsets.only(top: 12, left: 16, right: 16, bottom: 8),
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
                              color: isOpen ? Colors.green : Colors.red,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isOpen ? 'Aperto' : 'Chiuso',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isOpen ? Colors.green : Colors.red,
                                fontSize: 14,
                              ),
                            ),
                            if (getTodayOpeningHours(hours).isNotEmpty) ...[
                              const SizedBox(width: 6),
                              Text(
                                getTodayOpeningHours(hours),
                                style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.w500, fontSize: 13),
                              ),
                            ]
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.store, color: Colors.red, size: 64),
            const SizedBox(height: 24),
            Text(
              businessName,
                    style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              'Punti: $points',
                    style: const TextStyle(
                        fontSize: 40,
                        color: Colors.red,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
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