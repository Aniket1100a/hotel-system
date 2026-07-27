class OrderItem {
  final int id;
  final String menuItemName;
  final int quantity;
  final double subtotal;
  final String status;
  final int? kotId;

  OrderItem({
    required this.id,
    required this.menuItemName,
    required this.quantity,
    required this.subtotal,
    required this.status,
    this.kotId,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      menuItemName: json['menu_item_name'],
      quantity: json['quantity'],
      subtotal: double.parse(json['subtotal'].toString()),
      status: json['status'],
      kotId: json['kot'],
    );
  }
}

class Order {
  final int id;
  final String tableNumber;
  final String status;
  final double totalAmount;
  final List<OrderItem> items;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.tableNumber,
    required this.status,
    required this.totalAmount,
    required this.items,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      tableNumber: json['table_number'],
      status: json['status'],
      totalAmount: double.parse(json['total_amount'].toString()),
      items: (json['items'] as List)
          .map((item) => OrderItem.fromJson(item))
          .toList(),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  bool get canEdit {
    final now = DateTime.now();
    return now.difference(createdAt).inMinutes < 2;
  }
}
