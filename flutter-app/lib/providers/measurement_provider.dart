import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/measurement.dart';
import 'auth_provider.dart';

final bodyMeasurementsProvider = FutureProvider<List<BodyMeasurement>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/measurements/body/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => BodyMeasurement.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final progressPhotosProvider = FutureProvider<List<ProgressPhoto>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/measurements/photos/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => ProgressPhoto.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});
