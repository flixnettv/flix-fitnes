import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Gym branding loaded dynamically from the API (white-label).
class GymBranding {
  final String name;
  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String backgroundColor;
  final String surfaceColor;
  final String fontFamily;
  final String? logo;

  const GymBranding({
    this.name = 'FitPro Center',
    this.primaryColor = '#38BDF8',
    this.secondaryColor = '#22D3EE',
    this.accentColor = '#4ADE80',
    this.backgroundColor = '#0F172A',
    this.surfaceColor = '#1E293B',
    this.fontFamily = 'Cairo',
    this.logo,
  });

  factory GymBranding.fromJson(Map<String, dynamic> j) => GymBranding(
        name: (j['name'] as String?) ?? 'FitPro Center',
        primaryColor: (j['primary_color'] as String?) ?? '#38BDF8',
        secondaryColor: (j['secondary_color'] as String?) ?? '#22D3EE',
        accentColor: (j['accent_color'] as String?) ?? '#4ADE80',
        backgroundColor: (j['background_color'] as String?) ?? '#0F172A',
        surfaceColor: (j['surface_color'] as String?) ?? '#1E293B',
        fontFamily: (j['font_family'] as String?) ?? 'Cairo',
        logo: j['logo'] as String?,
      );

  static const fallback = GymBranding();

  Map<String, dynamic> toJson() => {
        'name': name,
        'primary_color': primaryColor,
        'secondary_color': secondaryColor,
        'accent_color': accentColor,
        'background_color': backgroundColor,
        'surface_color': surfaceColor,
        'font_family': fontFamily,
        'logo': logo,
      };

  factory GymBranding.fromJsonCached(String s) =>
      GymBranding.fromJson(jsonDecode(s) as Map<String, dynamic>);
}

class BrandingService {
  static const _cacheKey = 'gym_branding_v1';

  /// Fetch branding; falls back to cache then defaults.
  static Future<GymBranding> load() async {
    final prefs = await SharedPreferences.getInstance();
    final base = Uri.base.origin;
    final url = '$base/api/v1/gyms/branding/';
    try {
      final res = await http
          .get(Uri.parse(url), headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final b = GymBranding.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
        await prefs.setString(_cacheKey, jsonEncode(b.toJson()));
        return b;
      }
    } catch (_) {// offline: use cache below
    }
    final cached = prefs.getString(_cacheKey);
    if (cached != null) {
      try {
        return GymBranding.fromJsonCached(cached);
      } catch (_) {}
    }
    return GymBranding.fallback;
  }
}
