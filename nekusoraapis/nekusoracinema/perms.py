from rest_framework import permissions
from nekusoracinema.models import UserRole


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.CUSTOMER


class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.STAFF


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.MANAGER


class DenyIsCustomer(IsCustomer):
    def has_permission(self, request, view):
        return not IsCustomer.has_permission(self, request, view)


class DenyIsStaff(IsStaff):
    def has_permission(self, request, view):
        return not IsStaff.has_permission(self, request, view)


class DenyIsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return not IsManager.has_permission(self, request, view)


class RatingOwner(IsCustomer):
    def has_object_permission(self, request, view, rating):
        return request.user == rating.user