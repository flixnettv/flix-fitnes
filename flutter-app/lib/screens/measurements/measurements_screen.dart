import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/measurement_provider.dart';

class MeasurementsScreen extends ConsumerWidget {
  const MeasurementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final measurements = ref.watch(bodyMeasurementsProvider);
    final photos = ref.watch(progressPhotosProvider);

    return DefaultTabController(
      length: 2,
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
                    Tab(text: 'body measurements'),
                    Tab(text: 'progress photos'),
                  ],
                  labelColor: Color(0xFFFBBF24),
                  unselectedLabelColor: Color(0xFF94A3B8),
                  indicatorColor: Color(0xFFFBBF24),
                  dividerColor: Colors.transparent,
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildMeasurementsTab(measurements),
                    _buildPhotosTab(photos),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMeasurementsTab(AsyncValue measurements) {
    return measurements.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no measurements yet');
        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (list.length > 1)
              Container(
                height: 220,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: _buildWeightChart(list.reversed.toList()),
              ),
            if (list.length > 1) const SizedBox(height: 16),
            const Text('history', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            ...list.reversed.map((m) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m.date, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 12,
                        runSpacing: 6,
                        children: [
                          if (m.weightKg != null) _buildMeasurementChip('${m.weightKg}kg', 'weight', const Color(0xFF38BDF8)),
                          if (m.heightCm != null) _buildMeasurementChip('${m.heightCm}cm', 'height', const Color(0xFF4ADE80)),
                          if (m.bodyFatPercent != null)
                            _buildMeasurementChip('${m.bodyFatPercent}%', 'body fat', const Color(0xFFF87171)),
                          if (m.chestCm != null) _buildMeasurementChip('${m.chestCm}cm', 'chest', const Color(0xFFFBBF24)),
                          if (m.waistCm != null) _buildMeasurementChip('${m.waistCm}cm', 'waist', const Color(0xFF22D3EE)),
                          if (m.bicepsCm != null) _buildMeasurementChip('${m.bicepsCm}cm', 'biceps', const Color(0xFFA78BFA)),
                        ],
                      ),
                    ],
                  ),
                )),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildEmpty('failed to load'),
    );
  }

  Widget _buildWeightChart(List data) {
    final spots = <FlSpot>[];
    for (int i = 0; i < data.length; i++) {
      if (data[i].weightKg != null) {
        spots.add(FlSpot(i.toDouble(), data[i].weightKg!));
      }
    }
    if (spots.isEmpty) return const SizedBox();

    final minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b) - 2;
    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b) + 2;

    return LineChart(
      LineChartData(
        minY: minY,
        maxY: maxY,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: (maxY - minY) / 4,
          getDrawingHorizontalLine: (v) => FlLine(
            color: Colors.white.withAlpha(15),
            strokeWidth: 1,
          ),
        ),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: const Color(0xFF38BDF8),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, __, ___, ____) => FlDotCirclePainter(
                radius: 4,
                color: const Color(0xFF38BDF8),
                strokeColor: Colors.white,
                strokeWidth: 2,
              ),
            ),
            belowBarData: BarAreaData(
              show: true,
              color: const Color(0xFF38BDF8).withAlpha(25),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeasurementChip(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
    );
  }

  Widget _buildPhotosTab(AsyncValue photos) {
    return photos.when(
      data: (list) {
        if (list.isEmpty) return _buildEmpty('no progress photos');
        return GridView.builder(
          padding: const EdgeInsets.all(20),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: list.length,
          itemBuilder: (ctx, i) {
            final p = list[i];
            return Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: p.imageUrl != null
                        ? ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Image.network(p.imageUrl!, fit: BoxFit.cover),
                          )
                        : Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF38BDF8).withAlpha(15),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            ),
                            child: const Icon(Icons.photo_camera_outlined, size: 40, color: Color(0xFF38BDF8)),
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Text(p.date, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
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

  Widget _buildEmpty(String msg) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.monitor_weight_outlined, size: 64, color: Colors.white.withAlpha(40)),
          const SizedBox(height: 16),
          Text(msg, style: TextStyle(color: Colors.white.withAlpha(120))),
        ],
      ),
    );
  }
}
