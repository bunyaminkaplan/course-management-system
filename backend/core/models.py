from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.conf import settings

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        STUDENT = 'STUDENT', 'Student'

    role = models.CharField(max_length=15, choices=Role.choices, default=Role.STUDENT)
    is_counselor = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class ClassRoom(models.Model):
    name = models.CharField(max_length=100)
    instructors = models.ManyToManyField(User, related_name='instructor_of', limit_choices_to={'role': User.Role.INSTRUCTOR})
    students = models.ManyToManyField(User, related_name='enrolled_in', limit_choices_to={'role': User.Role.STUDENT}, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Announcement(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"


class Assignment(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"


class StudentAssignment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        OVERDUE = 'OVERDUE', 'Overdue'

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='student_assignments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': User.Role.STUDENT})
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    file_url = models.URLField(blank=True, null=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title} ({self.status})"


class Schedule(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.classroom.name} - {self.get_day_of_week_display()} {self.start_time}"


class Session(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        READY = 'READY', 'Ready'
        ACTIVE = 'ACTIVE', 'Active'
        COMPLETED = 'COMPLETED', 'Completed'
        MISSED = 'MISSED', 'Missed'

    schedule = models.ForeignKey(Schedule, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SCHEDULED)

    def __str__(self):
        return f"{self.classroom.name} - {self.date} ({self.status})"


class Attendance(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': User.Role.STUDENT})
    is_present = models.BooleanField(default=False)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.session} (Present: {self.is_present})"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Assignment)
def create_student_assignments(sender, instance, created, **kwargs):
    if created:
        students = instance.classroom.students.all()
        student_assignments = [
            StudentAssignment(assignment=instance, student=student, status=StudentAssignment.Status.PENDING)
            for student in students
        ]
        StudentAssignment.objects.bulk_create(student_assignments)


class PracticeExam(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='practice_exams', on_delete=models.CASCADE)
    classroom = models.ForeignKey(ClassRoom, related_name='practice_exams', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    date = models.DateField()
    total_net = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.student.username}"


class ExamSubjectScore(models.Model):
    exam = models.ForeignKey(PracticeExam, related_name='subject_scores', on_delete=models.CASCADE)
    subject_name = models.CharField(max_length=100)
    correct = models.IntegerField(default=0)
    incorrect = models.IntegerField(default=0)
    net_score = models.FloatField(default=0.0)
    
    def __str__(self):
        return f"{self.subject_name} - {self.exam.title}"
