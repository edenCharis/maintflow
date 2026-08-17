from rest_framework.routers import DefaultRouter

from failures.views import FailureViewSet

router = DefaultRouter()
router.register("", FailureViewSet, basename="failure")

urlpatterns = router.urls
