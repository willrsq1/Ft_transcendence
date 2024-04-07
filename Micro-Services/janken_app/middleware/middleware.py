import jwt
from janken_app import settings
import os
from django.http import JsonResponse

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = self.get_token(request)
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                request.user_id = payload.get('user_id')
                request.secret = payload.get('secret')
                request.username = payload.get('username')
                if (request.user_id is None) or (request.secret is None) or (request.username is None):
                    raise ValueError('Invalid payload')
                if (request.secret != os.environ.get('JANKEN_SECRET')):
                    raise ValueError('Invalid secret')
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError) as e:
                return JsonResponse({'error': "bad jwt"})
        return self.get_response(request)
    
    @staticmethod
    def get_token(request):
        authorization_header = request.META.get('HTTP_AUTHORIZATION')
        if authorization_header:
            try:
                prefix, token = authorization_header.split(' ')
                if prefix.lower() == 'bearer':
                    return token
                
            except ValueError:
                pass
        return request.GET.get('token')