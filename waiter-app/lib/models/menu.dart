class MenuItem {
  final int id;
  final String name;
  final double price;
  final bool isAvailable;
  final int categoryId;

  MenuItem({
    required this.id,
    required this.name,
    required this.price,
    required this.isAvailable,
    required this.categoryId,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      name: json['name'],
      price: double.parse(json['price'].toString()),
      isAvailable: json['is_available'] ?? true,
      categoryId: json['category'],
    );
  }
}

class MenuCategory {
  final int id;
  final String name;
  final List<MenuItem> items;

  MenuCategory({required this.id, required this.name, required this.items});

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    return MenuCategory(
      id: json['id'],
      name: json['name'],
      items: (json['items'] as List)
          .map((item) => MenuItem.fromJson(item))
          .toList(),
    );
  }
}
