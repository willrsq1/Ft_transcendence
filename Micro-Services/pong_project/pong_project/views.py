from django.shortcuts import render


def index(request):
    return render(request, "index.html")


from django.http import HttpResponse
from django.shortcuts import render

def favicon_view(request):
    try:
        favicon_path = 'pong_project/static/files/moon.jpg'
        try:
            with open(favicon_path, 'rb') as f:
                favicon = f.read()
        except Exception as e:
            print(e)
        return HttpResponse(favicon, content_type='image/x-icon')
    except Exception as e:
        print(e)
        return HttpResponse("Error no favicon", content_type='text/plain')