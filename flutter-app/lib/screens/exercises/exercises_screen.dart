import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/exercise_provider.dart';
import '../../models/exercise.dart';

class ExercisesScreen extends ConsumerStatefulWidget {
  const ExercisesScreen({super.key});

  @override
  ConsumerState<ExercisesScreen> createState() => _ExercisesScreenState();
}

class _ExercisesScreenState extends ConsumerState<ExercisesScreen> {
  int _selectedCategory = -1;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoryListProvider);
    final exercises = ref.watch(exerciseListProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'search exercises...',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                  hintStyle: TextStyle(color: Colors.white.withAlpha(100)),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(height: 12),
            categories.when(
              data: (cats) {
                if (cats.isEmpty) return const SizedBox();
                return SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      _buildChip('all', _selectedCategory == -1, () {
                        setState(() => _selectedCategory = -1);
                      }),
                      ...cats.map((c) => _buildChip(c.name, _selectedCategory == c.id, () {
                            setState(() => _selectedCategory = c.id);
                          })),
                    ],
                  ),
                );
              },
              loading: () => const SizedBox(height: 40),
              error: (_, __) => const SizedBox(height: 40),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: exercises.when(
                data: (list) {
                  final query = _searchController.text.toLowerCase();
                  var filtered = list;
                  if (query.isNotEmpty) {
                    filtered = list.where((e) => e.name.toLowerCase().contains(query)).toList();
                  }
                  if (filtered.isEmpty) {
                    return Center(
                      child: Text('no exercises found', style: TextStyle(color: Colors.white.withAlpha(120))),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) => _buildExerciseCard(filtered[i]),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => Center(
                  child: Text('failed to load exercises', style: TextStyle(color: Colors.white.withAlpha(120))),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF38BDF8).withAlpha(30) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? const Color(0xFF38BDF8) : Colors.white.withAlpha(20),
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? const Color(0xFF38BDF8) : Colors.white.withAlpha(150),
              fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExerciseCard(Exercise exercise) {
    return GestureDetector(
      onTap: () => context.push('/exercises/detail', extra: exercise),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF38BDF8).withAlpha(40),
                    const Color(0xFF22D3EE).withAlpha(40),
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.fitness_center, color: Color(0xFF38BDF8)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(exercise.name,
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 15)),
                  if (exercise.muscles.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      exercise.muscles.join(', '),
                      style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(120)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.white.withAlpha(80)),
          ],
        ),
      ),
    );
  }
}
