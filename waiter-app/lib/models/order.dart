class OrderItem {
  final int id;
  final int menuItemId;
  final String menuItemName;
  final int quantity;
  final double subtotal;
  final String status;

  OrderItem({
    required this.id,
    required this.menuItemId,
    required this.menuItemName,
    required this.quantity,
    required this.subtotal,
    required this.status,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      menuItemId: json['menu_item'],
      menuItemName: json['menu_item_name'],
      quantity: json['quantity'],
      subtotal: double.parse(json['subtotal'].toString()),
      status: json['status'],
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
    // Waiters can edit until it's PAID or CANCELLED
    return status != 'PAID' && status != 'CANCELLED';
  }
}
