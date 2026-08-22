class Food {
  final int id;
  final String name;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  Food({
    required this.id,
    required this.name,
    this.calories = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
  });

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      calories: (json['calories'] ?? 0).toDouble(),
      protein: (json['protein'] ?? 0).toDouble(),
      carbs: (json['carbs'] ?? 0).toDouble(),
      fat: (json['fat'] ?? 0).toDouble(),
    );
  }
}

class DailyLog {
  final int id;
  final String date;
  final String meal;
  final Food? food;
  final double quantity;
  final double totalCalories;

  DailyLog({
    required this.id,
    this.date = '',
    this.meal = '',
    this.food,
    this.quantity = 0,
    this.totalCalories = 0,
  });

  factory DailyLog.fromJson(Map<String, dynamic> json) {
    return DailyLog(
      id: json['id'] ?? 0,
      date: json['date'] ?? '',
      meal: json['meal'] ?? '',
      food: json['food'] != null ? Food.fromJson(json['food']) : null,
      quantity: (json['quantity'] ?? 0).toDouble(),
      totalCalories: (json['total_calories'] ?? 0).toDouble(),
    );
  }
}

class NutritionPlan {
  final int id;
  final String name;
  final String description;
  final double targetCalories;
  final double targetProtein;
  final double targetCarbs;
  final double targetFat;

  NutritionPlan({
    required this.id,
    required this.name,
    this.description = '',
    this.targetCalories = 0,
    this.targetProtein = 0,
    this.targetCarbs = 0,
    this.targetFat = 0,
  });

  factory NutritionPlan.fromJson(Map<String, dynamic> json) {
    return NutritionPlan(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      targetCalories: (json['target_calories'] ?? 0).toDouble(),
      targetProtein: (json['target_protein'] ?? 0).toDouble(),
      targetCarbs: (json['target_carbs'] ?? 0).toDouble(),
      targetFat: (json['target_fat'] ?? 0).toDouble(),
    );
  }
}
