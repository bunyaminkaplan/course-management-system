from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Schedule, Session

class Command(BaseCommand):
    help = 'Generates daily sessions based on weekly schedules'

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        # In Python, Monday is 0, Sunday is 6. Matches our choices.
        weekday = today.weekday()

        schedules = Schedule.objects.filter(day_of_week=weekday)
        created_count = 0
        
        for schedule in schedules:
            # Create a session if it doesn't already exist for today
            session, created = Session.objects.get_or_create(
                schedule=schedule,
                classroom=schedule.classroom,
                date=today,
                defaults={'status': Session.Status.SCHEDULED}
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} sessions for {today}'))
