/// Central place to configure the backend URL.
///
/// The waiter app runs on a phone/tablet connected to the SAME hotel WiFi
/// as the Django server, so `localhost` will NOT work here — it must be
/// the server PC's local network IP (e.g. 192.168.1.5).
///
/// Find it by running `ipconfig` (Windows) or `ifconfig` / `ip addr`
/// (Mac/Linux) on the machine running the Django server.
class ApiConfig {
  static const String baseUrl = 'http://10.125.61.105:8000/api';
}
