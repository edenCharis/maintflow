from django.urls import path
from rest_framework.routers import DefaultRouter

from companies.views import LocationViewSet, MyCompanyView, SiteViewSet

router = DefaultRouter()
router.register("sites", SiteViewSet, basename="site")
router.register("locations", LocationViewSet, basename="location")

urlpatterns = [
    path("company/", MyCompanyView.as_view(), name="my-company"),
    *router.urls,
]
