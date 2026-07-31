from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import models

from .models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance, ParentStudent, Exam, Grade
from .serializers import (
    UserSerializer, ClassRoomSerializer, AnnouncementSerializer, 
    AssignmentSerializer, StudentAssignmentSerializer, ScheduleSerializer, 
    SessionSerializer, AttendanceSerializer, FeedItemSerializer,
    ParentStudentSerializer, ExamSerializer, GradeSerializer
)

class ParentStudentViewSet(viewsets.ModelViewSet):
    queryset = ParentStudent.objects.all()
    serializer_class = ParentStudentSerializer
    
    @action(detail=False, methods=['get'])
    def my_children(self, request):
        if request.user.role != User.Role.PARENT:
            return Response({"detail": "Only parents can access this."}, status=403)
        children = self.get_queryset().filter(parent=request.user)
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

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

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer

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
        if user.is_anonymous:
            return Response({"detail": "Not authenticated."}, status=403)
        
        classrooms = []
        target_students = []
        if user.role == User.Role.STUDENT:
            classrooms = list(user.enrolled_in.all())
            target_students = [user]
        elif user.role == User.Role.PARENT:
            children_links = ParentStudent.objects.filter(parent=user)
            for link in children_links:
                classrooms.extend(link.student.enrolled_in.all())
                target_students.append(link.student)
        else:
            return Response({"detail": "Only students and parents can access this feed."}, status=403)
        
        classrooms = list(set(classrooms))
        
        # Fetch announcements
        announcements = Announcement.objects.filter(classroom__in=classrooms)
        
        # Fetch assignments and student statuses
        student_assignments = StudentAssignment.objects.filter(student__in=target_students, assignment__classroom__in=classrooms)
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
