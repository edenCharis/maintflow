from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("companies.urls")),
    path("api/assets/", include("assets.urls")),
    path("api/requests/", include("requests_app.urls")),
    path("api/failures/", include("failures.urls")),
    path("api/work-orders/", include("workorders.urls")),
    path("api/maintenance-plans/", include("maintenance.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/audit-logs/", include("audit.urls")),
    path("api/dashboard/", include("dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
