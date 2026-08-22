import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class CoachStats {
  final int totalClients;
  final int activeClients;
  final int activePlans;
  final int totalMeasurements;

  CoachStats({
    this.totalClients = 0,
    this.activeClients = 0,
    this.activePlans = 0,
    this.totalMeasurements = 0,
  });

  factory CoachStats.fromJson(Map<String, dynamic> json) {
    return CoachStats(
      totalClients: json['total_clients'] ?? 0,
      activeClients: json['active_clients'] ?? 0,
      activePlans: json['active_plans'] ?? 0,
      totalMeasurements: json['total_measurements'] ?? 0,
    );
  }
}

final coachStatsProvider = FutureProvider<CoachStats>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/auth/coach/stats/');
    return CoachStats.fromJson(data);
  } catch (_) {
    return CoachStats();
  }
});

final coachClientsProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    final data = await api.get('/auth/users/');
    final list = data is Map && data.containsKey('results') ? data['results'] : data;
    return list is List ? list : [];
  } catch (_) {
    return [];
  }
});
