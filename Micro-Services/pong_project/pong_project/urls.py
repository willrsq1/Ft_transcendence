from django.contrib import admin
from django.urls import path, include
from django.urls import include

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("admin/", admin.site.urls),
	path('prometheus/', include("django_prometheus.urls")),
	path('favicon.ico', views.favicon_view, name='favicon'),
]