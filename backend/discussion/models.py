from django.db import models
from core.models import User, ClassRoom

class Thread(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='threads')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='threads')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.classroom.name}"


class Comment(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.thread.title}"


class Vote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, null=True, blank=True, related_name='votes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True, related_name='votes')
    value = models.IntegerField(choices=[(1, 'Upvote'), (-1, 'Downvote')])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'thread'], name='unique_thread_vote', condition=models.Q(thread__isnull=False)),
            models.UniqueConstraint(fields=['user', 'comment'], name='unique_comment_vote', condition=models.Q(comment__isnull=False)),
        ]

    def __str__(self):
        target = f"Thread: {self.thread.title}" if self.thread else f"Comment: {self.comment.id}"
        return f"{self.user.username} voted {self.value} on {target}"
