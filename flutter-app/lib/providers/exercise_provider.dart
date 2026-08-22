import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/exercise.dart';
import 'auth_provider.dart';

final exerciseListProvider = FutureProvider<List<Exercise>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/exercises/exercises/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => Exercise.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final categoryListProvider = FutureProvider<List<ExerciseCategory>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/exercises/categories/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => ExerciseCategory.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final muscleListProvider = FutureProvider<List<Muscle>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/exercises/muscles/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => Muscle.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final equipmentListProvider = FutureProvider<List<Equipment>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/exercises/equipment/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => Equipment.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});
