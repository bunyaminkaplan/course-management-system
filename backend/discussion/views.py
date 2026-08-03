from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import Thread, Comment, Vote
from .serializers import ThreadSerializer, CommentSerializer
from activity_log.mixins import ActivityLogMixin
from activity_log.utils import log_activity

class ThreadViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Thread.objects.all().order_by('-created_at')
    serializer_class = ThreadSerializer
    permission_classes = [IsAuthenticated]
    log_category = 'FORUM'
    log_action_create = 'CREATE_THREAD'
    log_action_update = ''
    log_action_destroy = 'DELETE_THREAD'
    log_display_create = 'Forum konusu açıldı'
    log_display_update = ''
    log_display_destroy = 'Forum konusu silindi'

    def get_log_details(self, instance, action):
        return {
            'title': instance.title,
            'classroom': instance.classroom.name,
            'author': instance.author.username,
        }

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        if self.log_action_create and self.log_category:
            instance = serializer.instance
            details = self.get_log_details(instance, 'create')
            log_activity(
                request=self.request,
                category=self.log_category,
                action=self.log_action_create,
                action_display=self.log_display_create,
                details=details,
                target_model='Thread',
                target_id=instance.id
            )

    @action(detail=False, methods=['get'])
    def by_classroom(self, request):
        classroom_id = request.query_params.get('classroom_id')
        if not classroom_id:
            return Response({"detail": "classroom_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        threads = self.queryset.filter(classroom_id=classroom_id)
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        thread = self.get_object()
        value = int(request.data.get('value', 0))
        if value not in [1, -1]:
            return Response({"detail": "value must be 1 or -1"}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_vote = Vote.objects.filter(user=request.user, thread=thread).first()
        if existing_vote:
            existing_vote.delete()
            detail_msg = "Vote removed (neutralized)."
            current_user_vote = 0
        else:
            Vote.objects.create(user=request.user, thread=thread, value=value)
            detail_msg = "Vote recorded."
            current_user_vote = value
            
        score = thread.votes.aggregate(total=models.Sum('value'))['total'] or 0

        log_activity(
            request, 'FORUM', 'VOTE', 'Oy verildi', 'SUCCESS',
            details={
                'target': 'thread',
                'thread_title': thread.title,
                'value': current_user_vote,
                'action': 'removed' if current_user_vote == 0 else 'voted',
            },
            target_model='Thread', target_id=thread.id
        )

        return Response({"detail": detail_msg, "score": score, "user_vote": current_user_vote})


class CommentViewSet(ActivityLogMixin, viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    log_category = 'FORUM'
    log_action_create = 'CREATE_COMMENT'
    log_action_update = ''
    log_action_destroy = 'DELETE_COMMENT'
    log_display_create = 'Yorum yazıldı'
    log_display_update = ''
    log_display_destroy = 'Yorum silindi'

    def get_log_details(self, instance, action):
        return {
            'thread_title': instance.thread.title,
            'author': instance.author.username,
            'is_reply': instance.parent is not None,
        }

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        if self.log_action_create and self.log_category:
            instance = serializer.instance
            details = self.get_log_details(instance, 'create')
            log_activity(
                request=self.request,
                category=self.log_category,
                action=self.log_action_create,
                action_display=self.log_display_create,
                details=details,
                target_model='Comment',
                target_id=instance.id
            )

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        comment = self.get_object()
        value = int(request.data.get('value', 0))
        if value not in [1, -1]:
            return Response({"detail": "value must be 1 or -1"}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_vote = Vote.objects.filter(user=request.user, comment=comment).first()
        if existing_vote:
            existing_vote.delete()
            detail_msg = "Vote removed (neutralized)."
            current_user_vote = 0
        else:
            Vote.objects.create(user=request.user, comment=comment, value=value)
            detail_msg = "Vote recorded."
            current_user_vote = value
            
        score = comment.votes.aggregate(total=models.Sum('value'))['total'] or 0

        log_activity(
            request, 'FORUM', 'VOTE', 'Oy verildi', 'SUCCESS',
            details={
                'target': 'comment',
                'thread_title': comment.thread.title,
                'value': current_user_vote,
                'action': 'removed' if current_user_vote == 0 else 'voted',
            },
            target_model='Comment', target_id=comment.id
        )

        return Response({"detail": detail_msg, "score": score, "user_vote": current_user_vote})
