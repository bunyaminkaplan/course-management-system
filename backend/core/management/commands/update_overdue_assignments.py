from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import StudentAssignment

class Command(BaseCommand):
    help = 'Marks pending student assignments as overdue if deadline has passed'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        
        # Find all pending assignments where the related assignment deadline is in the past
        overdue_assignments = StudentAssignment.objects.filter(
            status=StudentAssignment.Status.PENDING,
            assignment__deadline__lt=now
        )
        
        count = overdue_assignments.update(status=StudentAssignment.Status.OVERDUE)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully marked {count} assignments as overdue'))
