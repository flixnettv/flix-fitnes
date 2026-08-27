"""Reconcile invalid User.role values with valid ROLE_CHOICES.

Legacy provisioning created accounts with role="owner" (an old value no longer
defined in ROLE_CHOICES). The backend authorization relies on is_superuser and
role-specific profiles, but the dashboard maps the bare `role` string to a UI
(ROLE_MAP) and falls back to "client" for unknown values — which silently put a
platform admin into the trainee view. This migration normalizes any out-of-range
role using the same precedence the codebase applies for permission decisions.

Non-reversible (role values are derived state, not user data).
"""
from django.db import migrations

VALID_ROLES = {"super_admin", "gym_admin", "trainer", "client"}


def resolve_role(user):
    """Derive the role that matches how backend permissions already work."""
    role = user.role
    if role in VALID_ROLES:
        return role
    if user.is_superuser:
        return "super_admin"
    if hasattr(user, "gym_admin_profile"):
        return "gym_admin"
    if hasattr(user, "trainer_profile") and user.trainer_profile.is_active:
        return "trainer"
    if hasattr(user, "client_profile"):
        return "client"
    return "client"


def forwards(apps, schema_editor):
    User = apps.get_model("acct", "User")
    updated = 0
    for user in User.objects.all():
        target = resolve_role(user)
        if user.role != target:
            user.role = target
            user.save(update_fields=["role"])
            updated += 1
    if updated:
        print(f"reconciled {updated} user role(s)")


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("acct", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]