class DiningTable {
  final int id;
  final String number;
  final String status;

  DiningTable({required this.id, required this.number, required this.status});

  factory DiningTable.fromJson(Map<String, dynamic> json) {
    return DiningTable(
      id: json['id'],
      number: json['number'],
      status: json['status'],
    );
  }
}
