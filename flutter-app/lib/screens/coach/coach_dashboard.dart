import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/coach_provider.dart';

class CoachDashboard extends ConsumerWidget {
  const CoachDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(coachStatsProvider);
    final clients = ref.watch(coachClientsProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(coachStatsProvider);
            ref.invalidate(coachClientsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text('لوحة تحكم المدرب', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 4),
              Text('متابعة العملاء والخطط', style: TextStyle(color: Colors.white.withAlpha(150))),
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
                    _statCard('عملائي', '${s.totalClients}', Icons.people, const Color(0xFF38BDF8)),
                    _statCard('النشطون', '${s.activeClients}', Icons.verified_user, const Color(0xFF4ADE80)),
                    _statCard('الخطط النشطة', '${s.activePlans}', Icons.assignment, const Color(0xFFFBBF24)),
                    _statCard('القياسات', '${s.totalMeasurements}', Icons.monitor_weight, const Color(0xFFA78BFA)),
                  ],
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox(),
              ),
              const SizedBox(height: 24),
              Row(children: [
                const Text('عملائي', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const Spacer(),
                clients.when(data: (c) => Text('${c.length} عميل', style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 13)), loading: () => const SizedBox(), error: (_, __) => const SizedBox()),
              ]),
              const SizedBox(height: 12),
              clients.when(
                data: (list) {
                  if (list.isEmpty) return _empty('لا يوجد عملاء مسندون إليك');
                  return Column(children: list.map((u) => _clientTile(u)).toList());
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _empty('فشل التحميل - تأكد من صلاحيات المدرب'),
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

  Widget _clientTile(dynamic u) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF22D3EE).withAlpha(30), child: Text((u['username'] ?? 'U')[0].toUpperCase(), style: const TextStyle(color: Color(0xFF22D3EE)))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(u['username'] ?? '-', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          Text('${u['first_name'] ?? ''} ${u['last_name'] ?? ''}'.trim(), style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 12)),
        ])),
        Icon(Icons.chevron_right, color: Colors.white.withAlpha(60), size: 18),
      ]),
    );
  }

  Widget _empty(String msg) => Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)), child: Center(child: Text(msg, textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withAlpha(100)))));
}
