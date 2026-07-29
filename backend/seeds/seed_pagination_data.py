import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import django
from datetime import timedelta, time
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'course_backend.settings')
django.setup()

from core.models import User, ClassRoom, Announcement, Assignment, StudentAssignment, Schedule, Session, Attendance
from discussion.models import Thread, Comment, Vote

print("Seeding rich pagination data...")

# 1. Users
admin_user, _ = User.objects.get_or_create(
    username='admin',
    defaults={'email': 'admin@test.com', 'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True}
)
admin_user.set_password('password123')
admin_user.save()

instructor1, _ = User.objects.get_or_create(
    username='instructor1',
    defaults={'email': 'instructor1@test.com', 'role': User.Role.INSTRUCTOR, 'first_name': 'Ahmet', 'last_name': 'Yılmaz'}
)
instructor1.set_password('password123')
instructor1.save()

instructor2, _ = User.objects.get_or_create(
    username='instructor2',
    defaults={'email': 'instructor2@test.com', 'role': User.Role.INSTRUCTOR, 'first_name': 'Ayşe', 'last_name': 'Kaya'}
)
instructor2.set_password('password123')
instructor2.save()

student1, _ = User.objects.get_or_create(
    username='student1',
    defaults={'email': 'student1@test.com', 'role': User.Role.STUDENT, 'first_name': 'Ali', 'last_name': 'Demir'}
)
student1.set_password('password123')
student1.save()

students = [student1]
for i in range(2, 16):
    std, _ = User.objects.get_or_create(
        username=f'student{i}',
        defaults={
            'email': f'student{i}@test.com',
            'role': User.Role.STUDENT,
            'first_name': f'Öğrenci{i}',
            'last_name': 'Yıldız'
        }
    )
    std.set_password('password123')
    std.save()
    students.append(std)

# 2. Classrooms
math_class, _ = ClassRoom.objects.get_or_create(name="Matematik 101")
physics_class, _ = ClassRoom.objects.get_or_create(name="Fizik 201")
chem_class, _ = ClassRoom.objects.get_or_create(name="Kimya 101")
cs_class, _ = ClassRoom.objects.get_or_create(name="Bilgisayar Bilimleri 101")

math_class.instructors.add(instructor1)
physics_class.instructors.add(instructor1, instructor2)
chem_class.instructors.add(instructor2)
cs_class.instructors.add(instructor1)

for s in students:
    math_class.students.add(s)
    physics_class.students.add(s)
    chem_class.students.add(s)
    cs_class.students.add(s)

# 3. Schedules (12+ schedules across classrooms and days)
days = [0, 1, 2, 3, 4] # Mon - Fri
times = [
    (time(9, 0), time(10, 30)),
    (time(11, 0), time(12, 30)),
    (time(14, 0), time(15, 30)),
    (time(16, 0), time(17, 30)),
]

classes = [math_class, physics_class, chem_class, cs_class]
for i, cl in enumerate(classes):
    for day_idx in range(3):
        t_start, t_end = times[(i + day_idx) % len(times)]
        Schedule.objects.get_or_create(
            classroom=cl,
            day_of_week=(i + day_idx * 2) % 7,
            start_time=t_start,
            end_time=t_end
        )

# 4. Announcements (~12 announcements)
ann_titles = [
    ("Ders Materyalleri Yüklendi", "Tüm ders sunumları ve okuma parçaları portalda erişilebilir durumdadır."),
    ("Laboratuvar Saatleri Değişikliği", "Bu haftaki laboratuvar oturumu Çarşamba gününe alınmıştır."),
    ("Vize Sınavı Tarihleri Açıklandı", "Vize sınavı önümüzdeki ayın ilk haftasında yapılacaktır."),
    ("Ofis Saatleri Hatırlatması", "Salı ve Perşembe günleri 14:00-16:00 saatleri arasında ofisim açık olacaktır."),
    ("Proje Konuları Dağıtımı", "Dönem projesi konuları açıklanmıştır, grup tercihlerinizi bildirin."),
    ("Ek Ders Bildirimi", "Kaçırılan oturumun telafisi Cuma günü yapılacaktır."),
    ("Ödev Geri Bildirimleri", "İlk ödevlerin notları ve geri bildirimleri sisteme girilmiştir."),
    ("Seminer Daveti", "Gelecek hafta düzenlenecek olan bilimsel seminere tüm öğrenciler davetlidir."),
    ("Kütüphane Kaynakları", "Ders için önerilen e-kitaplara kütüphane veri tabanından ulaşabilirsiniz."),
    ("Final Projesi Teslim Formatı", "Final projeleri PDF ve kod arşivi şeklinde teslim edilmelidir."),
    ("Soru-Cevap Oturumu", "Sınav öncesi Soru-Cevap canlı oturumu düzenlenecektir."),
    ("Yaz Okulu Kayıtları", "Yaz okulu ders kayıt prosedürleri duyuru panosuna eklenmiştir.")
]

for idx, (title, content) in enumerate(ann_titles):
    cl = classes[idx % len(classes)]
    Announcement.objects.get_or_create(
        classroom=cl,
        title=f"{cl.name}: {title}",
        content=content
    )

# 5. Assignments (~12 assignments)
now = timezone.localtime()
assignment_titles = [
    ("Fonksiyonlar Ödevi", "Kitaptaki 10. ünite sorularını çözünüz."),
    ("Türev ve İntegral Çalışması", "Türev uygulamaları ile ilgili 5 adet problemi detaylı yazınız."),
    ("Mekanik Problem Seti 1", "Newton yasaları ile ilgili alıştırma soruları."),
    ("Optik ve Dalgalar Raporu", "Deney sonuçlarını ve grafikleri içeren rapor hazırlayınız."),
    ("Kimyasal Tepkimeler", "Stokiyometri hesaplamalarını içeren ödev tablosu."),
    ("Termodinamik Ödevi", "İdeal gaz denklemleri alıştırmaları."),
    ("Python Algoritma Ödevi", "Verilen sıralama algoritmasını Python ile yazınız."),
    ("Veri Yapıları Ödevi 1", "Bağlı liste (Linked List) veri yapısını implemente ediniz."),
    ("Veritabanı Tasarımı ER Diyagramı", "Örnek e-ticaret sistemi için ER şeması çizin."),
    ("Matris Operasyonları", "Lineer cebir matris çarpımı uygulamaları."),
    ("Devre Analizi Ödevi", "Kirchhoff yasalarını kullanarak devre çözümü yapınız."),
    ("Elektromanyetizma Raporu", "Maxwell denklemleri özet çalışması.")
]

created_assignments = []
for idx, (title, desc) in enumerate(assignment_titles):
    cl = classes[idx % len(classes)]
    deadline = now + timedelta(days=(idx - 5) * 2 + 1)
    ass, _ = Assignment.objects.get_or_create(
        classroom=cl,
        title=title,
        description=desc,
        deadline=deadline
    )
    created_assignments.append(ass)

# 6. StudentAssignments Submissions for Instructor Grading & Student Dashboard testing
# Mark several assignments as SUBMITTED for various students so Instructor has 8+ items to grade
for idx, sa in enumerate(StudentAssignment.objects.all()):
    if idx % 2 == 0:
        sa.status = StudentAssignment.Status.SUBMITTED
        sa.file_url = f"https://example.com/submissions/submission_{sa.id}.pdf"
        sa.submitted_at = now - timedelta(hours=idx * 3 + 1)
        if idx % 4 == 0:
            sa.grade = 85 + (idx % 15)
        sa.save()

# 7. Sessions & Attendances for Student Attendance History (~12 history items for student1)
for i in range(12):
    past_date = now.date() - timedelta(days=i + 1)
    cl = classes[i % len(classes)]
    sess, _ = Session.objects.get_or_create(
        classroom=cl,
        date=past_date,
        defaults={'status': Session.Status.COMPLETED}
    )
    sess.status = Session.Status.COMPLETED
    sess.save()

    for std in students[:5]:
        att, _ = Attendance.objects.get_or_create(
            session=sess,
            student=std,
            defaults={'is_present': (i + std.id) % 3 != 0}
        )

# 8. Discussion Threads & Comments (~20 threads)
thread_topics = [
    ("Vize Sınavı Konuları Neler?", "Arkadaşlar vize konuları hangi üniteleri kapsıyor?"),
    ("Ödev 2 Hakkında Soru", "Ödevdeki 3. soruda verilen parametre eksik mi?"),
    ("Proje Grubu Arıyorum", "Proje için 2 kişilik ekibimize 1 arkadaş daha arıyoruz."),
    ("Laboratuvar Raporu Formatı", "Rapor kapak sayfası için belirli bir format var mı?"),
    ("Ders Kayıtları Nerede Paylaşılıyor?", "Geçen haftaki dersin video kaydına ulaşamadım."),
    ("Kütüphane Çalışma Odaları", "Sınav haftasında çalışma odaları kaça kadar açık?"),
    ("Derste Çözülen Örnek 4", "Hocanın tahtaya yazdığı çözümde 2. adım anlaşılmadı."),
    ("Algoritma Karmaşıklığı", "Big-O gösteriminde logaritmik karmaşıklığı açıklayabilir misiniz?"),
    ("Ek Sınav Başvuruları", "Mazeret sınavı başvuruları hangi tarihe kadar yapılıyor?"),
    ("Formül Kağıdı Kullanımı", "Sınavda formül kağıdı getirmemize izin var mı?"),
    ("Python Kütüphane Kurulumu", "Virtualenv içinde matplotlib hatası alıyorum."),
    ("Final Projesi Fikirleri", "Web uygulaması için hangi framework önerilir?"),
    ("Matris Deterimant Hesabı", "Sarrus kuralı 4x4 matrislerde uygulanabilir mi?"),
    ("Limit ve Süreklilik Sorusu", "Tanımsız noktalarda limit hesabı nasıl yapılır?"),
    ("Türev Çarpım Kuralı", "Çarpım kuralının ispatını nereden bulabilirim?"),
    ("İntegral Alan Hesabı", "İki eğri arasında kalan alanı hesaplarken sınırlar nasıl belirlenir?"),
    ("Vize Çalışma Soruları Çözümleri", "1. vize çalışma sorularının yanıt anahtarı eklendi mi?"),
    ("Ofis Saati Talebi", "Cuma günü öğleden önce ek ofis saati yapılabilir mi?"),
    ("Ders Kitabı PDF Paylaşımı", "Ders kitabının 3. baskısını nereden temin edebiliriz?"),
    ("Son Ödev Notlandırması", "Son teslim ettiğimiz ödevlerin notları ne zaman ilan edilecek?")
]

for idx, (title, content) in enumerate(thread_topics):
    # Assign most threads to math_class so it has 18+ threads to test pagination
    cl = math_class if idx < 16 else classes[idx % len(classes)]
    author = students[idx % len(students)]
    th, _ = Thread.objects.get_or_create(
        classroom=cl,
        title=title,
        defaults={'author': author, 'content': content}
    )

    # Add comments & votes
    c, _ = Comment.objects.get_or_create(
        thread=th,
        author=instructor1 if idx % 2 == 0 else instructor2,
        defaults={'content': 'Detaylı bilgi ders notlarında açıklanmıştır.'}
    )
    Vote.objects.get_or_create(user=students[(idx + 1) % len(students)], thread=th, defaults={'value': 1})
    Vote.objects.get_or_create(user=students[(idx + 2) % len(students)], thread=th, defaults={'value': 1})

print("Seed data successfully populated!")
