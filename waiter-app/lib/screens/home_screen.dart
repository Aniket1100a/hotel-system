import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/menu.dart';
import '../models/table.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_button.dart';
import '../widgets/quantity_stepper.dart';
import '../widgets/status_pill.dart';
import '../widgets/table_chip.dart';
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
  List<Order> _activeOrders = [];

  // menuItemId -> quantity
  final Map<int, int> _cart = {};

  bool _loading = true;
  bool _fetchingOrders = false;
  bool _connected = true;
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
        _connected = true;
      });
    } catch (e) {
      setState(() {
        _connected = false;
        _error = 'Could not reach the server.\nCheck the WiFi connection and the API address in api_config.dart.';
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchActiveOrders(int tableId) async {
    setState(() => _fetchingOrders = true);
    try {
      final orders = await _apiService.fetchActiveOrders(tableId);
      setState(() => _activeOrders = orders);
    } catch (e) {
      print('Error fetching active orders: $e');
    } finally {
      setState(() => _fetchingOrders = false);
    }
  }

  void _selectTable(DiningTable table) {
    setState(() {
      _selectedTable = table;
      _activeOrders = [];
      _cart.clear();
    });
    _fetchActiveOrders(table.id);
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

  int get _cartItemCount => _cart.values.fold(0, (sum, q) => sum + q);

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
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.textPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          content: Text('Order placed for Table ${_selectedTable!.number}'),
        ),
      );
      setState(() => _cart.clear());
      _fetchActiveOrders(_selectedTable!.id);
      _apiService.fetchTables().then((t) => setState(() => _tables = t));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.danger,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          content: const Text('Failed to place order. Please try again.'),
        ),
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
      appBar: _buildAppBar(),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _buildErrorState()
              : _buildOrderTaking(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      titleSpacing: 20,
      title: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.primarySoft,
            child: Text(
              widget.user.username.isNotEmpty ? widget.user.username[0].toUpperCase() : '?',
              style: const TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(widget.user.username, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              RoleBadge(role: widget.user.role),
            ],
          ),
        ],
      ),
      actions: [
        StatusPill(
          label: _connected ? 'Online' : 'Offline',
          color: _connected ? AppColors.success : AppColors.danger,
          softColor: _connected ? AppColors.successSoft : AppColors.dangerSoft,
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _logout,
          icon: const Icon(Icons.logout_outlined, size: 20),
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 8),
      ],
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(height: 1),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: AppColors.dangerSoft, shape: BoxShape.circle),
              child: const Icon(Icons.wifi_off_rounded, color: AppColors.danger, size: 26),
            ),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 20),
            SizedBox(width: 160, child: AppButton(label: 'Retry', onPressed: _loadData)),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderTaking() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            children: [
              _sectionLabel('SELECT TABLE'),
              const SizedBox(height: 10),
              _tables.isEmpty
                  ? _emptyHint('No tables set up yet. Add one from the admin panel.')
                  : Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _tables.map((t) {
                        return TableChip(
                          table: t,
                          selected: _selectedTable?.id == t.id,
                          onTap: () => _selectTable(t),
                        );
                      }).toList(),
                    ),
              if (_selectedTable != null && _activeOrders.isNotEmpty) ...[
                const SizedBox(height: 24),
                _sectionLabel('ACTIVE ORDERS (TABLE ${_selectedTable!.number})'),
                const SizedBox(height: 10),
                ..._activeOrders.map((order) => _buildActiveOrderCard(order)),
              ],
              const SizedBox(height: 24),
              _sectionLabel('MENU'),
              const SizedBox(height: 10),
              _menu.isEmpty
                  ? _emptyHint('No menu items yet. Add some from the admin panel.')
                  : Column(
                      children: _menu.map((category) => _buildCategoryCard(category)).toList(),
                    ),
              const SizedBox(height: 100), // room for the floating cart bar
            ],
          ),
        ),
        _buildCartBar(),
      ],
    );
  }

  Widget _buildActiveOrderCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primarySoft.withOpacity(0.3),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primarySoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Order #${order.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              StatusPill(
                label: order.status,
                color: order.status == 'PENDING' ? AppColors.warning : AppColors.success,
                softColor: order.status == 'PENDING' ? AppColors.warningSoft : AppColors.successSoft,
              ),
            ],
          ),
          const Divider(height: 20),
          ...order.items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                Text('${item.quantity}x ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                Expanded(child: Text(item.menuItemName, style: const TextStyle(fontSize: 12))),
                if (item.status == 'READY')
                  const Icon(Icons.check_circle, color: AppColors.success, size: 14)
                else if (item.status == 'PREPARING')
                  const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warning))
                else
                  const Icon(Icons.timer_outlined, color: AppColors.textMuted, size: 14),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: AppColors.textSecondary,
      ),
    );
  }

  Widget _emptyHint(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(text, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
    );
  }

  Widget _buildCategoryCard(MenuCategory category) {
    final availableItems = category.items.where((i) => i.isAvailable).toList();
    if (availableItems.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: true,
          tilePadding: const EdgeInsets.symmetric(horizontal: 16),
          childrenPadding: const EdgeInsets.only(bottom: 4),
          iconColor: AppColors.primary,
          collapsedIconColor: AppColors.textMuted,
          title: Row(
            children: [
              Expanded(
                child: Text(category.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              Text(
                '${availableItems.length} item${availableItems.length == 1 ? '' : 's'}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),
          children: availableItems.map((item) {
            final qty = _cart[item.id] ?? 0;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 2),
                        Text('₹${item.price.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  QuantityStepper(
                    quantity: qty,
                    onIncrement: () => _changeQuantity(item.id, 1),
                    onDecrement: qty > 0 ? () => _changeQuantity(item.id, -1) : null,
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildCartBar() {
    final hasItems = _cart.isNotEmpty;
    final canPlaceOrder = _selectedTable != null && hasItems;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, -4)),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    hasItems ? '$_cartItemCount item${_cartItemCount == 1 ? '' : 's'} selected' : 'No items yet',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  Text(
                    '₹${_cartTotal.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 3,
              child: AppButton(
                label: _selectedTable == null ? 'Select a table' : 'Place Order',
                onPressed: canPlaceOrder ? _placeOrder : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
