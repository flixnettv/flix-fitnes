import 'package:flutter/material.dart';
import '../../models/exercise.dart';

class ExerciseDetailScreen extends StatelessWidget {
  final Exercise exercise;
  const ExerciseDetailScreen({super.key, required this.exercise});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(exercise.name)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF38BDF8).withAlpha(30),
                  const Color(0xFF22D3EE).withAlpha(30),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Icon(Icons.fitness_center, size: 80, color: Color(0xFF38BDF8)),
            ),
          ),
          const SizedBox(height: 24),
          Text(exercise.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
          if (exercise.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(exercise.description, style: TextStyle(fontSize: 14, color: Colors.white.withAlpha(180), height: 1.6)),
          ],
          const SizedBox(height: 24),
          _buildInfoSection('category', exercise.category.isNotEmpty ? exercise.category : 'general'),
          if (exercise.muscles.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildTagSection('muscles', exercise.muscles, const Color(0xFF38BDF8)),
          ],
          if (exercise.equipment.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildTagSection('equipment', exercise.equipment, const Color(0xFF22D3EE)),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoSection(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(label, style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 13)),
          const SizedBox(width: 12),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildTagSection(String label, List<String> tags, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: tags.map((t) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withAlpha(25),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color.withAlpha(50)),
                ),
                child: Text(t, style: TextStyle(color: color, fontSize: 13)),
              )).toList(),
        ),
      ],
    );
  }
}
