/// Central place to configure the backend URL.
///
/// The waiter app runs on a phone/tablet connected to the SAME hotel WiFi
/// as the Django server, so `localhost` will NOT work here — it must be
/// the server PC's local network IP (e.g. 192.168.1.5).
///
/// Provide a build-time define such as `--dart-define=API_BASE_URL=http://192.168.1.5:8000/api`
/// to override the default value.
class ApiConfig {
  static const String _defaultBaseUrl = 'http://10.113.175.105:8000/api';

  static String get baseUrl {
    const override = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    return override.isNotEmpty ? override : _defaultBaseUrl;
  }
}
