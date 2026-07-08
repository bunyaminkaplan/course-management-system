from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Session
from datetime import timedelta

class Command(BaseCommand):
    help = 'Updates session status based on current time (State Machine)'

    def handle(self, *args, **kwargs):
        now = timezone.localtime()
        today = now.date()
        
        # We only check sessions for today
        sessions = Session.objects.filter(date=today, status__in=[Session.Status.SCHEDULED, Session.Status.READY])
        
        ready_count = 0
        missed_count = 0
        
        for session in sessions:
            if not session.schedule:
                continue
                
            start_time = session.schedule.start_time
            # Create a datetime object for comparison
            session_start_dt = timezone.make_aware(timezone.datetime.combine(today, start_time))
            
            # READY Window: -10 mins to +10 mins
            ready_start = session_start_dt - timedelta(minutes=10)
            ready_end = session_start_dt + timedelta(minutes=10)
            
            if session.status == Session.Status.SCHEDULED:
                if ready_start <= now <= ready_end:
                    session.status = Session.Status.READY
                    session.save()
                    ready_count += 1
                elif now > ready_end:
                    # If we somehow skipped the ready window
                    session.status = Session.Status.MISSED
                    session.save()
                    missed_count += 1
            
            elif session.status == Session.Status.READY:
                # If 10 mins have passed and it's still READY (instructor didn't start it)
                if now > ready_end:
                    session.status = Session.Status.MISSED
                    session.save()
                    missed_count += 1

        self.stdout.write(self.style.SUCCESS(f'Updated: {ready_count} READY, {missed_count} MISSED'))
