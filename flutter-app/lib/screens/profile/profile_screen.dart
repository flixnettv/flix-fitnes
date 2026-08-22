import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: const Color(0xFF38BDF8).withAlpha(40),
                    child: Text(
                      (user?.firstName ?? 'U')[0].toUpperCase(),
                      style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? 'user',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF38BDF8).withAlpha(25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      user?.role ?? 'client',
                      style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _buildInfoTile(Icons.email_outlined, 'email', user?.email ?? '-'),
            _buildInfoTile(Icons.phone_outlined, 'phone', user?.phone.isNotEmpty == true ? user!.phone : '-'),
            if (user?.birthdate != null) _buildInfoTile(Icons.cake_outlined, 'birthday', user!.birthdate!),
            if (user?.gender.isNotEmpty == true) _buildInfoTile(Icons.person_outline, 'gender', user!.gender),
            if (user?.heightCm != null) _buildInfoTile(Icons.height, 'height', '${user!.heightCm} cm'),
            if (user?.bio.isNotEmpty == true) _buildInfoTile(Icons.info_outline, 'bio', user!.bio),
            const SizedBox(height: 24),
            _buildMenuTile(context, ref, Icons.edit_outlined, 'edit profile', () {}),
            _buildMenuTile(context, ref, Icons.notifications_outlined, 'notifications', () {
              context.push('/notifications');
            }),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF87171).withAlpha(15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: ListTile(
                leading: const Icon(Icons.logout, color: Color(0xFFF87171)),
                title: const Text('sign out', style: TextStyle(color: Color(0xFFF87171))),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                onTap: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: const Color(0xFF1E293B),
                      title: const Text('sign out?', style: TextStyle(color: Colors.white)),
                      content: const Text('are you sure you want to sign out?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('cancel')),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('sign out', style: TextStyle(color: Color(0xFFF87171))),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true && context.mounted) {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF38BDF8)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(100))),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTile(BuildContext context, WidgetRef ref, IconData icon, String label, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.white.withAlpha(180)),
        title: Text(label, style: const TextStyle(color: Colors.white)),
        trailing: Icon(Icons.chevron_right, color: Colors.white.withAlpha(80)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        onTap: onTap,
      ),
    );
  }
}
