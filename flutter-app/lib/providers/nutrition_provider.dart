import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/nutrition.dart';
import 'auth_provider.dart';

final foodListProvider = FutureProvider<List<Food>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/nutrition/foods/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => Food.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final dailyLogsProvider = FutureProvider<List<DailyLog>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/nutrition/daily-logs/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => DailyLog.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

final nutritionPlansProvider = FutureProvider<List<NutritionPlan>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/nutrition/plans/');
    final results = data is Map && data.containsKey('results') ? data['results'] : data;
    return (results as List).map((e) => NutritionPlan.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});
