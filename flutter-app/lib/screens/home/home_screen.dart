import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/exercise_provider.dart';
import '../../providers/workout_provider.dart';
import '../../providers/nutrition_provider.dart';
import '../../providers/measurement_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final exercises = ref.watch(exerciseListProvider);
    final sessions = ref.watch(workoutSessionsProvider);
    final foods = ref.watch(foodListProvider);
    final measurements = ref.watch(bodyMeasurementsProvider);

    final greeting = _getGreeting();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(exerciseListProvider);
            ref.invalidate(workoutSessionsProvider);
            ref.invalidate(foodListProvider);
            ref.invalidate(bodyMeasurementsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$greeting, ${user?.firstName ?? ''}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'let\'s achieve your goals',
                          style: TextStyle(fontSize: 14, color: Colors.white.withAlpha(150)),
                        ),
                      ],
                    ),
                  ),
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFF38BDF8).withAlpha(40),
                    child: Text(
                      (user?.firstName ?? 'U')[0].toUpperCase(),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildStatsGrid(exercises, sessions, foods, measurements),
              const SizedBox(height: 24),
              const Text('quick actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 12),
              _buildQuickActions(context),
              const SizedBox(height: 24),
              _buildRecentActivity(sessions),
            ],
          ),
        ),
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'good morning';
    if (hour < 17) return 'good afternoon';
    return 'good evening';
  }

  Widget _buildStatsGrid(
    AsyncValue exercises,
    AsyncValue sessions,
    AsyncValue foods,
    AsyncValue measurements,
  ) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _buildStatCard(
          icon: Icons.fitness_center,
          label: 'exercises',
          value: exercises.when(data: (d) => '${d.length}', loading: () => '...', error: (_, __) => '0'),
          color: const Color(0xFF38BDF8),
        ),
        _buildStatCard(
          icon: Icons.timer_outlined,
          label: 'sessions',
          value: sessions.when(data: (d) => '${d.length}', loading: () => '...', error: (_, __) => '0'),
          color: const Color(0xFF22D3EE),
        ),
        _buildStatCard(
          icon: Icons.restaurant_outlined,
          label: 'foods',
          value: foods.when(data: (d) => '${d.length}', loading: () => '...', error: (_, __) => '0'),
          color: const Color(0xFF4ADE80),
        ),
        _buildStatCard(
          icon: Icons.monitor_weight_outlined,
          label: 'measurements',
          value: measurements.when(data: (d) => '${d.length}', loading: () => '...', error: (_, __) => '0'),
          color: const Color(0xFFFBBF24),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 24, color: color),
          const Spacer(),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _ActionItem(Icons.fitness_center, 'exercises', '/exercises', const Color(0xFF38BDF8)),
      _ActionItem(Icons.timer, 'workouts', '/workouts', const Color(0xFF22D3EE)),
      _ActionItem(Icons.restaurant, 'nutrition', '/nutrition', const Color(0xFF4ADE80)),
      _ActionItem(Icons.monitor_weight, 'measurements', '/measurements', const Color(0xFFFBBF24)),
    ];

    return Row(
      children: actions
          .map((a) => Expanded(
                child: GestureDetector(
                  onTap: () => context.go(a.route),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: a.color.withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: a.color.withAlpha(50)),
                    ),
                    child: Column(
                      children: [
                        Icon(a.icon, color: a.color, size: 28),
                        const SizedBox(height: 8),
                        Text(a.label,
                            style: TextStyle(fontSize: 11, color: a.color, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }

  Widget _buildRecentActivity(AsyncValue sessions) {
    return sessions.when(
      data: (list) {
        if (list.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                'no recent sessions\nstart a new workout!',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withAlpha(120)),
              ),
            ),
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('recent sessions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            ...list.take(3).map((s) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFF38BDF8).withAlpha(30),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(s.completed ? Icons.check_circle : Icons.play_circle_outline,
                            color: const Color(0xFF38BDF8)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                            Text('${s.durationMinutes} min', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(120))),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const SizedBox(),
    );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final String route;
  final Color color;
  _ActionItem(this.icon, this.label, this.route, this.color);
}
