import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/nutrition_provider.dart';

class NutritionScreen extends ConsumerWidget {
  const NutritionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final foods = ref.watch(foodListProvider);
    final dailyLogs = ref.watch(dailyLogsProvider);
    final plans = ref.watch(nutritionPlansProvider);

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
                    Tab(text: 'foods'),
                    Tab(text: 'daily log'),
                    Tab(text: 'plans'),
                  ],
                  labelColor: Color(0xFF4ADE80),
                  unselectedLabelColor: Color(0xFF94A3B8),
                  indicatorColor: Color(0xFF4ADE80),
                  dividerColor: Colors.transparent,
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildFoodsTab(foods),
                    _buildDailyLogTab(dailyLogs),
                    _buildPlansTab(plans),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFoodsTab(AsyncValue foods) {
    return foods.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no foods available');
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: list.length,
          itemBuilder: (ctx, i) {
            final f = list[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF4ADE80).withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.restaurant_outlined, color: Color(0xFF4ADE80)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f.name, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text(
                          '${f.calories.round()} kcal • P:${f.protein.round()}g C:${f.carbs.round()}g F:${f.fat.round()}g',
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

  Widget _buildDailyLogTab(AsyncValue logs) {
    return logs.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no food logged today');
        double totalCal = 0;
        for (final l in list) {
          totalCal += l.totalCalories;
        }
        return Column(
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF4ADE80).withAlpha(30), const Color(0xFF22D3EE).withAlpha(20)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.local_fire_department, color: Color(0xFFFBBF24), size: 28),
                  const SizedBox(width: 8),
                  Text('${totalCal.round()}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                  const Text(' kcal', style: TextStyle(color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: list.length,
                itemBuilder: (ctx, i) {
                  final l = list[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(l.food?.name ?? 'unknown', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                              Text(l.meal, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(100))),
                            ],
                          ),
                        ),
                        Text('${l.totalCalories.round()} kcal', style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildEmpty('failed to load'),
    );
  }

  Widget _buildPlansTab(AsyncValue plans) {
    return plans.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no nutrition plans');
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
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                  if (p.description.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(p.description, style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 13)),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildNutrientBadge('${p.targetCalories.round()}', 'kcal', const Color(0xFFFBBF24)),
                      _buildNutrientBadge('${p.targetProtein.round()}g', 'protein', const Color(0xFF38BDF8)),
                      _buildNutrientBadge('${p.targetCarbs.round()}g', 'carbs', const Color(0xFF4ADE80)),
                      _buildNutrientBadge('${p.targetFat.round()}g', 'fat', const Color(0xFFF87171)),
                    ],
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

  Widget _buildNutrientBadge(String value, String label, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 14)),
            Text(label, style: TextStyle(fontSize: 10, color: color.withAlpha(180))),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(String msg) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.restaurant_outlined, size: 64, color: Colors.white.withAlpha(40)),
          const SizedBox(height: 16),
          Text(msg, style: TextStyle(color: Colors.white.withAlpha(120))),
        ],
      ),
    );
  }
}
