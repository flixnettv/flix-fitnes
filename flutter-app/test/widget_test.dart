import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fitpro_app/app.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: App()));
    expect(find.textContaining('FitPro'), findsWidgets);
  });
}
