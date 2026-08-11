from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from django.db import models

from datetime import timedelta
from django.utils import timezone

from .models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance, PracticeExam, ExamSubjectScore
from .serializers import (
    UserSerializer, ClassRoomSerializer, AnnouncementSerializer, 
    AssignmentSerializer, StudentAssignmentSerializer, ScheduleSerializer, 
    SessionSerializer, AttendanceSerializer, FeedItemSerializer,
    PracticeExamSerializer, ExamSubjectScoreSerializer
)
from activity_log.mixins import ActivityLogMixin
from activity_log.utils import log_activity


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


# ─── Auth Logging Views ──────────────────────────────────────────────

class LoggingTokenObtainPairView(BaseTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '')
        try:
            response = super().post(request, *args, **kwargs)
            user = User.objects.filter(username=username).first()
            log_activity(
                request, 'AUTH', 'LOGIN', 'Giriş yapıldı', 'SUCCESS',
                details={'username': username},
                target_model='User',
                target_id=user.id if user else None
            )
            return response
        except Exception as e:
            log_activity(
                request, 'AUTH', 'LOGIN_FAILED', 'Başarısız giriş denemesi', 'FAILURE',
                details={'attempted_username': username, 'reason': str(e)},
            )
            raise


class LoggingTokenRefreshView(BaseTokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            log_activity(
                request, 'AUTH', 'TOKEN_REFRESH', 'Token yenilendi', 'SUCCESS',
            )
            return response
        except Exception as e:
            log_activity(
                request, 'AUTH', 'TOKEN_REFRESH', 'Token yenileme başarısız', 'FAILURE',
                details={'reason': str(e)},
            )
            raise


# ─── ViewSets with Logging ────────────────────────────────────────────

class UserViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    log_category = 'USER_MGMT'
    log_action_create = 'CREATE_USER'
    log_action_update = 'UPDATE_USER'
    log_action_destroy = 'DELETE_USER'
    log_display_create = 'Kullanıcı oluşturuldu'
    log_display_update = 'Kullanıcı güncellendi'
    log_display_destroy = 'Kullanıcı silindi'

    def get_log_details(self, instance, action):
        return {
            'target_user': instance.username,
            'role': instance.role,
            'email': instance.email,
            'full_name': f'{instance.first_name} {instance.last_name}'.strip(),
        }


class ClassRoomViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all().order_by('id')
    serializer_class = ClassRoomSerializer
    log_category = 'CLASSROOM'
    log_action_create = 'CREATE_CLASSROOM'
    log_action_update = 'UPDATE_CLASSROOM'
    log_action_destroy = 'DELETE_CLASSROOM'
    log_display_create = 'Sınıf oluşturuldu'
    log_display_update = 'Sınıf güncellendi'
    log_display_destroy = 'Sınıf silindi'

    def get_log_details(self, instance, action):
        return {
            'classroom_name': instance.name,
            'instructor_count': instance.instructors.count(),
            'student_count': instance.students.count(),
        }

    def perform_update(self, serializer):
        instance = self.get_object()
        old_instructor_ids = set(instance.instructors.values_list('id', flat=True))
        old_student_ids = set(instance.students.values_list('id', flat=True))

        super().perform_update(serializer)

        updated = serializer.instance
        new_instructor_ids = set(updated.instructors.values_list('id', flat=True))
        new_student_ids = set(updated.students.values_list('id', flat=True))

        # Log instructor changes
        added_instructors = new_instructor_ids - old_instructor_ids
        removed_instructors = old_instructor_ids - new_instructor_ids
        for uid in added_instructors:
            u = User.objects.filter(id=uid).first()
            log_activity(
                self.request, 'CLASSROOM', 'ASSIGN_INSTRUCTOR', 'Eğitmen atandı', 'SUCCESS',
                details={'classroom': updated.name, 'instructor': u.username if u else str(uid)},
                target_model='ClassRoom', target_id=updated.id
            )
        for uid in removed_instructors:
            u = User.objects.filter(id=uid).first()
            log_activity(
                self.request, 'CLASSROOM', 'REMOVE_INSTRUCTOR', 'Eğitmen kaldırıldı', 'SUCCESS',
                details={'classroom': updated.name, 'instructor': u.username if u else str(uid)},
                target_model='ClassRoom', target_id=updated.id
            )

        # Log student changes
        added_students = new_student_ids - old_student_ids
        removed_students = old_student_ids - new_student_ids
        for uid in added_students:
            u = User.objects.filter(id=uid).first()
            log_activity(
                self.request, 'CLASSROOM', 'ENROLL_STUDENT', 'Öğrenci kaydedildi', 'SUCCESS',
                details={'classroom': updated.name, 'student': u.username if u else str(uid)},
                target_model='ClassRoom', target_id=updated.id
            )
        for uid in removed_students:
            u = User.objects.filter(id=uid).first()
            log_activity(
                self.request, 'CLASSROOM', 'UNENROLL_STUDENT', 'Öğrenci kaydı silindi', 'SUCCESS',
                details={'classroom': updated.name, 'student': u.username if u else str(uid)},
                target_model='ClassRoom', target_id=updated.id
            )


class AnnouncementViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    log_category = 'CONTENT'
    log_action_create = 'CREATE_ANNOUNCEMENT'
    log_action_update = 'UPDATE_ANNOUNCEMENT'
    log_action_destroy = 'DELETE_ANNOUNCEMENT'
    log_display_create = 'Duyuru oluşturuldu'
    log_display_update = 'Duyuru güncellendi'
    log_display_destroy = 'Duyuru silindi'

    def get_log_details(self, instance, action):
        return {
            'title': instance.title,
            'classroom': instance.classroom.name,
        }


class AssignmentViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    serializer_class = AssignmentSerializer
    log_category = 'CONTENT'
    log_action_create = 'CREATE_ASSIGNMENT'
    log_action_update = 'UPDATE_ASSIGNMENT'
    log_action_destroy = 'DELETE_ASSIGNMENT'
    log_display_create = 'Ödev oluşturuldu'
    log_display_update = 'Ödev güncellendi'
    log_display_destroy = 'Ödev silindi'

    def get_log_details(self, instance, action):
        return {
            'title': instance.title,
            'classroom': instance.classroom.name,
            'deadline': str(instance.deadline),
        }


class StudentAssignmentViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = StudentAssignment.objects.all().order_by('-id')
    serializer_class = StudentAssignmentSerializer
    log_category = 'SUBMISSION'
    log_action_create = ''
    log_action_update = ''
    log_action_destroy = ''
    log_display_create = ''
    log_display_update = ''
    log_display_destroy = ''

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        old_grade = instance.grade

        super().perform_update(serializer)

        updated = serializer.instance

        # Detect submission
        if old_status != 'SUBMITTED' and updated.status == 'SUBMITTED':
            log_activity(
                self.request, 'SUBMISSION', 'SUBMIT_ASSIGNMENT', 'Ödev teslim edildi', 'SUCCESS',
                details={
                    'student': updated.student.username,
                    'assignment': updated.assignment.title,
                    'classroom': updated.assignment.classroom.name,
                },
                target_model='StudentAssignment', target_id=updated.id
            )

        # Detect grading
        if updated.grade is not None and updated.grade != old_grade:
            log_activity(
                self.request, 'SUBMISSION', 'GRADE_ASSIGNMENT', 'Ödev notlandırıldı', 'SUCCESS',
                details={
                    'student': updated.student.username,
                    'assignment': updated.assignment.title,
                    'grade': str(updated.grade),
                    'classroom': updated.assignment.classroom.name,
                },
                target_model='StudentAssignment', target_id=updated.id
            )


class ScheduleViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    log_category = 'SCHEDULE'
    log_action_create = 'CREATE_SCHEDULE'
    log_action_update = 'UPDATE_SCHEDULE'
    log_action_destroy = 'DELETE_SCHEDULE'
    log_display_create = 'Ders programı oluşturuldu'
    log_display_update = 'Ders programı güncellendi'
    log_display_destroy = 'Ders programı silindi'

    def get_log_details(self, instance, action):
        return {
            'classroom': instance.classroom.name,
            'day': instance.get_day_of_week_display(),
            'time': f'{instance.start_time} - {instance.end_time}',
        }

    def perform_create(self, serializer):
        super().perform_create(serializer)
        sync_daily_sessions()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        sync_daily_sessions()


class SessionViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by('-date', '-id')
    serializer_class = SessionSerializer
    log_category = 'ATTENDANCE'
    log_action_create = ''
    log_action_update = ''
    log_action_destroy = ''
    log_display_create = ''
    log_display_update = ''
    log_display_destroy = ''

    def get_queryset(self):
        sync_daily_sessions()
        return super().get_queryset()

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status

        super().perform_update(serializer)

        updated = serializer.instance

        if updated.status == 'ACTIVE' and old_status != 'ACTIVE':
            log_activity(
                self.request, 'ATTENDANCE', 'START_SESSION', 'Oturum başlatıldı', 'SUCCESS',
                details={
                    'classroom': updated.classroom.name,
                    'date': str(updated.date),
                },
                target_model='Session', target_id=updated.id
            )
        elif updated.status == 'COMPLETED' and old_status != 'COMPLETED':
            log_activity(
                self.request, 'ATTENDANCE', 'COMPLETE_SESSION', 'Oturum tamamlandı', 'SUCCESS',
                details={
                    'classroom': updated.classroom.name,
                    'date': str(updated.date),
                },
                target_model='Session', target_id=updated.id
            )


class AttendanceViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    log_category = 'ATTENDANCE'
    log_action_create = 'RECORD_ATTENDANCE'
    log_action_update = 'RECORD_ATTENDANCE'
    log_action_destroy = ''
    log_display_create = 'Yoklama kaydedildi'
    log_display_update = 'Yoklama güncellendi'
    log_display_destroy = ''

    def get_log_details(self, instance, action):
        return {
            'student': instance.student.username,
            'session_id': instance.session_id,
            'is_present': instance.is_present,
        }


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


class PracticeExamViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PracticeExamSerializer
    log_category = 'EXAM'
    log_action_create = 'CREATE_EXAM'
    log_display_create = 'Deneme sınavı eklendi'
    log_action_update = 'UPDATE_EXAM'
    log_display_update = 'Deneme sınavı güncellendi'
    log_action_destroy = 'DELETE_EXAM'
    log_display_destroy = 'Deneme sınavı silindi'

    def get_log_details(self, instance, action):
        return {
            'student': instance.student.username,
            'exam': instance.title,
            'net': instance.total_net
        }

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return PracticeExam.objects.none()
        if user.role == User.Role.ADMIN or (user.role == User.Role.INSTRUCTOR and getattr(user, 'is_counselor', False)):
            return PracticeExam.objects.all().order_by('-date', '-created_at')
        elif user.role == User.Role.INSTRUCTOR:
            return PracticeExam.objects.filter(classroom__instructors=user).distinct().order_by('-date', '-created_at')
        else: # STUDENT
            return PracticeExam.objects.filter(student=user).order_by('-date', '-created_at')

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        log_activity(
            request,
            category='AUTH',
            action='LOGOUT',
            action_display='Çıkış yapıldı',
            status='SUCCESS',
            details={'username': request.user.username},
            target_model='User',
            target_id=request.user.id
        )
        return Response({"detail": "Successfully logged out."}, status=200)
