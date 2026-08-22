class User {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String phone;
  final String? avatar;
  final String? birthdate;
  final String gender;
  final int? heightCm;
  final String bio;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone = '',
    this.avatar,
    this.birthdate,
    this.gender = '',
    this.heightCm,
    this.bio = '',
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      role: json['role'] ?? 'client',
      phone: json['phone'] ?? '',
      avatar: json['avatar'],
      birthdate: json['birthdate'],
      gender: json['gender'] ?? '',
      heightCm: json['height_cm'],
      bio: json['bio'] ?? '',
      isActive: json['is_active'] ?? true,
    );
  }

  String get fullName => '$firstName $lastName'.trim();
  bool get isOwner => role == 'owner';
  bool get isCoach => role == 'coach';
  bool get isClient => role == 'client';
}
