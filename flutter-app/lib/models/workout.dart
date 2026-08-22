class WorkoutSession {
  final int id;
  final String name;
  final String date;
  final int durationMinutes;
  final String notes;
  final bool completed;

  WorkoutSession({
    required this.id,
    required this.name,
    this.date = '',
    this.durationMinutes = 0,
    this.notes = '',
    this.completed = false,
  });

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    return WorkoutSession(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      date: json['date'] ?? '',
      durationMinutes: json['duration_minutes'] ?? 0,
      notes: json['notes'] ?? '',
      completed: json['completed'] ?? false,
    );
  }
}

class WorkoutLog {
  final int id;
  final String exercise;
  final int sets;
  final int reps;
  final double weight;
  final String date;

  WorkoutLog({
    required this.id,
    required this.exercise,
    this.sets = 0,
    this.reps = 0,
    this.weight = 0,
    this.date = '',
  });

  factory WorkoutLog.fromJson(Map<String, dynamic> json) {
    return WorkoutLog(
      id: json['id'] ?? 0,
      exercise: json['exercise'] ?? '',
      sets: json['sets'] ?? 0,
      reps: json['reps'] ?? 0,
      weight: (json['weight'] ?? 0).toDouble(),
      date: json['date'] ?? '',
    );
  }
}

class ClientPlan {
  final int id;
  final String name;
  final String description;
  final String startDate;
  final String endDate;
  final bool active;

  ClientPlan({
    required this.id,
    required this.name,
    this.description = '',
    this.startDate = '',
    this.endDate = '',
    this.active = false,
  });

  factory ClientPlan.fromJson(Map<String, dynamic> json) {
    return ClientPlan(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      startDate: json['start_date'] ?? '',
      endDate: json['end_date'] ?? '',
      active: json['active'] ?? false,
    );
  }
}
