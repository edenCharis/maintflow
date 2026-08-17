from rest_framework.routers import DefaultRouter

from workorders.views import WorkOrderPhotoViewSet, WorkOrderTaskViewSet, WorkOrderViewSet

router = DefaultRouter()
router.register("tasks", WorkOrderTaskViewSet, basename="work-order-task")
router.register("photos", WorkOrderPhotoViewSet, basename="work-order-photo")
router.register("", WorkOrderViewSet, basename="work-order")

urlpatterns = router.urls
