class Exercise {
  final int id;
  final String name;
  final String nameAr;
  final String description;
  final String category;
  final List<String> muscles;
  final List<String> equipment;
  final String? image;
  final String? videoUrl;

  Exercise({
    required this.id,
    required this.name,
    this.nameAr = '',
    this.description = '',
    this.category = '',
    this.muscles = const [],
    this.equipment = const [],
    this.image,
    this.videoUrl,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      nameAr: json['name_ar'] ?? json['translations']?[0]?['name'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      muscles: (json['muscles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      equipment: (json['equipment'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      image: json['image'],
      videoUrl: json['video_url'],
    );
  }
}

class ExerciseCategory {
  final int id;
  final String name;
  final String? description;

  ExerciseCategory({required this.id, required this.name, this.description});

  factory ExerciseCategory.fromJson(Map<String, dynamic> json) {
    return ExerciseCategory(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
    );
  }
}

class Muscle {
  final int id;
  final String name;
  final String nameEn;

  Muscle({required this.id, required this.name, this.nameEn = ''});

  factory Muscle.fromJson(Map<String, dynamic> json) {
    return Muscle(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      nameEn: json['name_en'] ?? json['name'] ?? '',
    );
  }
}

class Equipment {
  final int id;
  final String name;

  Equipment({required this.id, required this.name});

  factory Equipment.fromJson(Map<String, dynamic> json) {
    return Equipment(id: json['id'] ?? 0, name: json['name'] ?? '');
  }
}
