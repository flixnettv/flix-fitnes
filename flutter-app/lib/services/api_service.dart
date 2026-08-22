import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final Map<String, dynamic>? errors;

  ApiException({this.statusCode, required this.message, this.errors});

  @override
  String toString() => message;
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late Dio _dio;
  String? _accessToken;
  String? _refreshToken;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: '${ApiConfig.baseUrl}${ApiConfig.apiPrefix}',
      connectTimeout: ApiConfig.timeout,
      receiveTimeout: ApiConfig.timeout,
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 && _refreshToken != null) {
          final refreshed = await _refreshAccessToken();
          if (refreshed) {
            error.requestOptions.headers['Authorization'] = 'Bearer $_accessToken';
            final response = await _dio.fetch(error.requestOptions);
            return handler.resolve(response);
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
  }

  Future<bool> _refreshAccessToken() async {
    try {
      final response = await _dio.post('/auth/refresh/', data: {'refresh': _refreshToken});
      _accessToken = response.data['access'];
      if (response.data['refresh'] != null) {
        _refreshToken = response.data['refresh'];
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', _accessToken!);
      if (_refreshToken != null) await prefs.setString('refresh_token', _refreshToken!);
      return true;
    } catch (e) {
      await logout();
      return false;
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login/', data: {
        'username': username,
        'password': password,
      });
      _accessToken = response.data['access'];
      _refreshToken = response.data['refresh'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', _accessToken!);
      await prefs.setString('refresh_token', _refreshToken!);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/auth/register/', data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }

  bool get isLoggedIn => _accessToken != null;

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    try {
      final response = await _dio.get(path, queryParameters: params);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? data}) async {
    try {
      final response = await _dio.put(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      String message = 'حدث خطأ';
      Map<String, dynamic>? errors;

      if (data is Map<String, dynamic>) {
        errors = data;
        if (data.containsKey('detail')) {
          message = data['detail'].toString();
        } else if (data.containsKey('non_field_errors')) {
          message = (data['non_field_errors'] as List).join(', ');
        } else {
          final firstError = data.values.first;
          if (firstError is List) {
            message = firstError.first.toString();
          } else {
            message = firstError.toString();
          }
        }
      }
      return ApiException(statusCode: e.response!.statusCode, message: message, errors: errors);
    }
    return ApiException(message: 'خطأ في الاتصال بالخادم');
  }
}
