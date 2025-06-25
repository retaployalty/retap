import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';

class LocationInitializer extends ConsumerStatefulWidget {
  final Widget child;
  
  const LocationInitializer({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  ConsumerState<LocationInitializer> createState() => _LocationInitializerState();
}

class _LocationInitializerState extends ConsumerState<LocationInitializer> {
  @override
  void initState() {
    super.initState();
    // Inizializza il LocationProvider quando il widget viene creato
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(locationProvider).initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
} 