import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Impostazioni')),
      body: const Center(
        child: Text('Impostazioni (coming soon)', style: TextStyle(fontSize: 18)),
      ),
    );
  }
} 