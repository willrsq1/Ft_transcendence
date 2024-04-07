import * as g from './global.js';
import * as physics from './physics.js';

export class Game {
	constructor() {
		this.t = 0.0;
		this.status = g.STATUS_ACTIVE;
		this.scores = [0, 0];
		this.players_ready = [0, 0];
		this.who_serves = g.ID_PLAYER1;
		this.particle_pool = new physics.ParticlePool(16);
		this.ball = new physics.Rectangle((g.BOARD_WIDTH - g.BALL_SIDE) / 2, (g.BOARD_HEIGHT - g.BALL_SIDE) / 2, g.BALL_SIDE, g.BALL_SIDE, 0, g.BALL_SPEED_MIN);
		this.player1 = new physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, g.BOARD_HEIGHT - (3 * g.BOARD_WALL), g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0);
		this.player2 = new physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, 2 * g.BOARD_WALL, g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0);
		this.collision_happened = false;
		this.victory_happened = false;
		this.score_happened = false;
		this.reset_ball();
	}

	reset() {
		this.t = 0.0;
		this.status = g.STATUS_ACTIVE;
		this.players_ready = [0, 0];
		this.scores = [0, 0];
		this.who_serves = g.ID_PLAYER1;
		this.particle_pool = new physics.ParticlePool(16);
		this.ball = new physics.Rectangle((g.BOARD_WIDTH - g.BALL_SIDE) / 2, (g.BOARD_HEIGHT - g.BALL_SIDE) / 2, g.BALL_SIDE, g.BALL_SIDE, 0, g.BALL_SPEED_MIN);
		this.player1 = new physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, g.BOARD_HEIGHT - (3 * g.BOARD_WALL), g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0);
		this.player2 = new physics.Rectangle((g.BOARD_WIDTH - g.PADDLE_WIDTH) / 2, 2 * g.BOARD_WALL, g.PADDLE_WIDTH, g.BALL_SIDE, 0, 0);
		this.collision_happened = false;
		this.victory_happened = false;
		this.score_happened = false;
		this.reset_ball();
	}

	reset_ball() {
		this.ball.position.x = (g.BOARD_WIDTH - this.ball.size.x) / 2;
		this.ball.position.y = (g.BOARD_HEIGHT - this.ball.size.y) / 2;

		const direction = this.who_serves === g.ID_PLAYER1 ? 1 : -1;
		const angle = Math.random() * (g.BALL_MAX_ANGLE * 2) - g.BALL_MAX_ANGLE;

		this.ball.velocity.x = Math.sin(angle) * g.BALL_SPEED_MIN * direction;
		this.ball.velocity.y = Math.cos(angle) * g.BALL_SPEED_MIN * direction;
	}

	/* Update the angle of the ball based on where it hits the paddle */
	update_ball_velocity(paddle, normal) {
		const expanded =
			new physics.Rectangle(
				paddle.position.x - this.ball.size.x / 2,
				paddle.position.y - this.ball.size.y / 2,
				paddle.size.x + this.ball.size.x,
				paddle.size.y + this.ball.size.y,
				0,
				0
			);
		const ball_center =
			new physics.Vector(
				this.ball.position.x + this.ball.size.x / 2,
				this.ball.position.y + this.ball.size.y / 2
			);
		const paddle_center =
			new physics.Vector(
				expanded.position.x + expanded.size.x / 2,
				expanded.position.y + expanded.size.y / 2
			);

		if (normal.x != 0) {
			let c = ((ball_center.y - paddle_center.y) / (expanded.size.y / 2)) * g.BALL_MAX_ANGLE;
			this.ball.velocity.x = normal.x * Math.cos(c) * g.BALL_SPEED_MAX;
			this.ball.velocity.y = Math.sin(c) * g.BALL_SPEED_MAX;
		} else if (normal.y != 0) {
			let c = ((ball_center.x - paddle_center.x) / (expanded.size.x / 2)) * g.BALL_MAX_ANGLE;
			this.ball.velocity.x = Math.sin(c) * g.BALL_SPEED_MAX;
			this.ball.velocity.y = normal.y * Math.cos(c) * g.BALL_SPEED_MAX;
		}
	}

	update_paddle_position(paddle, dt) {
		paddle.position.x += paddle.velocity.x * dt;

		if (paddle.position.x < g.BOARD_CORRIDOR) {
			paddle.position.x = g.BOARD_CORRIDOR;
		} else if (paddle.position.x + paddle.size.x > g.BOARD_WIDTH - g.BOARD_CORRIDOR) {
			paddle.position.x = g.BOARD_WIDTH - g.BOARD_CORRIDOR - paddle.size.x;
		}
	}

	update_ball_position(dt) {
		let player = null;
		let collision = null;

		const c1 = physics.aabb_continuous_detection(this.ball, this.player1, dt);
		const c2 = physics.aabb_continuous_detection(this.ball, this.player2, dt);

		if (c1.time > 0) {
			player = this.player1;
			collision = c1;
		} else if (c2.time > 0) {
			player = this.player2;
			collision = c2;
		}

		if (collision != null && player != null && collision.time > 0 && collision.time <= 1.0) {
			this.collision_happened = true;
			let v = physics.aabb_continuous_resolve(this.ball, collision);
			this.ball.position.x += v.x * dt;
			this.ball.position.y += v.y * dt;
			this.update_ball_velocity(player, collision.normal);
		} else {
			this.ball.position.x += this.ball.velocity.x * dt;
			this.ball.position.y += this.ball.velocity.y * dt;
		}

		if (this.ball.position.x <= g.BOARD_WALL || this.ball.position.x + this.ball.size.x >= g.BOARD_WIDTH - g.BOARD_WALL) {
			/* Left and right walls */
			this.ball.position.x = this.ball.position.x <= g.BOARD_WALL ? g.BOARD_WALL : g.BOARD_WIDTH - this.ball.size.x - g.BOARD_WALL;
			this.ball.velocity.x *= -1;
			this.collision_happened = true;
		} else if (this.ball.position.y <= g.BOARD_WALL || this.ball.position.y + this.ball.size.y >= g.BOARD_HEIGHT - g.BOARD_WALL) {
			/* Top and bottoms walls */
			if (this.ball.position.y <= g.BOARD_WALL)
				this.scores[g.ID_PLAYER1] += 1;
			else
				this.scores[g.ID_PLAYER2] += 1;

			this.particle_pool.reset(this.ball.position.x + this.ball.size.x / 2, this.ball.position.y + this.ball.size.y / 2);
			this.who_serves = this.who_serves === g.ID_PLAYER1 ? g.ID_PLAYER2 : g.ID_PLAYER1;
			this.score_happened = true;
			this.reset_ball();

			if (this.scores[g.ID_PLAYER1] >= g.POINTS_TO_WIN || this.scores[g.ID_PLAYER2] >= g.POINTS_TO_WIN) {
				this.victory_happened = true;
				this.ball.velocity.y = 0;
				this.ball.velocity.x = 0;
			}
		}
	}

	update(dt) {
		this.t += dt;

		if (this.t < 1 || (this.status != g.STATUS_ACTIVE && this.status != g.STATUS_ENDED))
			return;

		this.update_paddle_position(this.player1, dt);
		this.update_paddle_position(this.player2, dt);

		if (this.particle_pool.get_n_actives() > 0) {
			this.particle_pool.update(dt);
			return;
		}

		this.update_ball_position(dt);
	}
}
