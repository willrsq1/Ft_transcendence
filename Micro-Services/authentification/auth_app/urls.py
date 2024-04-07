
from django.urls import path
#connection.js
from .views import LoginAPIView, RegisterAPIView, LogoutAPIView, check_authentication
#profile
from .views import getInfo, getFriendInfoAPIView, addFriendAPIView, getMyFriendsAPIView, FriendRequestsAPIView, update_profile_picture, EmailAPIView
from .views import NicknameAPIView, PasswordAPIView, RefuseFriendRequestAPIView, DeleteFriendAPIView, SaveLanguageAPIView, getNicknameWithUserIdAPIView, getUserIdWithNicknameAPIView
#42Oauth
from .views import Login42APIView, OAuthRedirectUrlAPIView, OAuthVerifyStateAPIView
#chatbot
from .views import chatbotAPIView


urlpatterns = [
    
    #connection.js
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('register/', RegisterAPIView.as_view(), name='api_register'),
    path('logout/', LogoutAPIView.as_view(), name='api_register'),
    path('check-authentication/', check_authentication, name='check_authentication'),
	

    #profile
	path('getInfo/', getInfo, name='get42info'),
	path('getFriendInfo/', getFriendInfoAPIView.as_view(), name='getFriendInfo'),
	path('addFriend/', addFriendAPIView.as_view(), name='addFriend'),
	path('getMyFriends/', getMyFriendsAPIView.as_view(), name='getmyFriends'),
	path('FriendRequests/', FriendRequestsAPIView.as_view(), name='FriendRequests'),
    path('RefuseFriendRequest/', RefuseFriendRequestAPIView.as_view(), name='RefuseFriendRequest'),
    path('DeleteFriend/', DeleteFriendAPIView.as_view(), name='DeleteFriend'),
    path('update_profile_picture/', update_profile_picture, name='update_profile_picture'),
    path("email/", EmailAPIView.as_view(), name="email_change"),
    path("nickname/", NicknameAPIView.as_view(), name="nickname_change"),
    path("password/", PasswordAPIView.as_view(), name="password"),
	path('getNicknameWithUserId/', getNicknameWithUserIdAPIView.as_view(), name='getNicknameWithUserId'),
	path('getUserIdWithNickname/', getUserIdWithNicknameAPIView.as_view(), name='getUserIdWithNickname'),
	path("SaveLanguage/", SaveLanguageAPIView.as_view(), name="SaveLanguage"),

    #42OAuth
	path('login42/', Login42APIView.as_view(), name='Login42'),
	path('OAuthRedirectUrl/', OAuthRedirectUrlAPIView.as_view(), name='OAuthRedirectUrl'),
	path('OAuthVerifyState/', OAuthVerifyStateAPIView.as_view(), name='OAuthVerifyState'),
	
    #chatbot
	path('chatgpt/', chatbotAPIView.as_view(), name='chatgpt'),
	
]
