"""
URL configuration for janken_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from .views import createJankenGameAPIView, jankenGameAPIView, waitForOpponentAPIView, waitForResultsAPIView, getResultsAPIView, deleteMyJankenGameCreationAPIView, gameInProgressAPIView, amIPlayingAPIView, jankenHistoryAPIView, getFriendStatsAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('prometheus/', include("django_prometheus.urls")),


    #janken
	path('createJankenGame/', createJankenGameAPIView.as_view(), name='createJankenGame'),
	path('jankenGame/', jankenGameAPIView.as_view(), name='jankenGame'),
	path('waitForOpponent/', waitForOpponentAPIView.as_view(), name='waitForOpponent'),
	path('waitForResults/', waitForResultsAPIView.as_view(), name='waitForResults'),
	path('gameInProgress/', gameInProgressAPIView.as_view(), name='gameInProgress'),
	path('getResults/', getResultsAPIView.as_view(), name='getResults'),
	path('deleteMyJankenGameCreation/', deleteMyJankenGameCreationAPIView.as_view(), name='deleteMyJankenGameCreation'),
	path('amIPlaying/', amIPlayingAPIView.as_view(), name='amIPlaying'),
	path('jankenHistory/', jankenHistoryAPIView.as_view(), name='jankenHistory'),
	path('getFriendStats/', getFriendStatsAPIView.as_view(), name='getFriendStats'),
]
