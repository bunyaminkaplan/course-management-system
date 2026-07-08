from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import Thread, Comment, Vote
from .serializers import ThreadSerializer, CommentSerializer

class ThreadViewSet(viewsets.ModelViewSet):
    queryset = Thread.objects.all().order_by('-created_at')
    serializer_class = ThreadSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

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
        
        vote, created = Vote.objects.update_or_create(
            user=request.user,
            thread=thread,
            defaults={'value': value}
        )
        return Response({"detail": "Vote recorded.", "score": thread.votes.aggregate(total=models.Sum('value'))['total']})


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        comment = self.get_object()
        value = int(request.data.get('value', 0))
        if value not in [1, -1]:
            return Response({"detail": "value must be 1 or -1"}, status=status.HTTP_400_BAD_REQUEST)
        
        vote, created = Vote.objects.update_or_create(
            user=request.user,
            comment=comment,
            defaults={'value': value}
        )
        return Response({"detail": "Vote recorded.", "score": comment.votes.aggregate(total=models.Sum('value'))['total']})
