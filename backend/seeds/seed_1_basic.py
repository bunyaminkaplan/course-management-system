import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'course_backend.settings')
django.setup()

from core.models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, ParentStudent, Exam, Grade

admin, created_a = User.objects.get_or_create(
    username='admin', 
    defaults={
        'email': 'admin@test.com', 
        'role': User.Role.ADMIN, 
        'is_staff': True, 
        'is_superuser': True
    }
)
if created_a:
    admin.set_password('password123')
    admin.save()

student, created_s = User.objects.get_or_create(username='student1', defaults={'email': 'student1@test.com', 'role': User.Role.STUDENT})
if created_s:
    student.set_password('password123')
    student.save()

instructor, created_i = User.objects.get_or_create(username='instructor1', defaults={'email': 'instructor1@test.com', 'role': User.Role.INSTRUCTOR})
if created_i:
    instructor.set_password('password123')
    instructor.save()

parent, created_p = User.objects.get_or_create(username='parent1', defaults={'email': 'parent1@test.com', 'role': User.Role.PARENT, 'first_name': 'Veli', 'last_name': 'Yılmaz'})
if created_p:
    parent.set_password('password123')
    parent.save()

# 1. Sınıf Oluştur ve Kullanıcıları Ekle
classroom, _ = ClassRoom.objects.get_or_create(
    name="Matematik 101"
)
classroom.instructors.add(instructor)
classroom.students.add(student)

# 1.1 Veli Öğrenci Bağlantısı
ParentStudent.objects.get_or_create(parent=parent, student=student)

# 2. Ders Programı (Schedule) Oluştur (Bugünün gününe)
today = timezone.localtime()
Schedule.objects.get_or_create(
    classroom=classroom,
    day_of_week=today.weekday(),
    start_time=(today - timedelta(minutes=5)).time(), # Şu an READY penceresinde olması için 5 dk öncesi
    end_time=(today + timedelta(hours=1)).time()
)

# 3. Duyuru (Announcement) Oluştur
Announcement.objects.get_or_create(
    classroom=classroom,
    title="İlk Derse Hoşgeldiniz!",
    content="Matematik 101 dersinin kaynaklarını sisteme yükledim. Herkese başarılar."
)

# 4. Aktif Ödev Oluştur (2 gün sonra teslim edilecek)
# Note: post_save signal automatically creates StudentAssignment for enrolled students
assignment, _ = Assignment.objects.get_or_create(
    classroom=classroom,
    title="Fonksiyonlar Ödevi",
    description="Kitaptaki 10. ünite sonu sorularını çözün.",
    deadline=today + timedelta(days=2)
)

# 5. Süresi Geçmiş Ödev Oluştur (Overdue test için)
old_assignment, _ = Assignment.objects.get_or_create(
    classroom=classroom,
    title="Kümeler Ödevi (Gecikmiş)",
    description="Bu ödevin süresi dün doldu.",
    deadline=today - timedelta(days=1)
)

# 6. Sınav ve Not Oluştur
exam, _ = Exam.objects.get_or_create(
    classroom=classroom,
    title="Vize Sınavı",
    date=today.date() + timedelta(days=5)
)
# Note: post_save signal automatically creates Grade for enrolled students
grade = Grade.objects.filter(exam=exam, student=student).first()
if grade:
    grade.grade = 85.0
    grade.save()

print("Dummy data seeded successfully!")
