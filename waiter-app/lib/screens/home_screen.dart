import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  List<DiningTable> _tables = [];
  List<MenuCategory> _menu = [];
  DiningTable? _selectedTable;
  List<Order> _activeOrders = [];
  int? _activeOrderId;

  // For large menus: Filtered items
  String _searchQuery = '';
  int? _activeCategoryId;

  // menuItemId -> quantity
  final Map<int, int> _cart = {};

  bool _connected = true;
  String? _error;
  bool _loading = true;

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
        if (_menu.isNotEmpty && _activeCategoryId == null) {
          _activeCategoryId = _menu[0].id;
        }
        _connected = true;
        _loading = false;
      });
      
      if (_selectedTable != null) {
        _fetchActiveOrders(_selectedTable!.id);
      }
    } catch (e) {
      setState(() {
        _connected = false;
        _loading = false;
        _error = 'Sync failed. System is attempting to reconnect...';
      });
    }
  }

  Future<void> _fetchActiveOrders(int tableId) async {
    try {
      final orders = await _apiService.fetchActiveOrders(tableId);
      setState(() {
        _activeOrders = orders;
        _cart.clear();
        if (_activeOrders.isNotEmpty) {
          final order = _activeOrders.first;
          _activeOrderId = order.id;
          for (var item in order.items) {
            _cart[item.menuItemId] = item.quantity;
          }
        } else {
          _activeOrderId = null;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _activeOrders = [];
        _activeOrderId = null;
      });
    }
  }

  void _selectTable(DiningTable table) {
    HapticFeedback.mediumImpact();
    setState(() {
      _selectedTable = table;
      _activeOrders = [];
      _activeOrderId = null;
      _cart.clear();
    });
    _fetchActiveOrders(table.id);
  }

  void _changeQuantity(int menuItemId, int delta) {
    HapticFeedback.lightImpact();
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

  MenuItem? _findMenuItemById(int id) {
    for (var cat in _menu) {
      for (var item in cat.items) {
        if (item.id == id) return item;
      }
    }
    return null;
  }

  Future<void> _placeOrder() async {
    if (_selectedTable == null) return;

    final items = _cart.entries
        .map((e) => {'menu_item': e.key, 'quantity': e.value})
        .toList();

    try {
      if (_activeOrderId != null) {
        await _apiService.updateOrder(orderId: _activeOrderId!, items: items);
      } else {
        if (items.isEmpty) return;
        await _apiService.placeOrder(tableId: _selectedTable!.id, items: items);
      }
      
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.textPrimary,
          margin: const EdgeInsets.all(20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: AppColors.success, size: 20),
              const SizedBox(width: 12),
              Text(_activeOrderId != null ? 'Order Updated: Table ${_selectedTable!.number}' : 'Order Sent: Table ${_selectedTable!.number}', 
                style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
      
      // Refresh state
      _fetchActiveOrders(_selectedTable!.id);
      _apiService.fetchTables().then((t) => setState(() => _tables = t));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.danger,
          content: Text('Error: ${e.toString()}'),
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
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: _loading
        ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
        : _error != null
          ? _buildErrorState()
          : _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      toolbarHeight: 70,
      titleSpacing: 20,
      elevation: 0,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 2),
            ),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primarySoft,
              child: Text(
                widget.user.username.isNotEmpty ? widget.user.username[0].toUpperCase() : '?',
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 13),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(widget.user.username, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 4),
                  Text('SYSTEM ONLINE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5)),
                ],
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          onPressed: _loadData,
          icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
        ),
        IconButton(
          onPressed: _logout,
          icon: const Icon(Icons.logout_rounded, size: 20, color: AppColors.danger),
        ),
        const SizedBox(width: 12),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.dangerSoft, shape: BoxShape.circle),
              child: const Icon(Icons.cloud_off_rounded, color: AppColors.danger, size: 32),
            ),
            const SizedBox(height: 24),
            const Text('Network Outage', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
            const SizedBox(height: 32),
            SizedBox(width: double.infinity, child: AppButton(label: 'Reconnect System', onPressed: _loadData)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    return Column(
      children: [
        // Table Selection - Horizontal Scroll
        _buildTableSelector(),

        // Active Order Summary Card
        _buildActiveOrderSummary(),

        // Menu Section
        Expanded(
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Color(0x05000000), blurRadius: 20, offset: Offset(0, -10))],
            ),
            child: Column(
              children: [
                _buildSearchAndCategories(),
                Expanded(child: _buildMenuItems()),
              ],
            ),
          ),
        ),

        _buildCartBar(),
      ],
    );
  }

  Widget _buildActiveOrderSummary() {
    if (_selectedTable == null) return const SizedBox.shrink();

    final hasItems = _cart.isNotEmpty;
    final isExisting = _activeOrderId != null;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isExisting ? AppColors.primarySoft : AppColors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isExisting ? AppColors.primary.withOpacity(0.2) : AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TABLE ${_selectedTable!.number} - ${isExisting ? 'LIVE ORDER' : 'NEW ORDER'}',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  color: isExisting ? AppColors.primary : AppColors.textSecondary,
                  letterSpacing: 0.8
                ),
              ),
              if (isExisting && _activeOrders.isNotEmpty)
                StatusPill(
                  label: _activeOrders.first.status,
                  color: AppColors.warning,
                  softColor: AppColors.warningSoft,
                ),
            ],
          ),
          if (hasItems) ...[
            const SizedBox(height: 12),
            ..._cart.entries.map((entry) {
              final menuItem = _findMenuItemById(entry.key);
              if (menuItem == null) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4)),
                      child: Text('${entry.value}x', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.primary)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(menuItem.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary)),
                    ),
                    Text('₹${(menuItem.price * entry.value).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              );
            }).toList(),
          ] else ...[
            const SizedBox(height: 8),
            Text(
              'Add order for Table ${_selectedTable!.number}.',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTableSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text('TABLE MANAGEMENT', style: Theme.of(context).textTheme.labelSmall),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: _tables.map((t) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: TableChip(
                  table: t,
                  selected: _selectedTable?.id == t.id,
                  onTap: () => _selectTable(t),
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndCategories() {
    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _searchQuery = v),
            decoration: InputDecoration(
              hintText: 'Search menu (e.g. Pasta, Coffee)',
              hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted),
              filled: true,
              fillColor: AppColors.background,
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
          ),
        ),

        // Horizontal Categories for large menus
        if (_searchQuery.isEmpty)
          Container(
            height: 40,
            margin: const EdgeInsets.only(bottom: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _menu.length,
              itemBuilder: (context, index) {
                final cat = _menu[index];
                final isSelected = _activeCategoryId == cat.id;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text(cat.name),
                    selected: isSelected,
                    onSelected: (s) {
                      if (s) {
                        setState(() => _activeCategoryId = cat.id);
                        _scrollToTop();
                      }
                    },
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      fontSize: 12,
                    ),
                    backgroundColor: AppColors.background,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    showCheckmark: false,
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  void _scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  }

  Widget _buildMenuItems() {
    List<MenuItem> displayItems = [];

    if (_searchQuery.isNotEmpty) {
      for (var cat in _menu) {
        displayItems.addAll(cat.items.where((i) =>
          i.name.toLowerCase().contains(_searchQuery.toLowerCase()) && i.isAvailable
        ));
      }
    } else if (_activeCategoryId != null) {
      final activeCat = _menu.firstWhere((c) => c.id == _activeCategoryId);
      displayItems = activeCat.items.where((i) => i.isAvailable).toList();
    }

    if (displayItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.restaurant_menu_rounded, size: 48, color: AppColors.border),
            const SizedBox(height: 16),
            Text(_searchQuery.isNotEmpty ? 'No items match your search' : 'Category is empty',
              style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return ListView.separated(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 100),
      itemCount: displayItems.length,
      separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.borderLight),
      itemBuilder: (context, index) {
        final item = displayItems[index];
        final qty = _cart[item.id] ?? 0;

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  item.isVeg ? Icons.eco_rounded : Icons.kebab_dining_rounded,
                  color: item.isVeg ? Colors.green.withOpacity(0.5) : Colors.brown.withOpacity(0.5),
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text('₹${item.price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.primary)),
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
      },
    );
  }

  Widget _buildCartBar() {
    final hasItems = _cart.isNotEmpty;
    final isEditing = _activeOrderId != null;
    final canPlaceOrder = _selectedTable != null && (hasItems || isEditing);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppColors.borderLight)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isEditing ? 'EDITING ACTIVE ORDER' : (hasItems ? '$_cartItemCount ITEMS IN CART' : 'SELECT ITEMS'),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: isEditing ? AppColors.primary : AppColors.textMuted, letterSpacing: 0.5),
                ),
                Text(
                  '₹${_cartTotal.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: AppButton(
              label: _selectedTable == null ? 'SELECT TABLE' : (isEditing ? 'UPDATE ORDER' : 'SEND ORDER'),
              onPressed: canPlaceOrder ? _placeOrder : null,
            ),
          ),
        ],
      ),
    );
  }
}
