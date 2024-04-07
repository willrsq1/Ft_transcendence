import uuid, time, threading, signal

import game_app.pong.constants as g
import game_app.pong.game_manager as game_manager

class GameServer:
    def __init__(self):
        self.tick_rate = g.TICKRATE
        self.game_sessions = {}
        self.is_running = False
        self.thread = None

    def signal_handler(self, signum, frame):
        server.server_stop()

    def server_run(self):
        self.is_running = True

        if self.thread is None:
            signal.signal(signal.SIGINT, self.signal_handler)
            signal.signal(signal.SIGTERM, self.signal_handler)
            self.thread = threading.Thread(target=self.update_game_sessions)
            self.thread.start()

    def server_stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join()
            self.thread = None

    def update_game_sessions(self):
        while self.is_running:
            start_time = time.perf_counter()

            keys_to_remove = []
            for game_id, session in self.game_sessions.items():
                session.update(self.tick_rate)
                if session.get_status() == g.STATUS_QUIT:
                    keys_to_remove.append(game_id)

            for game_id in keys_to_remove:
                self.game_delete(game_id)

            elapsed_time = time.perf_counter() - start_time
            time.sleep(max(0, self.tick_rate - elapsed_time))

    def handle_disconnect(self, game_id):
        if game_id in self.game_sessions:
            self.game_delete(game_id)

    def game_create(self, game_id):
        self.game_sessions[game_id] = game_manager.GameManager()

    def game_delete(self, game_id):
        if game_id in self.game_sessions:
            del self.game_sessions[game_id]

    def game_exists(self, game_id):
        return game_id in self.game_sessions

    def player_is_in_session(self, game_id, alias):
        if game_id in self.game_sessions:
            return alias in self.game_sessions[game_id].aliases

    def player_has_active_session(self, alias):
        for game_id, session in self.game_sessions.items():
            if alias in session.aliases:
                return game_id
        return None

    def add_player(self, game_id, alias, user_id):
        if game_id in self.game_sessions:
            aliases = self.game_sessions[game_id].aliases
            player_id = g.ID_PLAYER1 if aliases[g.ID_PLAYER1] == "" else g.ID_PLAYER2
            aliases[player_id] = alias
            self.game_sessions[game_id].user_ids[player_id] = user_id

    def get_latest_snap(self, game_id):
        if game_id in self.game_sessions:
            return self.game_sessions[game_id].get_latest_snap()
        else:
            return "Game has ended."

    def matchmaker(self, alias, user_id):
        for game_id, session in self.game_sessions.items():
            if session.aliases[g.ID_PLAYER1] == "" or session.aliases[g.ID_PLAYER2] == "":
                self.add_player(game_id, alias, user_id)
                session.game.status = g.STATUS_ACTIVE
                return game_id

        game_id = uuid.uuid4()
        self.game_create(game_id)
        self.add_player(game_id, alias, user_id)
        return game_id

    def create_input(self, game_id, alias, input_id, timestamp):
        self.game_sessions[game_id].create_input(alias, input_id, timestamp)

server = GameServer()
