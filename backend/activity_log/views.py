from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from django.db.models import Q
from rest_framework.permissions import BasePermission

class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'ADMIN')

class ActivityLogPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    pagination_class = ActivityLogPagination
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        user_role = self.request.query_params.get('user_role')
        status = self.request.query_params.get('status')
        action = self.request.query_params.get('action')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if user_role:
            queryset = queryset.filter(user_role=user_role)
        if status:
            queryset = queryset.filter(status=status)
        if action:
            queryset = queryset.filter(action=action)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(action_display__icontains=search))
            
        return queryset
