import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'models/user.dart';

void main() {
  runApp(const HotelWaiterApp());
}

class HotelWaiterApp extends StatelessWidget {
  const HotelWaiterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hotel Waiter App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF111827),
        useMaterial3: true,
      ),
      home: const _AuthGate(),
    );
  }
}

/// Checks for a stored token on launch and routes straight to the order
/// screen if already logged in, otherwise shows the login screen.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  final _apiService = ApiService();
  bool _checking = true;
  AppUser? _cachedUser;

  @override
  void initState() {
    super.initState();
    _checkLogin();
  }

  Future<void> _checkLogin() async {
    final loggedIn = await _apiService.isLoggedIn();
    final user = loggedIn ? await _apiService.getCachedUser() : null;
    setState(() {
      _cachedUser = user;
      _checking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_cachedUser != null) {
      return HomeScreen(user: _cachedUser!);
    }
    return const LoginScreen();
  }
}
