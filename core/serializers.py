from rest_framework import serializers
from .models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['role']

class ClassRoomSerializer(serializers.ModelSerializer):
    instructors = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)

    class Meta:
        model = ClassRoom
        fields = ['id', 'name', 'instructors', 'students', 'created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'classroom', 'classroom_name', 'title', 'content', 'created_at']

class AssignmentSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'classroom_name', 'title', 'description', 'deadline', 'created_at']

class StudentAssignmentSerializer(serializers.ModelSerializer):
    assignment_details = AssignmentSerializer(source='assignment', read_only=True)

    class Meta:
        model = StudentAssignment
        fields = ['id', 'assignment', 'assignment_details', 'student', 'status', 'file_url', 'grade', 'submitted_at']

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

# Custom Serializer for Aggregated Feed
class FeedItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField() # 'ANNOUNCEMENT' or 'ASSIGNMENT'
    title = serializers.CharField()
    content = serializers.CharField() # Maps to description for assignments
    classroom_id = serializers.IntegerField()
    classroom_name = serializers.CharField()
    created_at = serializers.DateTimeField()
    # Assignment specific fields
    deadline = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.CharField(required=False, allow_null=True) # Student assignment status
