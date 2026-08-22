import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/owner_provider.dart';

class OwnerDashboard extends ConsumerWidget {
  const OwnerDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(ownerStatsProvider);
    final coaches = ref.watch(ownerCoachesProvider);
    final users = ref.watch(allUsersProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(ownerStatsProvider);
            ref.invalidate(ownerCoachesProvider);
            ref.invalidate(allUsersProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text('لوحة تحكم المالك', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 4),
              Text('نظرة شاملة على المركز', style: TextStyle(color: Colors.white.withAlpha(150))),
              const SizedBox(height: 20),
              stats.when(
                data: (s) => GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    _statCard('المدربين', '${s.totalCoaches}', Icons.sports, const Color(0xFF38BDF8)),
                    _statCard('العملاء', '${s.totalClients}', Icons.people, const Color(0xFF4ADE80)),
                    _statCard('خطط التمرين', '${s.activeWorkoutPlans}', Icons.fitness_center, const Color(0xFFFBBF24)),
                    _statCard('خطط التغذية', '${s.activeNutritionPlans}', Icons.restaurant, const Color(0xFFF87171)),
                  ],
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox(),
              ),
              const SizedBox(height: 24),
              _sectionHeader('المدربون', coaches.when(data: (c) => '${c.length}', loading: () => '...', error: (_, __) => '0')),
              const SizedBox(height: 12),
              coaches.when(
                data: (list) {
                  if (list.isEmpty) return _empty('لا يوجد مدربون');
                  return Column(
                    children: list.take(5).map((c) => _coachTile(c)).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _empty('فشل التحميل'),
              ),
              const SizedBox(height: 24),
              _sectionHeader('أحدث العملاء', users.when(data: (u) => '${u.length}', loading: () => '...', error: (_, __) => '0')),
              const SizedBox(height: 12),
              users.when(
                data: (list) {
                  final clients = list.where((u) => u['role'] == 'client').take(5).toList();
                  if (clients.isEmpty) return _empty('لا يوجد عملاء');
                  return Column(children: clients.map((u) => _userTile(u)).toList());
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _empty('فشل التحميل'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16), border: Border.all(color: color.withAlpha(30))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 28),
        const Spacer(),
        Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
      ]),
    );
  }

  Widget _sectionHeader(String title, String count) {
    return Row(children: [
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: const Color(0xFF38BDF8).withAlpha(30), borderRadius: BorderRadius.circular(8)),
        child: Text(count, style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12)),
      ),
    ]);
  }

  Widget _coachTile(dynamic c) {
    final user = c['user'] ?? c;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF38BDF8).withAlpha(30), child: Text((user['username'] ?? 'C')[0].toUpperCase(), style: const TextStyle(color: Color(0xFF38BDF8)))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(user['username'] ?? '-', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          Text(user['email'] ?? '', style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 12)),
        ])),
        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: const Color(0xFF4ADE80).withAlpha(20), borderRadius: BorderRadius.circular(6)), child: const Text('نشط', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 11))),
      ]),
    );
  }

  Widget _userTile(dynamic u) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF4ADE80).withAlpha(30), child: Text((u['username'] ?? 'U')[0].toUpperCase(), style: const TextStyle(color: Color(0xFF4ADE80)))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(u['username'] ?? '-', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          Text(u['role'] ?? '', style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 12)),
        ])),
      ]),
    );
  }

  Widget _empty(String msg) => Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)), child: Center(child: Text(msg, style: TextStyle(color: Colors.white.withAlpha(100)))));
}
