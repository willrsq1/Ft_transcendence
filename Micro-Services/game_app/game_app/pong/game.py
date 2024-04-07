import math
import random

import game_app.pong.constants as g
import game_app.pong.physics as physics

class Game:
    def __init__(self) -> None:
        self.t = 0.0
        self.status = g.STATUS_WAITING
        self.scores = [0,0]
        self.players_ready = [0, 0]
        self.who_serves = g.ID_PLAYER1
        self.particle_pool = physics.ParticlePool(16)
        self.ball = physics.Rectangle((g.BOARD_WIDTH - g.BALL_SIDE) / 2, (g.BOARD_HEIGHT - g.BALL_SIDE) / 2, g.BALL_SIDE, g.BALL_SIDE, 0, g.BALL_SPEED_MIN,)
        self.player1 = physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, g.BOARD_HEIGHT - (3 * g.BOARD_WALL), g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0,)
        self.player2 = physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, 2 * g.BOARD_WALL, g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0)
        self.collision_happened = False
        self.victory_happened = False
        self.score_happened = False
        self.reset_ball()

    def reset(self):
        self.t = 0.0
        self.status = g.STATUS_WAITING
        self.scores = [0,0]
        self.players_ready = [0, 0]
        self.who_serves = g.ID_PLAYER1
        self.particle_pool = physics.ParticlePool(16)
        self.ball = physics.Rectangle((g.BOARD_WIDTH - g.BALL_SIDE) / 2, (g.BOARD_HEIGHT - g.BALL_SIDE) / 2, g.BALL_SIDE, g.BALL_SIDE, 0, g.BALL_SPEED_MIN,)
        self.player1 = physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, g.BOARD_HEIGHT - (3 * g.BOARD_WALL), g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0,)
        self.player2 = physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, 2 * g.BOARD_WALL, g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0)
        self.collision_happened = False
        self.victory_happened = False
        self.score_happened = False
        self.reset_ball()

    def reset_ball(self):
        self.ball.position.x = (g.BOARD_WIDTH - self.ball.size.x) / 2
        self.ball.position.y = (g.BOARD_HEIGHT - self.ball.size.y) / 2

        direction = 1 if self.who_serves == g.ID_PLAYER1 else -1
        angle = random.random() * (g.BALL_MAX_ANGLE * 2) - g.BALL_MAX_ANGLE

        self.ball.velocity.x = math.sin(angle) * g.BALL_SPEED_MIN * direction
        self.ball.velocity.y = math.cos(angle) * g.BALL_SPEED_MIN * direction

    # Update the angle of the ball based on where it hits the paddle
    def update_ball_velocity(self, paddle, normal):
        expanded = physics.Rectangle(
            paddle.position.x - self.ball.size.x / 2,
            paddle.position.y - self.ball.size.y / 2,
            paddle.size.x + self.ball.size.x,
            paddle.size.y + self.ball.size.y,
            0,
            0,
        )
        ball_center = physics.Vector(self.ball.position.x + self.ball.size.x / 2, self.ball.position.y + self.ball.size.y / 2)
        paddle_center = physics.Vector(expanded.position.x + expanded.size.x / 2, expanded.position.y + expanded.size.y / 2)

        if normal.x != 0:
            c = ((ball_center.y - paddle_center.y) / (expanded.size.y / 2)) * g.BALL_MAX_ANGLE
            self.ball.velocity.x = normal.x * math.cos(c) * g.BALL_SPEED_MAX
            self.ball.velocity.y = math.sin(c) * g.BALL_SPEED_MAX
        elif normal.y != 0:
            c = ((ball_center.x - paddle_center.x) / (expanded.size.x / 2)) * g.BALL_MAX_ANGLE
            self.ball.velocity.x = math.sin(c) * g.BALL_SPEED_MAX
            self.ball.velocity.y = normal.y * math.cos(c) * g.BALL_SPEED_MAX

    def update_paddle_position(self, paddle, dt):
        paddle.position.x += paddle.velocity.x * dt

        if paddle.position.x < g.BOARD_CORRIDOR:
            paddle.position.x = g.BOARD_CORRIDOR
        elif paddle.position.x + paddle.size.x > g.BOARD_WIDTH - g.BOARD_CORRIDOR:
            paddle.position.x = g.BOARD_WIDTH - g.BOARD_CORRIDOR - paddle.size.x


    def update_ball_position(self, dt):
        player = None
        collision = None

        c1 = physics.aabb_continuous_detection(self.ball, self.player1, dt)
        c2 = physics.aabb_continuous_detection(self.ball, self.player2, dt)

        if c1.time > 0:
            player = self.player1
            collision = c1
        elif c2.time > 0:
            player = self.player2
            collision = c2

        if collision is not None and player is not None and collision.time > 0 and collision.time <= 1.0:
            self.collision_happened = True
            v = physics.aabb_continuous_resolve(self.ball, collision)
            self.ball.position.x += v.x * dt
            self.ball.position.y += v.y * dt
            self.update_ball_velocity(player, collision.normal)
        else:
            self.ball.position.x += self.ball.velocity.x * dt
            self.ball.position.y += self.ball.velocity.y * dt

        if self.ball.position.x <= g.BOARD_WALL or self.ball.position.x + self.ball.size.x >= g.BOARD_WIDTH - g.BOARD_WALL:
            # Left and right walls
            self.ball.position.x = g.BOARD_WALL if self.ball.position.x <= g.BOARD_WALL else g.BOARD_WIDTH - self.ball.size.x - g.BOARD_WALL
            self.ball.velocity.x *= -1
            self.collision_happened = True
        elif self.ball.position.y <= g.BOARD_WALL or self.ball.position.y + self.ball.size.y >= g.BOARD_HEIGHT - g.BOARD_WALL:
            # Top and bottom wall
            if self.ball.position.y <= g.BOARD_WALL:
                self.scores[g.ID_PLAYER1] += 1
            else:
                self.scores[g.ID_PLAYER2] += 1

            self.particle_pool.reset(self.ball.position.x + self.ball.size.x / 2, self.ball.position.y + self.ball.size.y / 2)
            self.who_serves = not self.who_serves
            self.score_happened = True
            self.reset_ball()

            if self.scores[g.ID_PLAYER1] >= g.POINTS_TO_WIN or self.scores[g.ID_PLAYER2] >= g.POINTS_TO_WIN:
                self.status = g.STATUS_ENDED
                self.victory_happened = True
                self.ball.velocity.x = 0
                self.ball.velocity.y = 0


    def update(self, dt):

        self.t += dt

        if self.t < 1 or self.status not in [g.STATUS_ACTIVE, g.STATUS_ENDED]:
            return

        self.collision_happened = False
        self.victory_happened = False
        self.score_happened = False

        self.update_paddle_position(self.player1, dt)
        self.update_paddle_position(self.player2, dt)

        if self.particle_pool.get_n_actives() > 0:
            self.particle_pool.update(dt)
            return

        self.update_ball_position(dt)
