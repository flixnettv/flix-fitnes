"""Reconcile User.role with the roles backend permissions actually grant.

The dashboard maps the User.role string directly to a UI (ROLE_MAP) while
backend authorization is driven by is_superuser + role-specific profiles.
These two sources can drift (e.g. legacy role="owner"), which silently routed
a superuser to the trainee view. This command normalizes every user so that
`role` matches the precedence the codebase applies:

    is_superuser            -> "super_admin"
    gym_admin_profile       -> "gym_admin"
    active trainer_profile  -> "trainer"
    client_profile          -> "client"
    otherwise               -> keep current valid role (or "client")

Usage:
    python manage.py reconcile_roles            # fix all (default)
    python manage.py reconcile_roles --check    # report only; exit 1 if dirty
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

VALID_ROLES = {"super_admin", "gym_admin", "trainer", "client"}


def resolve_role(user):
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


class Command(BaseCommand):
    help = "Normalize User.role to match the roles the backend actually grants."

    def add_arguments(self, parser):
        parser.add_argument(
            "--check", action="store_true",
            help="Report users needing a fix without modifying them (exit 1 if any).",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        dirty = []
        for user in User.objects.all().iterator():
            target = resolve_role(user)
            if user.role != target:
                dirty.append((user, target))

        if not dirty:
            self.stdout.write(self.style.SUCCESS("All user roles are consistent."))
            return

        for user, target in dirty:
            label = f"{user.email or user.username} [{user.role!r} -> {target!r}]"
            if options["check"]:
                self.stdout.write(f"would fix: {label}")
            else:
                user.role = target
                user.save(update_fields=["role"])
                self.stdout.write(self.style.WARNING(f"fixed: {label}"))

        if options["check"]:
            raise CommandError(f"{len(dirty)} user(s) need role reconciliation.")