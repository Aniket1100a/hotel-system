class AppUser {
  final int id;
  final String username;
  final String role;

  AppUser({required this.id, required this.username, required this.role});

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'],
      username: json['username'],
      role: json['role'],
    );
  }
}
