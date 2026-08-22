import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class OwnerStats {
  final int totalCoaches;
  final int totalClients;
  final int activeWorkoutPlans;
  final int activeNutritionPlans;
  final int totalMeasurements;

  OwnerStats({
    this.totalCoaches = 0,
    this.totalClients = 0,
    this.activeWorkoutPlans = 0,
    this.activeNutritionPlans = 0,
    this.totalMeasurements = 0,
  });

  factory OwnerStats.fromJson(Map<String, dynamic> json) {
    return OwnerStats(
      totalCoaches: json['total_coaches'] ?? 0,
      totalClients: json['total_clients'] ?? 0,
      activeWorkoutPlans: json['active_workout_plans'] ?? 0,
      activeNutritionPlans: json['active_nutrition_plans'] ?? 0,
      totalMeasurements: json['total_measurements'] ?? 0,
    );
  }
}

final ownerStatsProvider = FutureProvider<OwnerStats>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/auth/owner/stats/');
    return OwnerStats.fromJson(data);
  } catch (_) {
    return OwnerStats();
  }
});

final ownerCoachesProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/auth/owner/coaches/');
    final list = data is Map && data.containsKey('results') ? data['results'] : data;
    return list is List ? list : [];
  } catch (_) {
    return [];
  }
});

final allUsersProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/auth/users/');
    final list = data is Map && data.containsKey('results') ? data['results'] : data;
    return list is List ? list : [];
  } catch (_) {
    return [];
  }
});
