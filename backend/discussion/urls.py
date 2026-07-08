from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThreadViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'threads', ThreadViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
