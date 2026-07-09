import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'course_backend.settings')
django.setup()

from core.models import User, ClassRoom
from discussion.models import Thread, Comment, Vote

student = User.objects.get(username='student1')
instructor = User.objects.get(username='instructor1')
classroom = ClassRoom.objects.get(name="Matematik 101")

# 1. Create a Thread by student
thread = Thread.objects.create(
    classroom=classroom,
    author=student,
    title="Vize Sınavı Konuları Neler?",
    content="Arkadaşlar vize konuları sadece ilk 3 ünite miydi?"
)

# 2. Instructor replies
c1 = Comment.objects.create(
    thread=thread,
    author=instructor,
    content="Evet, sadece ilk 3 ünite. 4. ünite finale dahil."
)

# 3. Student nested replies (reply to instructor)
c2 = Comment.objects.create(
    thread=thread,
    author=student,
    content="Teşekkürler hocam.",
    parent=c1
)

# 4. Votes
# Instructor upvotes the thread
Vote.objects.create(user=instructor, thread=thread, value=1)
# Student upvotes instructor's answer
Vote.objects.create(user=student, comment=c1, value=1)

print("Discussion seed completed!")
