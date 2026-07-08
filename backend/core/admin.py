from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')

@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    filter_horizontal = ('instructors', 'students')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'classroom', 'created_at')
    list_filter = ('classroom',)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'classroom', 'deadline', 'created_at')
    list_filter = ('classroom',)

@admin.register(StudentAssignment)
class StudentAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'status', 'grade', 'submitted_at')
    list_filter = ('status', 'assignment__classroom')
    search_fields = ('student__username', 'assignment__title')

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('classroom', 'get_day_of_week_display', 'start_time', 'end_time')
    list_filter = ('classroom', 'day_of_week')

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('classroom', 'date', 'status')
    list_filter = ('status', 'classroom')
    date_hierarchy = 'date'

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'is_present')
    list_filter = ('is_present', 'session__classroom')
