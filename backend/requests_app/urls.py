from rest_framework.routers import DefaultRouter

from requests_app.views import InterventionRequestViewSet

router = DefaultRouter()
router.register("", InterventionRequestViewSet, basename="request")

urlpatterns = router.urls
