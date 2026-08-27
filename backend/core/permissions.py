"""
Core Permissions Module

Custom permission classes for FitPro platform RBAC.
"""
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow access only to platform super admins."""
    message = "Platform admin access required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class IsPlatformAdmin(BasePermission):
    """Allow access to platform admins (superuser or explicit platform_admin role)."""
    message = "Platform admin access required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsGymAdmin(BasePermission):
    """Allow access to gym admins (users with gym_admin_profile)."""
    message = "Gym admin access required."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "gym_admin_profile"))

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, "gym_admin_profile"):
            return False
        if hasattr(obj, 'gym'):
            return request.user.gym_admin_profile.gym == obj.gym
        return False


class IsGymAdminOrTrainer(BasePermission):
    """Allow access to gym admins or trainers of the same gym."""
    message = "Gym admin or trainer access required."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return bool(
            hasattr(u, "gym_admin_profile") or 
            hasattr(u, "trainer_profile") or 
            u.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        u = request.user
        if u.is_superuser:
            return True
        if hasattr(u, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return u.gym_admin_profile.gym == obj.gym
        if hasattr(u, "trainer_profile"):
            if hasattr(obj, "trainer"):
                return u.trainer_profile == obj.trainer
            if hasattr(obj, "trainer_profile"):
                return u.trainer_profile == obj.trainer_profile
        return False


class IsTrainer(BasePermission):
    """Allow access to active trainers."""
    message = "Trainer access required."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "trainer_profile"))

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, "trainer_profile"):
            return False
        if hasattr(request.user, 'trainer_profile'):
            if hasattr(obj, 'trainer'):
                return request.user.trainer_profile == obj.trainer
            if hasattr(obj, 'trainer_profile'):
                return request.user.trainer_profile == obj.trainer_profile
        return False


class IsClient(BasePermission):
    """Allow access to clients (users with client_profile)."""
    message = "Client access required."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "client_profile"))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'client_profile'):
            if hasattr(obj, 'client'):
                return request.user.client_profile == obj.client
            if hasattr(obj, 'client_profile'):
                return request.user.client_profile == obj.client_profile
        return False


class IsOwnerOrReadOnly(BasePermission):
    """Allow read access to all, write only to owner."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False


class IsGymMember(BasePermission):
    """Allow access to gym members (clients and trainers of the same gym)."""
    message = "Gym membership required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        gym = request.user.get_gym()
        return bool(gym)

    def has_object_permission(self, request, view, obj):
        gym = request.user.get_gym()
        if not gym:
            return False
        if hasattr(obj, 'gym'):
            return obj.gym == gym
        if hasattr(obj, 'client_profile') and obj.client_profile.gym:
            return obj.client_profile.gym == gym
        if hasattr(obj, 'trainer_profile') and obj.trainer_profile:
            return obj.trainer_profile.gym == gym
        return False


class IsOwnerOrGymStaff(BasePermission):
    """Allow access to object owner or gym staff (admin/trainer)."""
    message = "Owner or gym staff access required."

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'client_profile') and not hasattr(request.user, 'trainer_profile') and not hasattr(request.user, 'gym_admin_profile'):
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'gym_admin_profile'):
            if hasattr(obj, 'gym'):
                return obj.gym == request.user.gym_admin_profile.gym
        if hasattr(request.user, 'trainer_profile'):
            if hasattr(obj, 'trainer'):
                return obj.trainer == request.user.trainer_profile
            if hasattr(obj, 'trainer_profile'):
                return obj.trainer_profile == request.user.trainer_profile
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        if hasattr(obj, 'client_profile') and obj.client_profile.gym:
            gym = obj.client_profile.gym
            if hasattr(request.user, 'gym_admin_profile'):
                return request.user.gym_admin_profile.gym == gym
            if hasattr(request.user, 'trainer_profile'):
                return request.user.trainer_profile.gym == gym
        return False


class CanManageTrainer(BasePermission):
    """Allow gym admins to manage trainers in their gym."""
    message = "Gym admin access required to manage trainers."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "gym_admin_profile"))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return obj.gym == request.user.gym_admin_profile.gym
            if hasattr(obj, 'trainer'):
                return obj.trainer.gym == request.user.gym_admin_profile.gym
        return False


class CanManageClient(BasePermission):
    """Allow gym admins and assigned trainers to manage clients."""
    message = "Gym admin or assigned trainer access required."

    def has_permission(self, request, view):
        return bool(request.user and (hasattr(request.user, "gym_admin_profile") or hasattr(request.user, "trainer_profile")))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return obj.gym == request.user.gym_admin_profile.gym
            if hasattr(obj, 'client_profile') and obj.client_profile.gym:
                return obj.client_profile.gym == request.user.gym_admin_profile.gym
        if hasattr(request.user, "trainer_profile"):
            if hasattr(obj, 'client_profile') and obj.client_profile.trainer:
                return obj.client_profile.trainer == request.user.trainer_profile
            if hasattr(obj, 'trainer'):
                return obj.trainer == request.user.trainer_profile
        return False


class CanManageWorkout(BasePermission):
    """Allow trainers to manage their clients' workouts."""
    message = "Trainer access required to manage workouts."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "trainer_profile"))

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, "trainer_profile"):
            return False
        if hasattr(obj, 'client') and obj.client.trainer:
            return obj.client.trainer == request.user.trainer_profile
        if hasattr(obj, 'client_profile') and obj.client_profile.trainer:
            return obj.client_profile.trainer == request.user.trainer_profile
        return False


class CanManageNutrition(BasePermission):
    """Allow trainers to manage their clients' nutrition plans."""
    message = "Trainer access required to manage nutrition."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "trainer_profile"))

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, "trainer_profile"):
            return False
        if hasattr(obj, 'client') and obj.client.trainer:
            return obj.client.trainer == request.user.trainer_profile
        if hasattr(obj, 'client_profile') and obj.client_profile.trainer:
            return obj.client_profile.trainer == request.user.trainer_profile
        return False


class CanViewClientProgress(BasePermission):
    """Allow trainers and gym admins to view client progress."""
    message = "Trainer or gym admin access required to view progress."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and (hasattr(user, "trainer_profile") or hasattr(user, "gym_admin_profile")))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'client'):
                return obj.client.gym == request.user.gym_admin_profile.gym
            if hasattr(obj, 'client_profile'):
                return obj.client_profile.gym == request.user.gym_admin_profile.gym
        if hasattr(request.user, "trainer_profile"):
            if hasattr(obj, 'client'):
                return obj.client.trainer == request.user.trainer_profile
            if hasattr(obj, 'client_profile'):
                return obj.client_profile.trainer == request.user.trainer_profile
        return False


class CanManageGymSettings(BasePermission):
    """Allow gym admins to manage gym settings."""
    message = "Gym admin access required."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "gym_admin_profile"))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return obj.gym == request.user.gym_admin_profile.gym
        return False


class CanManageGymBranding(BasePermission):
    """Allow gym admins to manage gym branding."""
    message = "Gym admin access required for branding management."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "gym_admin_profile"))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return request.user.gym_admin_profile.gym == obj.gym
        return False


class CanManageGymSchedule(BasePermission):
    """Allow gym admins to manage gym schedule."""
    message = "Gym admin access required for schedule management."

    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, "gym_admin_profile"))

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, "gym_admin_profile"):
            if hasattr(obj, 'gym'):
                return request.user.gym_admin_profile.gym == obj.gym
        return False


class IsGymStaff(BasePermission):
    """Gym staff only: gym admins, active trainers, or platform super admins."""
    message = "Gym staff access required."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return bool(
            u.is_superuser
            or hasattr(u, "gym_admin_profile")
            or (hasattr(u, "trainer_profile") and u.trainer_profile.is_active)
        )


class IsGymAdminOrSuperAdmin(BasePermission):
    """Gym admins of the object's gym, or platform super admins."""
    message = "Gym admin access required."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_superuser or hasattr(u, "gym_admin_profile")))

    def has_object_permission(self, request, view, obj):
        u = request.user
        if u.is_superuser:
            return True
        if hasattr(u, "gym_admin_profile"):
            g = getattr(obj, "gym", None)
            if g is None and getattr(obj, "client_profile", None) is not None:
                g = obj.client_profile.gym
            if g is None and getattr(obj, "trainer_profile", None) is not None:
                g = obj.trainer_profile.gym
            return bool(g and g == u.gym_admin_profile.gym)
        return False


class HasGymPerm(BasePermission):
    """Gym-admin operation gated by GymAdminProfile.permissions flag.

    Use via the factory below: permission_classes = [HasGymPerm("manage_trainers")].
    Super admins always pass; unset flags stay allowed (explicit deny only).
    """

    def __init__(self, perm):
        self.perm = perm
        self.message = f"هذه الصلاحية غير ممنوحة لمدير الصالة ({perm})."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        if hasattr(u, "gym_admin_profile"):
            return u.gym_admin_profile.has_perm(self.perm)
        return False
