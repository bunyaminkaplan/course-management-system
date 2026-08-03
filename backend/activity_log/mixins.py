from .utils import log_activity

class ActivityLogMixin:
    log_category = ''
    log_action_create = ''
    log_action_update = ''
    log_action_destroy = ''
    log_display_create = ''
    log_display_update = ''
    log_display_destroy = ''

    def get_log_details(self, instance, action):
        return {
            'target_model': instance.__class__.__name__,
            'target_id': getattr(instance, 'id', getattr(instance, 'pk', None)),
            'repr': str(instance)
        }

    def perform_create(self, serializer):
        super().perform_create(serializer)
        if self.log_action_create and self.log_category:
            instance = serializer.instance
            details = self.get_log_details(instance, 'create')
            log_activity(
                request=self.request,
                category=self.log_category,
                action=self.log_action_create,
                action_display=self.log_display_create,
                details=details,
                target_model=instance.__class__.__name__,
                target_id=getattr(instance, 'id', getattr(instance, 'pk', None))
            )

    def perform_update(self, serializer):
        super().perform_update(serializer)
        if self.log_action_update and self.log_category:
            instance = serializer.instance
            details = self.get_log_details(instance, 'update')
            log_activity(
                request=self.request,
                category=self.log_category,
                action=self.log_action_update,
                action_display=self.log_display_update,
                details=details,
                target_model=instance.__class__.__name__,
                target_id=getattr(instance, 'id', getattr(instance, 'pk', None))
            )

    def perform_destroy(self, instance):
        if self.log_action_destroy and self.log_category:
            details = self.get_log_details(instance, 'destroy')
            log_activity(
                request=self.request,
                category=self.log_category,
                action=self.log_action_destroy,
                action_display=self.log_display_destroy,
                details=details,
                target_model=instance.__class__.__name__,
                target_id=getattr(instance, 'id', getattr(instance, 'pk', None))
            )
        super().perform_destroy(instance)
