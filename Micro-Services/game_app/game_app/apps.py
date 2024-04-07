from django.apps import AppConfig


class PongGameConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "game_app"

    def ready(self):
        from game_app.pong.game_server import server
        if not hasattr(server, 'thread') or not server.thread:
            server.server_run()
