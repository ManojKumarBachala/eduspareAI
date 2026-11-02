from rest_framework.routers import DefaultRouter

from .views import (
    BookViewSet,
    BookIssueViewSet
)

router = DefaultRouter()

router.register(
    r'books',
    BookViewSet
)

router.register(
    r'book-issues',
    BookIssueViewSet
)

urlpatterns = router.urls