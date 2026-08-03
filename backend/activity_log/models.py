from django.db import models
from django.conf import settings

class ActivityLog(models.Model):
    CATEGORY_CHOICES = [
        ('AUTH', 'AUTH'),
        ('USER_MGMT', 'USER_MGMT'),
        ('CLASSROOM', 'CLASSROOM'),
        ('CONTENT', 'CONTENT'),
        ('SUBMISSION', 'SUBMISSION'),
        ('ATTENDANCE', 'ATTENDANCE'),
        ('SCHEDULE', 'SCHEDULE'),
        ('FORUM', 'FORUM'),
    ]
    STATUS_CHOICES = [
        ('SUCCESS', 'SUCCESS'),
        ('FAILURE', 'FAILURE'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    username = models.CharField(max_length=150, blank=True)
    user_role = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    action = models.CharField(max_length=100)
    action_display = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUCCESS')
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    target_model = models.CharField(max_length=100, blank=True)
    target_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['user_role']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user_role} {self.username} - {self.action} ({self.status})"
