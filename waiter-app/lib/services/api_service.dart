import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';
import '../models/user.dart';
import '../models/menu.dart';
import '../models/table.dart';
import '../models/order.dart';

/// Thin wrapper around the Django REST API. Handles JWT storage and
/// attaches the Authorization header automatically.
class ApiService {
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _userKey = 'cached_user';

  Future<String?> get _accessToken async =>
      (await SharedPreferences.getInstance()).getString(_accessKey);

  Future<Map<String, String>> _authHeaders() async {
    final token = await _accessToken;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Helper to handle token expiration and automatic refresh
  Future<http.Response> _authenticatedRequest(
    Future<http.Response> Function(Map<String, String> headers) requestFn,
  ) async {
    var response = await requestFn(await _authHeaders());

    if (response.statusCode == 401) {
      // Attempt to refresh token
      final success = await _refreshToken();
      if (success) {
        // Retry original request with new token
        response = await requestFn(await _authHeaders());
      }
    }

    return response;
  }

  Future<bool> _refreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refresh = prefs.getString(_refreshKey);
    if (refresh == null) return false;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/refresh/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh': refresh}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await prefs.setString(_accessKey, data['access']);
        return true;
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }

    // If refresh fails, logout
    await logout();
    return false;
  }

  /// POST /auth/login/ — returns the logged-in user, throws on failure.
  Future<AppUser> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/auth/login/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode != 200) {
      throw Exception('Invalid username or password');
    }

    final data = jsonDecode(response.body);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, data['access']);
    await prefs.setString(_refreshKey, data['refresh']);
    await prefs.setString(_userKey, jsonEncode(data['user']));
    return AppUser.fromJson(data['user']);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
    await prefs.remove(_userKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await _accessToken;
    return token != null;
  }

  /// Returns the cached user from the last successful login, if any.
  Future<AppUser?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return AppUser.fromJson(jsonDecode(raw));
  }

  /// GET /menu/categories/ — categories with nested available items.
  Future<List<MenuCategory>> fetchMenu() async {
    final response = await _authenticatedRequest((headers) => http.get(
      Uri.parse('${ApiConfig.baseUrl}/menu/categories/'),
      headers: headers,
    ));
    if (response.statusCode != 200) {
      throw Exception('Failed to load menu');
    }
    final List data = jsonDecode(response.body);
    return data.map((c) => MenuCategory.fromJson(c)).toList();
  }

  /// GET /tables/ — all dining tables.
  Future<List<DiningTable>> fetchTables() async {
    final response = await _authenticatedRequest((headers) => http.get(
      Uri.parse('${ApiConfig.baseUrl}/tables/'),
      headers: headers,
    ));
    if (response.statusCode != 200) {
      throw Exception('Failed to load tables');
    }
    final List data = jsonDecode(response.body);
    return data.map((t) => DiningTable.fromJson(t)).toList();
  }

  /// POST /orders/ — places an order for a table.
  /// `items` is a list of {"menu_item": id, "quantity": n}.
  Future<void> placeOrder({
    required int tableId,
    required List<Map<String, dynamic>> items,
    String subTable = '',
    String notes = '',
  }) async {
    final response = await _authenticatedRequest((headers) => http.post(
      Uri.parse('${ApiConfig.baseUrl}/orders/'),
      headers: headers,
      body: jsonEncode({
        'table': tableId,
        'sub_table': subTable,
        'items': items,
        'notes': notes,
        'order_type': 'DINE_IN',
      }),
    ));
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to place order: ${response.body}');
    }
  }

  /// PUT /orders/ID/ — updates an existing order.
  Future<void> updateOrder({
    required int orderId,
    required List<Map<String, dynamic>> items,
  }) async {
    final response = await _authenticatedRequest((headers) => http.put(
      Uri.parse('${ApiConfig.baseUrl}/orders/$orderId/'),
      headers: headers,
      body: jsonEncode({
        'items': items,
      }),
    ));
    if (response.statusCode != 200) {
      throw Exception('Failed to update order: ${response.body}');
    }
  }

  /// GET /orders/?table=ID&status=PENDING,PREPARING,SERVED
  Future<List<Order>> fetchActiveOrders(int tableId) async {
    final response = await _authenticatedRequest((headers) => http.get(
      Uri.parse('${ApiConfig.baseUrl}/orders/?table=$tableId&status=PENDING,PREPARING,SERVED'),
      headers: headers,
    ));
    if (response.statusCode != 200) {
      throw Exception('Failed to load active orders');
    }
    final List data = jsonDecode(response.body);
    return data.map((o) => Order.fromJson(o)).toList();
  }
}
