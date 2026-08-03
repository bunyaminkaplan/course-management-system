from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'username', 'user_role', 'category', 'action', 'action_display', 'status', 'ip_address']
    list_filter = ['category', 'status', 'user_role', 'created_at']
    search_fields = ['username', 'action', 'action_display', 'ip_address']
    readonly_fields = [f.name for f in ActivityLog._meta.fields]
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
