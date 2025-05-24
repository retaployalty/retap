import 'package:flutter/material.dart';

class BusinessDetailScreen extends StatelessWidget {
  final String businessName;
  final int points;

  const BusinessDetailScreen({
    super.key,
    required this.businessName,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(businessName)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.store, color: Colors.red, size: 64),
            const SizedBox(height: 24),
            Text(
              businessName,
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              'Punti: $points',
              style: const TextStyle(fontSize: 40, color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
} 