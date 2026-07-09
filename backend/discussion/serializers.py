from rest_framework import serializers
from .models import Thread, Comment, Vote
from core.serializers import UserSerializer
from django.db.models import Sum

class RecursiveField(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = RecursiveField(many=True, read_only=True)
    score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'thread', 'author', 'content', 'parent', 'replies', 'score', 'user_vote', 'created_at']
        read_only_fields = ['author', 'score', 'user_vote']

    def get_score(self, obj):
        result = obj.votes.aggregate(total=Sum('value'))
        return result['total'] or 0

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return vote.value
        return 0

class ThreadSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ['id', 'classroom', 'author', 'title', 'content', 'comments', 'score', 'user_vote', 'created_at']
        read_only_fields = ['author', 'score', 'user_vote']

    def get_score(self, obj):
        result = obj.votes.aggregate(total=Sum('value'))
        return result['total'] or 0

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return vote.value
        return 0

    def get_comments(self, obj):
        # Return only top-level comments; nested replies are handled by RecursiveField
        root_comments = obj.comments.filter(parent__isnull=True)
        return CommentSerializer(root_comments, many=True, context=self.context).data
