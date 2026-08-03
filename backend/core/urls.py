from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ClassRoomViewSet, AnnouncementViewSet, 
    AssignmentViewSet, StudentAssignmentViewSet, ScheduleViewSet, 
    SessionViewSet, AttendanceViewSet, FeedAPIView, PracticeExamViewSet,
    LogoutView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'classrooms', ClassRoomViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'student-assignments', StudentAssignmentViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'attendances', AttendanceViewSet)
router.register(r'practice-exams', PracticeExamViewSet, basename='practiceexam')

urlpatterns = [
    path('', include(router.urls)),
    path('feed/', FeedAPIView.as_view(), name='aggregated-feed'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
