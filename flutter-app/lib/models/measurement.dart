class BodyMeasurement {
  final int id;
  final String date;
  final double? weightKg;
  final int? heightCm;
  final double? bodyFatPercent;
  final int? chestCm;
  final int? waistCm;
  final int? hipsCm;
  final int? bicepsCm;
  final int? thighsCm;

  BodyMeasurement({
    required this.id,
    this.date = '',
    this.weightKg,
    this.heightCm,
    this.bodyFatPercent,
    this.chestCm,
    this.waistCm,
    this.hipsCm,
    this.bicepsCm,
    this.thighsCm,
  });

  factory BodyMeasurement.fromJson(Map<String, dynamic> json) {
    return BodyMeasurement(
      id: json['id'] ?? 0,
      date: json['date'] ?? '',
      weightKg: json['weight_kg']?.toDouble(),
      heightCm: json['height_cm'],
      bodyFatPercent: json['body_fat_percent']?.toDouble(),
      chestCm: json['chest_cm'],
      waistCm: json['waist_cm'],
      hipsCm: json['hips_cm'],
      bicepsCm: json['biceps_cm'],
      thighsCm: json['thighs_cm'],
    );
  }
}

class ProgressPhoto {
  final int id;
  final String date;
  final String? imageUrl;
  final String? note;

  ProgressPhoto({required this.id, this.date = '', this.imageUrl, this.note});

  factory ProgressPhoto.fromJson(Map<String, dynamic> json) {
    return ProgressPhoto(
      id: json['id'] ?? 0,
      date: json['date'] ?? '',
      imageUrl: json['image_url'] ?? json['image'],
      note: json['note'],
    );
  }
}
