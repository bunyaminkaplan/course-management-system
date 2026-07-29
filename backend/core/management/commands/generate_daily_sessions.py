from django.core.management.base import BaseCommand
from core.views import sync_daily_sessions

class Command(BaseCommand):
    help = 'Generates daily sessions based on weekly schedules and updates status'

    def handle(self, *args, **kwargs):
        sync_daily_sessions()
        self.stdout.write(self.style.SUCCESS('Successfully synced daily sessions.'))

