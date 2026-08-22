import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/workout.dart';
import 'auth_provider.dart';

final workoutSessionsProvider = FutureProvider<List<WorkoutSession>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/workouts/sessions/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => WorkoutSession.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final workoutLogsProvider = FutureProvider<List<WorkoutLog>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/workouts/logs/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => WorkoutLog.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final clientPlansProvider = FutureProvider<List<ClientPlan>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/workouts/client-plans/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => ClientPlan.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});
