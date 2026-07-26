import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/menu.dart';
import '../models/table.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final AppUser user;
  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _apiService = ApiService();

  List<DiningTable> _tables = [];
  List<MenuCategory> _menu = [];
  DiningTable? _selectedTable;

  // menuItemId -> quantity
  final Map<int, int> _cart = {};

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _apiService.fetchTables(),
        _apiService.fetchMenu(),
      ]);
      setState(() {
        _tables = results[0] as List<DiningTable>;
        _menu = results[1] as List<MenuCategory>;
      });
    } catch (e) {
      setState(() => _error = 'Could not connect to the server.\nCheck the backend URL in api_config.dart.');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _changeQuantity(int menuItemId, int delta) {
    setState(() {
      final current = _cart[menuItemId] ?? 0;
      final updated = current + delta;
      if (updated <= 0) {
        _cart.remove(menuItemId);
      } else {
        _cart[menuItemId] = updated;
      }
    });
  }

  double get _cartTotal {
    double total = 0;
    for (final category in _menu) {
      for (final item in category.items) {
        final qty = _cart[item.id] ?? 0;
        total += qty * item.price;
      }
    }
    return total;
  }

  Future<void> _placeOrder() async {
    if (_selectedTable == null || _cart.isEmpty) return;

    final items = _cart.entries
        .map((e) => {'menu_item': e.key, 'quantity': e.value})
        .toList();

    try {
      await _apiService.placeOrder(tableId: _selectedTable!.id, items: items);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Order placed for Table ${_selectedTable!.number}!')),
      );
      setState(() => _cart.clear());
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to place order. Try again.')),
      );
    }
  }

  Future<void> _logout() async {
    await _apiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${widget.user.username}'),
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _buildOrderTaking(),
    );
  }

  Widget _buildOrderTaking() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: DropdownButtonFormField<DiningTable>(
            decoration: const InputDecoration(
              labelText: 'Select Table',
              border: OutlineInputBorder(),
            ),
            value: _selectedTable,
            items: _tables
                .map((t) => DropdownMenuItem(
                      value: t,
                      child: Text('Table ${t.number} (${t.status})'),
                    ))
                .toList(),
            onChanged: (t) => setState(() => _selectedTable = t),
          ),
        ),
        Expanded(
          child: ListView(
            children: _menu.map((category) {
              return ExpansionTile(
                title: Text(category.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                initiallyExpanded: true,
                children: category.items.where((i) => i.isAvailable).map((item) {
                  final qty = _cart[item.id] ?? 0;
                  return ListTile(
                    title: Text(item.name),
                    subtitle: Text('₹${item.price.toStringAsFixed(2)}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: qty > 0 ? () => _changeQuantity(item.id, -1) : null,
                        ),
                        Text('$qty', style: const TextStyle(fontSize: 16)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: () => _changeQuantity(item.id, 1),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            }).toList(),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_selectedTable != null && _cart.isNotEmpty) ? _placeOrder : null,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: Text('Place Order (₹${_cartTotal.toStringAsFixed(2)})'),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
