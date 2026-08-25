import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/branding_service.dart' show GymBranding;

int _hex(String h, int fallback) {
  var s = h.replaceAll('#', '').trim();
  if (s.length == 6) s = 'FF$s';
  final v = int.tryParse(s, radix: 16);
  return v ?? fallback;
}

Color _darken(Color c, [double amount = .45]) {
  final hsl = HSLColor.fromColor(c);
  return hsl.withLightness((hsl.lightness * (1 - amount)).clamp(0.04, 1)).toColor();
}

Color _lighten(Color c, [double amount = .12]) {
  final hsl = HSLColor.fromColor(c);
  return hsl.withLightness((hsl.lightness + amount).clamp(0, 1)).toColor();
}

/// Professional dark theme built dynamically from the gym's branding.
class DynamicTheme {
  static ThemeData build(GymBranding b) {
    final primary = Color(_hex(b.primaryColor, 0xFF38BDF8));
    final secondary = Color(_hex(b.secondaryColor, 0xFF22D3EE));
    final accent = Color(_hex(b.accentColor, 0xFF4ADE80));
    final surfaceBase = Color(_hex(b.surfaceColor, 0xFF1E293B));
    final bg = _darken(surfaceBase, .72);

    final card = Color.alphaBlend(primary.withOpacity(.05), _darken(surfaceBase, .35));
    final scheme = ColorScheme.dark(
      primary: primary,
      onPrimary: Colors.white,
      secondary: secondary,
      onSecondary: _darken(secondary, .7),
      tertiary: accent,
      surface: card,
      onSurface: const Color(0xFFE2E8F0),
      onSurfaceVariant: const Color(0xFF94A3B8),
      error: const Color(0xFFF87171),
      outline: Colors.white.withOpacity(.08),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      splashFactory: InkRipple.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: scheme.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.bold,
          fontFamily: b.fontFamily,
        ),
        iconTheme: IconThemeData(color: scheme.onSurface),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: card,
        indicatorColor: primary.withOpacity(.18),
        height: 68,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
              color: states.contains(WidgetState.selected) ? primary : scheme.onSurfaceVariant,
            )),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
              fontSize: 12,
              fontWeight: states.contains(WidgetState.selected) ? FontWeight.bold : FontWeight.w500,
              color: states.contains(WidgetState.selected) ? primary : scheme.onSurfaceVariant,
            )),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: Colors.white.withOpacity(.06)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 54),
          elevation: 6,
          shadowColor: primary.withOpacity(.45),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: primary.withOpacity(.12),
        selectedColor: primary.withOpacity(.25),
        labelStyle: TextStyle(color: _lighten(primary, .3)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: primary),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: card,
        contentTextStyle: TextStyle(color: scheme.onSurface),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dividerTheme: DividerThemeData(color: Colors.white.withOpacity(.08)),
    );
  }

  /// Signature gradient for headers / hero cards.
  static LinearGradient heroGradient(Color primary, Color secondary) => LinearGradient(
        colors: [primary, secondary],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      );

  static SystemUiOverlayStyle overlay() => SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: Colors.black,
      );
}
