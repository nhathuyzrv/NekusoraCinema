from rest_framework import permissions
from nekusoracinema.models import UserRole, StaffPosition


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.CUSTOMER


class BookingOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, booking):
        return request.user and request.user.is_authenticated and request.user == booking.customer


class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.STAFF


class IsCounterStaff(IsStaff):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and hasattr(request.user, 'staff_profile') and request.user.staff_profile.position == StaffPosition.COUNTER_STAFF


class IsCheckerStaff(IsStaff):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and hasattr(request.user, 'staff_profile') and request.user.staff_profile.position == StaffPosition.CHECKER_STAFF


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.MANAGER


class IsBranchManager(IsManager):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and hasattr(request.user, 'staff_profile') and request.user.staff_profile.position == StaffPosition.BRANCH_MANAGER


class IsSystemManager(IsManager):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and hasattr(request.user, 'staff_profile') and request.user.staff_profile.position == StaffPosition.SYSTEM_MANAGER


class DenyIsCustomer(IsCustomer):
    def has_permission(self, request, view):
        return not super().has_permission(request, view)


class DenyIsStaff(IsStaff):
    def has_permission(self, request, view):
        return not super().has_permission(request, view)


class DenyIsManager(IsManager):
    def has_permission(self, request, view):
        return not super().has_permission(request, view)


class RatingOwner(IsCustomer):
    def has_object_permission(self, request, view, rating):
        return request.user == rating.user