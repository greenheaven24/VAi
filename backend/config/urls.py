from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('annotate.urls')),
    # Serve uploaded media in both dev and production. For a small disk-backed
    # deployment this is sufficient; a larger app would front media with object
    # storage (S3/Cloudinary) or a CDN instead.
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
