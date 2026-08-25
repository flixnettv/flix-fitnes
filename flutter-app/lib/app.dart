import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'services/branding_service.dart';
import 'theme/dynamic_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/exercises/exercises_screen.dart';
import 'screens/exercises/exercise_detail_screen.dart';
import 'screens/workouts/workouts_screen.dart';
import 'screens/nutrition/nutrition_screen.dart';
import 'screens/measurements/measurements_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/owner/owner_dashboard.dart';
import 'screens/coach/coach_dashboard.dart';
import 'models/exercise.dart';
import 'providers/auth_provider.dart';

/// Gym branding — fetched once at startup, cached offline.
final brandingProvider = FutureProvider<GymBranding>((ref) => BrandingService.load());

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final isLoggedIn = auth.isLoggedIn;
      final loc = state.matchedLocation;
      final isAuthRoute = loc == '/login' || loc == '/register' || loc == '/splash';
      if (!isLoggedIn && !isAuthRoute) return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => ScaffoldWithNav(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/owner', builder: (_, __) => const OwnerDashboard()),
          GoRoute(path: '/coach', builder: (_, __) => const CoachDashboard()),
          GoRoute(path: '/exercises', builder: (_, __) => const ExercisesScreen()),
          GoRoute(path: '/workouts', builder: (_, __) => const WorkoutsScreen()),
          GoRoute(path: '/nutrition', builder: (_, __) => const NutritionScreen()),
          GoRoute(path: '/measurements', builder: (_, __) => const MeasurementsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/exercises/detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) => ExerciseDetailScreen(exercise: state.extra as Exercise),
      ),
      GoRoute(
        path: '/notifications',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const NotificationsScreen(),
      ),
    ],
  );
});

class ScaffoldWithNav extends ConsumerWidget {
  final Widget child;
  const ScaffoldWithNav({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final role = ref.watch(authProvider).user?.role ?? 'client';

    int selectedIndex = 0;
    if (location.startsWith('/exercises')) selectedIndex = 1;
    if (location.startsWith('/workouts')) selectedIndex = 2;
    if (location.startsWith('/nutrition')) selectedIndex = 3;
    if (location.startsWith('/measurements') ||
        location.startsWith('/profile') ||
        location.startsWith('/notifications')) {
      selectedIndex = 4;
    }

    String firstLabel = 'الرئيسية';
    IconData firstIcon = Icons.home_outlined;
    IconData firstSelectedIcon = Icons.home;
    String firstRoute = '/home';
    if (role == 'owner') {
      firstLabel = 'لوحتي';
      firstIcon = Icons.dashboard_outlined;
      firstSelectedIcon = Icons.dashboard;
      firstRoute = '/owner';
    } else if (role == 'coach' || role == 'trainer') {
      firstLabel = 'عملائي';
      firstIcon = Icons.groups_outlined;
      firstSelectedIcon = Icons.groups;
      firstRoute = '/coach';
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go(firstRoute);
            case 1:
              context.go('/exercises');
            case 2:
              context.go('/workouts');
            case 3:
              context.go('/nutrition');
            case 4:
              context.go('/profile');
          }
        },
        destinations: [
          NavigationDestination(icon: Icon(firstIcon), selectedIcon: Icon(firstSelectedIcon), label: firstLabel),
          const NavigationDestination(icon: Icon(Icons.fitness_center_outlined), selectedIcon: Icon(Icons.fitness_center), label: 'التمارين'),
          const NavigationDestination(icon: Icon(Icons.timer_outlined), selectedIcon: Icon(Icons.timer), label: 'الجلسات'),
          const NavigationDestination(icon: Icon(Icons.restaurant_outlined), selectedIcon: Icon(Icons.restaurant), label: 'التغذية'),
          const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'حسابي'),
        ],
      ),
    );
  }
}

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandingAsync = ref.watch(brandingProvider);

    return brandingAsync.when(
      loading: () => MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFF0F172A),
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.fitness_center, size: 72, color: Colors.cyanAccent.withOpacity(.9)),
                const SizedBox(height: 24),
                const CircularProgressIndicator(color: Colors.cyanAccent),
              ],
            ),
          ),
        ),
      ),
      error: (_, __) => _material(ref, GymBranding.fallback),
      data: (b) => _material(ref, b),
    );
  }

  Widget _material(WidgetRef ref, GymBranding b) {
    final router = ref.watch(routerProvider);
    SystemChrome.setSystemUIOverlayStyle(DynamicTheme.overlay());
    return MaterialApp.router(
      title: b.name,
      theme: DynamicTheme.build(b),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      builder: (context, child) => Directionality(textDirection: TextDirection.rtl, child: child!),
    );
  }
}
