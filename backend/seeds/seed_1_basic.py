import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'course_backend.settings')
django.setup()

from core.models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule

student = User.objects.get(username='student1')
instructor = User.objects.get(username='instructor1')

# 1. Sınıf Oluştur ve Kullanıcıları Ekle
classroom, _ = ClassRoom.objects.get_or_create(
    name="Matematik 101"
)
classroom.instructors.add(instructor)
classroom.students.add(student)

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

print("Dummy data seeded successfully!")
