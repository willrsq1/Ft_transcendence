from django.contrib import admin
from .models import JankenGameCreation, JankenGameInProgress, FinishedJankenGames

admin.site.register(JankenGameCreation)
admin.site.register(JankenGameInProgress)
admin.site.register(FinishedJankenGames)
