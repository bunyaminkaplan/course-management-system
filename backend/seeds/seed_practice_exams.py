import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'course_backend.settings')
django.setup()

from core.models import User, ClassRoom, PracticeExam, ExamSubjectScore

print("Seeding practice exam data...")

# Fetch existing users and classrooms
students = list(User.objects.filter(role=User.Role.STUDENT).order_by('username')[:12])
classrooms = list(ClassRoom.objects.all())

if not students or not classrooms:
    print("ERROR: No students or classrooms found. Please run seed_pagination_data.py first.")
    sys.exit(1)

EXAM_TEMPLATES = [
    ("TYT Deneme Sınavı #1", [
        ("Türkçe", 30, 40),
        ("Matematik (TYT)", 25, 40),
        ("Fen Bilimleri", 15, 20),
        ("Sosyal Bilimler", 15, 20),
    ]),
    ("AYT Matematik Denemesi #1", [
        ("Matematik (AYT)", 20, 40),
        ("Geometri", 10, 25),
        ("Analitik Geometri", 5, 20),
    ]),
    ("TYT Türkiye Geneli Deneme", [
        ("Türkçe", 28, 40),
        ("Matematik (TYT)", 22, 40),
        ("Fen Bilimleri", 12, 20),
        ("Sosyal Bilimler", 11, 20),
    ]),
    ("AYT Türkiye Geneli Deneme", [
        ("Matematik (AYT)", 18, 40),
        ("Fizik", 10, 14),
        ("Kimya", 8, 13),
        ("Biyoloji", 7, 13),
    ]),
    ("İl Geneli Deneme Sınavı", [
        ("Türkçe", 25, 40),
        ("Matematik (TYT)", 20, 40),
        ("Fen Bilimleri", 13, 20),
        ("Sosyal Bilimler", 14, 20),
    ]),
    ("Okul Denemesi #1", [
        ("Türkçe", 32, 40),
        ("Matematik (TYT)", 27, 40),
        ("Fen Bilimleri", 16, 20),
        ("Sosyal Bilimler", 18, 20),
    ]),
    ("Okul Denemesi #2", [
        ("Türkçe", 24, 40),
        ("Matematik (TYT)", 19, 40),
        ("Fen Bilimleri", 11, 20),
        ("Sosyal Bilimler", 10, 20),
    ]),
]

today = date.today()

exam_configs = [
    (0,  0, 0, 3),
    (1,  0, 0, 3),
    (2,  0, 1, 7),
    (3,  1, 2, 5),
    (4,  1, 2, 5),
    (5,  2, 3, 10),
    (6,  2, 3, 10),
    (7,  3, 4, 2),
    (8,  3, 4, 2),
    (9,  0, 5, 14),
    (10, 1, 5, 14),
    (11, 0, 6, 1),
    (0,  1, 6, 1),
    (2,  2, 0, 8),
    (4,  3, 1, 20),
]

created = 0
skipped = 0

random.seed(42)
for (student_idx, class_idx, template_idx, days_ago) in exam_configs:
    student = students[student_idx % len(students)]
    classroom = classrooms[class_idx % len(classrooms)]
    template_title, subjects = EXAM_TEMPLATES[template_idx % len(EXAM_TEMPLATES)]
    exam_date = today - timedelta(days=days_ago)

    if PracticeExam.objects.filter(
        student=student,
        classroom=classroom,
        title=template_title,
        date=exam_date
    ).exists():
        print(f"  SKIP (exists): {student.username} - {template_title}")
        skipped += 1
        continue

    total_net = 0.0
    subject_data = []
    for subj_name, max_correct, max_questions in subjects:
        correct = random.randint(max(0, max_correct - 5), min(max_correct + 2, max_questions))
        incorrect = random.randint(0, max(0, max_questions - correct - 2))
        net = correct - incorrect / 4.0
        total_net += net
        subject_data.append((subj_name, correct, incorrect, round(net, 2)))

    exam = PracticeExam.objects.create(
        student=student,
        classroom=classroom,
        title=template_title,
        date=exam_date,
        total_net=round(total_net, 2)
    )

    for subj_name, correct, incorrect, net_score in subject_data:
        ExamSubjectScore.objects.create(
            exam=exam,
            subject_name=subj_name,
            correct=correct,
            incorrect=incorrect,
            net_score=net_score
        )

    print(f"  CREATED: {student.username} ({classroom.name}) - {template_title} [{exam_date}] -> {round(total_net, 2)} net")
    created += 1

print(f"\nDone! Created {created} exam(s), skipped {skipped} duplicate(s).")
