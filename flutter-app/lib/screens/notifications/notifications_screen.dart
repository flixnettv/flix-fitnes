import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.watch(apiServiceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('notifications')),
      body: FutureBuilder(
        future: api.get('/notifications/notifications/'),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData) {
            return _buildEmpty();
          }
          final data = snapshot.data;
          final results = data is Map && data.containsKey('results') ? data['results'] : data;
          final list = results is List ? results : [];

          if (list.isEmpty) return _buildEmpty();

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: list.length,
            itemBuilder: (ctx, i) {
              final n = list[i];
              final isRead = n['is_read'] ?? false;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isRead ? const Color(0xFF1E293B) : const Color(0xFF38BDF8).withAlpha(15),
                  borderRadius: BorderRadius.circular(14),
                  border: isRead ? null : Border.all(color: const Color(0xFF38BDF8).withAlpha(30)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isRead ? Colors.white.withAlpha(10) : const Color(0xFF38BDF8).withAlpha(25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        isRead ? Icons.notifications_outlined : Icons.notifications_active,
                        size: 18,
                        color: isRead ? Colors.white.withAlpha(80) : const Color(0xFF38BDF8),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            n['title'] ?? n['message'] ?? 'notification',
                            style: TextStyle(
                              fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          if (n['body'] != null || n['message'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              n['body'] ?? n['message'] ?? '',
                              style: TextStyle(fontSize: 13, color: Colors.white.withAlpha(120)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.notifications_none, size: 64, color: Colors.white.withAlpha(40)),
          const SizedBox(height: 16),
          Text('no notifications', style: TextStyle(color: Colors.white.withAlpha(120))),
        ],
      ),
    );
  }
}
