import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthState {
  final bool isLoading;
  final bool isLoggedIn;
  final User? user;
  final String? error;

  AuthState({this.isLoading = false, this.isLoggedIn = false, this.user, this.error});

  AuthState copyWith({bool? isLoading, bool? isLoggedIn, User? user, String? error, bool clearError = false, bool clearUser = false}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api;

  AuthNotifier(this._api) : super(AuthState());

  Future<void> init() async {
    state = state.copyWith(isLoading: true);
    await _api.init();
    if (_api.isLoggedIn) {
      try {
        final data = await _api.get('/auth/profile/');
        state = AuthState(isLoggedIn: true, user: User.fromJson(data));
      } catch (e) {
        state = AuthState(isLoggedIn: false);
      }
    } else {
      state = AuthState();
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.login(username, password);
      final data = await _api.get('/auth/profile/');
      state = AuthState(isLoggedIn: true, user: User.fromJson(data));
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    }
  }

  Future<void> register(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.register(data);
      state = state.copyWith(isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    }
  }

  Future<void> logout() async {
    await _api.logout();
    state = AuthState();
  }

  Future<void> refreshProfile() async {
    try {
      final data = await _api.get('/auth/profile/');
      state = state.copyWith(user: User.fromJson(data));
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await _api.logout();
        state = AuthState();
      }
    } catch (_) {}
  }
}

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AuthNotifier(api);
});
