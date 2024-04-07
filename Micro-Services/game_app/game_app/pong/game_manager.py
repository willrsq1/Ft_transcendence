import time

import game_app.pong.game as game
import game_app.pong.constants as g
import game_app.pong.sound as sound
import game_app.pong.input as input
from game_app.models import FinishedPongGames

class GameManager:
    def __init__(self) -> None:
        self.tick = 0
        self.accumulator = 0
        self.old_time = time.perf_counter()
        self.game = game.Game()
        self.aliases = ["", ""]
        self.user_ids = [0, 0]
        self.snapshot = None
        self.sound_events = []
        self.input = input.InputManager()
        self.sound = sound.SoundManager()
        self.already_saved = False

    def update(self, dt):
        new_time = time.perf_counter()
        time_delta = new_time - self.old_time
        self.old_time = new_time

        if time_delta > 0.25:
            time_delta = 0.25

        self.accumulator += time_delta

        while self.accumulator >= dt:
            self.tick += 1

            self.input.process_inputs(self.game)

            self.game.update(dt)
            if (self.game.status == g.STATUS_ENDED):
                self.save_to_db()

            self.sound.create_sound_events(self.tick, self.game.collision_happened, self.game.score_happened, self.game.victory_happened)

            self.accumulator -= dt

        self.serialize()

    def create_input(self, alias, input_id, timestamp):
        player_id = g.ID_PLAYER1 if self.aliases[g.ID_PLAYER1] == alias else g.ID_PLAYER2
        if ((input_id == g.INPUT_SPACE or input_id == g.INPUT_QUIT) and self.game.status != g.STATUS_ENDED):
            return
        self.input.create_input(player_id, input_id, timestamp)

    def get_latest_snap(self):
        return self.snapshot

    def get_status(self):
        return self.game.status

    def serialize(self):
        active_particles = self.game.particle_pool.get()
        score_arr = [self.game.scores[g.ID_PLAYER1], self.game.scores[g.ID_PLAYER2]]
        ready_arr = [self.game.players_ready[g.ID_PLAYER1], self.game.players_ready[g.ID_PLAYER2]]
        position_arr = [self.game.ball.position.x, self.game.ball.position.y, self.game.player1.position.x, self.game.player2.position.x]
        particle_arr = [(particle.rectangle.position.x, particle.rectangle.position.y) for particle in active_particles]
        sound_arr = self.sound.serialize_sound_events()
        len_particle_arr = len(active_particles)
        len_sound_arr = len(sound_arr)

        self.snapshot = [
            self.tick, # 0
            self.game.status, # 1
            score_arr, # 2
            ready_arr, # 3
            position_arr, # 4
            sound_arr, # 5
            particle_arr, # 6
            len_particle_arr, # 7
            len_sound_arr, # 8
        ]

    def save_to_db(self):
        if (self.already_saved == True):
            return
        self.already_saved = True
        winner = self.user_ids[0] if self.game.scores[0] > self.game.scores[1] else self.user_ids[1]
        result = "Victory" if winner == self.user_ids[0] else "Defeat"
        FinishedPongGames.objects.create(
            owner=self.user_ids[0], \
            game_type="remote", \
            opponent=self.user_ids[1], \
            player_score=self.game.scores[0], \
            opponent_score=self.game.scores[1], \
            winner=winner, \
            result=result, \
            completion_day= time.strftime("%d/%m"), \
            completion_time= time.strftime("%H:%M:%S"), \
        )
        result = "Defeat" if winner == self.user_ids[0] else "Victory"
        FinishedPongGames.objects.create(
            owner=self.user_ids[1], \
            game_type="remote", \
            opponent=self.user_ids[0], \
            player_score=self.game.scores[1], \
            opponent_score=self.game.scores[0], \
            winner=winner, \
            result=result, \
            completion_day= time.strftime("%d/%m"), \
            completion_time= time.strftime("%H:%M:%S"), \
        )
