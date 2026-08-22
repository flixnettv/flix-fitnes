import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/workout_provider.dart';

class WorkoutsScreen extends ConsumerWidget {
  const WorkoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(clientPlansProvider);
    final sessions = ref.watch(workoutSessionsProvider);
    final logs = ref.watch(workoutLogsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const TabBar(
                  tabs: [
                    Tab(text: 'plans'),
                    Tab(text: 'sessions'),
                    Tab(text: 'logs'),
                  ],
                  labelColor: Color(0xFF38BDF8),
                  unselectedLabelColor: Color(0xFF94A3B8),
                  indicatorColor: Color(0xFF38BDF8),
                  dividerColor: Colors.transparent,
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildPlansTab(plans),
                    _buildSessionsTab(sessions),
                    _buildLogsTab(logs),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlansTab(AsyncValue plans) {
    return plans.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no assigned plans');
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: list.length,
          itemBuilder: (ctx, i) {
            final p = list[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: p.active ? Border.all(color: const Color(0xFF4ADE80).withAlpha(50)) : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                      ),
                      if (p.active)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4ADE80).withAlpha(25),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('active', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 11)),
                        ),
                    ],
                  ),
                  if (p.description.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(p.description, style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 13)),
                  ],
                  const SizedBox(height: 8),
                  Text('${p.startDate} - ${p.endDate}',
                      style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 12)),
                ],
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildEmpty('failed to load'),
    );
  }

  Widget _buildSessionsTab(AsyncValue sessions) {
    return sessions.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no sessions yet');
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: list.length,
          itemBuilder: (ctx, i) {
            final s = list[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: (s.completed ? const Color(0xFF4ADE80) : const Color(0xFF38BDF8)).withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      s.completed ? Icons.check_circle : Icons.play_circle_outline,
                      color: s.completed ? const Color(0xFF4ADE80) : const Color(0xFF38BDF8),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text(
                          '${s.durationMinutes} min • ${s.date}',
                          style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(120)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildEmpty('failed to load'),
    );
  }

  Widget _buildLogsTab(AsyncValue logs) {
    return logs.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no workout logs');
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: list.length,
          itemBuilder: (ctx, i) {
            final l = list[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l.exercise, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text(
                          '${l.sets} sets × ${l.reps} reps • ${l.weight}kg',
                          style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(120)),
                        ),
                      ],
                    ),
                  ),
                  Text(l.date, style: TextStyle(fontSize: 11, color: Colors.white.withAlpha(80))),
                ],
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildEmpty('failed to load'),
    );
  }

  Widget _buildEmpty(String msg) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.fitness_center, size: 64, color: Colors.white.withAlpha(40)),
          const SizedBox(height: 16),
          Text(msg, style: TextStyle(color: Colors.white.withAlpha(120))),
        ],
      ),
    );
  }
}
