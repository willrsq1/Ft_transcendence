from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Profile, Friendship, Notifications

admin.site.register(Profile)
admin.site.register(Friendship)
admin.site.register(Notifications)
