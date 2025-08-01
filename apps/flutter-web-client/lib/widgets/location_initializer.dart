import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/location_provider.dart';

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
    // Non richiedere automaticamente la posizione all'avvio
    // La posizione verrà richiesta esplicitamente durante il flusso di registrazione
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
} 