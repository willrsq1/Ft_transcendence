from django.urls import path
from django.urls import include

from . import views
from django.contrib import admin
from .views import pongHistoryAPIView, getFriendStatsAPIView
from .views import tournamentAPIView, tourneyHistoryAPIView, tourneyBlockchainKeyAPIView, tourneyTxAPIView

urlpatterns = [
    path("", views.game_create_view, name="game_create_view"),
    path('admin/', admin.site.urls),

    path("<uuid:game_id>/", views.game_view, name="game_view"),
	path('prometheus/', include("django_prometheus.urls")),
	path('pongHistory/', pongHistoryAPIView.as_view(), name='pongHistory'),
	path('getFriendStats/', getFriendStatsAPIView.as_view(), name='getFriendStats'),
	path('tournament/', tournamentAPIView.as_view(), name='tournament'),
	path('tourneyHistory/', tourneyHistoryAPIView.as_view(), name='tourneyHistory'),
    path('tourneyBlockchainKey/', tourneyBlockchainKeyAPIView.as_view(), name='tourneyblockchainkey'),
    path('tourneyTx/', tourneyTxAPIView.as_view(), name='tourneytx'),
]
