from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from activity_log.models import ActivityLog


class Command(BaseCommand):
    help = '30 günden eski aktivite loglarını temizler'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Kaç günden eski loglar silinsin (varsayılan: 30)',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = ActivityLog.objects.filter(created_at__lt=cutoff_date).delete()
        self.stdout.write(
            self.style.SUCCESS(f'{deleted_count} adet {days} günden eski log kaydı silindi.')
        )
