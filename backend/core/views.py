from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import models

from datetime import timedelta
from django.utils import timezone

from .models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance
from .serializers import (
    UserSerializer, ClassRoomSerializer, AnnouncementSerializer, 
    AssignmentSerializer, StudentAssignmentSerializer, ScheduleSerializer, 
    SessionSerializer, AttendanceSerializer, FeedItemSerializer
)

def sync_daily_sessions():
    now = timezone.localtime()
    today = now.date()
    weekday = today.weekday()

    # 1. Create sessions for today based on weekly schedules matching today's weekday
    schedules = Schedule.objects.filter(day_of_week=weekday)
    for schedule in schedules:
        Session.objects.get_or_create(
            schedule=schedule,
            classroom=schedule.classroom,
            date=today,
            defaults={'status': Session.Status.SCHEDULED}
        )

    # 2. Update status of today's SCHEDULED or READY sessions based on current time
    sessions = Session.objects.filter(date=today, status__in=[Session.Status.SCHEDULED, Session.Status.READY])
    for session in sessions:
        if not session.schedule:
            continue

        start_time = session.schedule.start_time
        end_time = session.schedule.end_time

        start_dt = timezone.datetime.combine(today, start_time)
        end_dt = timezone.datetime.combine(today, end_time)

        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        if timezone.is_naive(end_dt):
            end_dt = timezone.make_aware(end_dt)

        ready_start = start_dt - timedelta(minutes=10)
        ready_end = max(end_dt, start_dt + timedelta(minutes=10))

        if session.status == Session.Status.SCHEDULED:
            if ready_start <= now <= ready_end:
                session.status = Session.Status.READY
                session.save(update_fields=['status'])
            elif now > ready_end:
                session.status = Session.Status.MISSED
                session.save(update_fields=['status'])
        elif session.status == Session.Status.READY:
            if now > ready_end:
                session.status = Session.Status.MISSED
                session.save(update_fields=['status'])

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

class StudentAssignmentViewSet(viewsets.ModelViewSet):
    queryset = StudentAssignment.objects.all()
    serializer_class = StudentAssignmentSerializer

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def perform_create(self, serializer):
        super().perform_create(serializer)
        sync_daily_sessions()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        sync_daily_sessions()

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer

    def get_queryset(self):
        sync_daily_sessions()
        return super().get_queryset()

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class FeedAPIView(APIView):
    """
    API endpoint that merges Announcements and Assignments for a student.
    """
    def get(self, request):
        user = request.user
        
        # If admin or instructor, we might want to show them their relevant feed.
        # But for MVP, sticking strictly to Student aggregated feed as per project.md.
        if user.is_anonymous or user.role != User.Role.STUDENT:
            return Response({"detail": "Only students can access this feed."}, status=403)
        
        # Get classrooms the student is enrolled in
        classrooms = user.enrolled_in.all()
        
        # Fetch announcements
        announcements = Announcement.objects.filter(classroom__in=classrooms)
        
        # Fetch assignments and student statuses
        student_assignments = StudentAssignment.objects.filter(student=user, assignment__classroom__in=classrooms)
        assignment_dict = {sa.assignment_id: sa.status for sa in student_assignments}
        
        assignments = Assignment.objects.filter(classroom__in=classrooms)
        
        feed_items = []
        for ann in announcements:
            feed_items.append({
                'id': ann.id,
                'type': 'ANNOUNCEMENT',
                'title': ann.title,
                'content': ann.content,
                'classroom_id': ann.classroom_id,
                'classroom_name': ann.classroom.name,
                'created_at': ann.created_at,
                'deadline': None,
                'status': None
            })
            
        for ass in assignments:
            feed_items.append({
                'id': ass.id,
                'type': 'ASSIGNMENT',
                'title': ass.title,
                'content': ass.description,
                'classroom_id': ass.classroom_id,
                'classroom_name': ass.classroom.name,
                'created_at': ass.created_at,
                'deadline': ass.deadline,
                'status': assignment_dict.get(ass.id, StudentAssignment.Status.PENDING)
            })
            
        # Sort by created_at descending
        feed_items.sort(key=lambda x: x['created_at'], reverse=True)
        
        serializer = FeedItemSerializer(feed_items, many=True)
        return Response(serializer.data)
