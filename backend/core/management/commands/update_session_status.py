from django.core.management.base import BaseCommand
from core.views import sync_daily_sessions

class Command(BaseCommand):
    help = 'Updates session status based on current time (State Machine)'

    def handle(self, *args, **kwargs):
        sync_daily_sessions()
        self.stdout.write(self.style.SUCCESS('Successfully updated session statuses.'))

