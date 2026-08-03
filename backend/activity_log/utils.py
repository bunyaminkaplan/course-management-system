import logging
from .models import ActivityLog

logger = logging.getLogger(__name__)

def log_activity(request, category, action, action_display, status='SUCCESS', details=None, target_model='', target_id=None):
    try:
        user = request.user
        username = ''
        user_role = ''
        user_id = None
        
        if user and user.is_authenticated:
            user_id = user.id
            username = getattr(user, 'username', str(user))
            user_role = getattr(user, 'role', '')
            
        ip_address = getattr(request, 'client_ip', None)
        user_agent = getattr(request, 'client_ua', '')

        ActivityLog.objects.create(
            user_id=user_id,
            username=username,
            user_role=user_role,
            category=category,
            action=action,
            action_display=action_display,
            status=status,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            target_model=target_model,
            target_id=target_id
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
