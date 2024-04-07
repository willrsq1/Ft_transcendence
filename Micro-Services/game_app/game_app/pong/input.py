import game_app.pong.constants as g

class Input:
    def __init__(self, player_id, input_id, timestamp):
        self.timestamp = timestamp
        self.input_id = input_id
        self.player_id = player_id

class InputManager:
    def __init__(self):
        self.input_queue = []

    def reset(self):
        self.input_queue = []

    def create_input(self, player_id, input_id, timestamp):
        self.input_queue.append(Input(player_id, input_id, timestamp))

    def process_inputs(self, game):
        self.apply_inputs_to_game(game)

    def apply_inputs_to_game(self, game):
        for input in self.input_queue:
            player = game.player1 if input.player_id == g.ID_PLAYER1 else game.player2
            if input.input_id == g.INPUT_NEUTRAL:
                player.velocity.x = 0
            elif input.input_id == g.INPUT_LEFT:
                player.velocity.x = -g.PADDLE_SPEED
            elif input.input_id == g.INPUT_RIGHT:
                player.velocity.x = g.PADDLE_SPEED
            elif input.input_id == g.INPUT_SPACE and game.status == g.STATUS_ENDED:
                    game.players_ready[input.player_id] = 1
                    if game.players_ready[0] and game.players_ready[1]:
                        game.reset()
                        self.reset()
                        game.status = g.STATUS_ACTIVE
            elif input.input_id == g.INPUT_QUIT:
                if game.status == g.STATUS_ENDED:
                    game.status = g.STATUS_QUIT
