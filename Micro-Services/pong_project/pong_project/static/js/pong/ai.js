import * as g from './global.js';
import * as game from './game.js';
import * as physics from './physics.js';

/*
 * The behaves according to the following rules:
 *
 * Since we can look at the state of the game once per second, it means
 * that we have a 'budget' of 60 ticks to use to make our actions.
 *
 * The budget is divided as follow :
 * | move towards the ball | wait for collision | move back towards the center | wait for the remainder of the budget |
 *
*/

export class AIManager {
	constructor() {
		this.last_looked = 0.0;
		this.game = new game.Game();

		this.collision_point = new physics.Vector(0, 0);

		this.inputs = [];
		this.nput_movement = g.INPUT_NEUTRAL;
		this.input_center = g.INPUT_NEUTRAL;

		this.tick_budget = 60; /* The number of ticks we have before the next time we update our view */
		this.tick_collision = 0; /* The number of ticks before the ball collide with the paddle */
		this.tick_movement = 0; /* The minimum number of ticks before the paddle reaches the collision point */
		this.tick_center = 0; /* The number of ticks need to go back to the center of the board */

		this.intersect_area = new physics.Rectangle(0, 2 * g.BOARD_WALL, g.BOARD_WIDTH, g.BALL_SIDE, 0, 0);
	}

	reset() {
		this.last_looked = performance.now();
		this.game = new game.Game();

		this.collision_point = new physics.Vector(0, 0);

		this.inputs = [];
		this.nput_movement = g.INPUT_NEUTRAL;
		this.input_center = g.INPUT_NEUTRAL;

		this.tick_budget = 60; /* The number of ticks we have before the next time we update our view */
		this.tick_collision = 0; /* The number of ticks before the ball collide with the paddle */
		this.tick_movement = 0; /* The minimum number of ticks before the paddle reaches the collision point */
		this.tick_center = 0; /* The number of ticks need to go back to the center of the board */

		this.intersect_area = new physics.Rectangle(0, 2 * g.BOARD_WALL, g.BOARD_WIDTH, g.BALL_SIDE, 0, 0);
	}

	refresh(game, dt) {

		const elapsed = performance.now() - this.last_looked;

		if (elapsed >= 1000) {

			this.reset();

			/* Load the game state into the AI's 'memory' */
			this.load_state(game);

			if (this.game.ball.velocity.y >= 0) {
				this.tick_movement = 0;
				this.tick_collision = 0;
				this.handle_reset(dt);
			} else {
				this.handle_collision(dt);
				this.handle_movement(dt);
				this.handle_reset(dt);
			}

			this.queue_moves();
		}

		return this.inputs.shift();
	}

	handle_collision(dt) {
		let tick = 0;
		let collision = null;
		let collision_happened = false;

		while (!collision_happened && tick < 120) {
			tick += 1;

			collision = physics.aabb_continuous_detection(this.game.ball, this.intersect_area, dt);
			if (collision.time > 0 && collision.time <= 1.0) {
				collision_happened = true;
			} else {
				this.game.ball.position.x += this.game.ball.velocity.x * dt;
				this.game.ball.position.y += this.game.ball.velocity.y * dt;
			}

			if (this.game.ball.position.x <= g.BOARD_WALL || this.game.ball.position.x + this.game.ball.size.x >= g.BOARD_WIDTH - g.BOARD_WALL) {
				/* Left and right walls */
				this.game.ball.position.x = this.game.ball.position.x <= g.BOARD_WALL ? g.BOARD_WALL : g.BOARD_WIDTH - this.game.ball.size.x - g.BOARD_WALL;
				this.game.ball.velocity.x *= -1;
			}
		}

		this.tick_collision = tick;
		this.collision_point.x = collision.point.x;
		this.collision_point.y = collision.point.y;
	}

	handle_movement(dt) {
		let tick = 0;
		const paddle = this.game.player2;

		const paddle_center = this.game.player2.position.x + (this.game.player2.size.x / 2);
		if (this.collision_point.x < paddle_center) {
			this.game.player2.velocity.x = -g.PADDLE_SPEED;
			this.nput_movement = g.INPUT_LEFT;
		} else {
			this.game.player2.velocity.x = g.PADDLE_SPEED;
			this.nput_movement = g.INPUT_RIGHT;
		}

		while (!(paddle.position.x < this.collision_point.x && paddle.position.x + paddle.size.x >= this.collision_point.x) && tick < 60) {
			tick += 1;
			if (paddle.position.x + paddle.velocity.x * dt > g.BOARD_CORRIDOR && paddle.position.x + paddle.size.x + paddle.velocity.x * dt < g.BOARD_WIDTH - g.BOARD_CORRIDOR) {
				paddle.position.x += paddle.velocity.x * dt;
			}
		}

		this.tick_movement = tick;
	}

	handle_reset(dt) {
		const board_center = g.BOARD_WIDTH / 2;
		const paddle_center = this.game.player2.position.x + (this.game.player2.size.x / 2);
		const distance_from_center = board_center - paddle_center;
		const velocity = board_center <= paddle_center ? -g.PADDLE_SPEED : g.PADDLE_SPEED;
		const delta_move = velocity * dt;

		if (distance_from_center < 0) {
			this.input_center = g.INPUT_LEFT;
		} else if (distance_from_center > 0) {
			this.input_center = g.INPUT_RIGHT;
		}

		this.tick_center = Math.abs(Math.floor(distance_from_center / delta_move));
	}

	queue_moves() {
		for (let i = 0; i < this.tick_movement && this.tick_budget > 0; i++) {
			this.inputs.push(this.nput_movement);
			this.tick_budget -= 1;
		}
		for (let i = 0; i < this.tick_collision && this.tick_budget > 0; i++) {
			this.inputs.push(g.INPUT_NEUTRAL);
			this.tick_budget -= 1;
		}
		for (let i = 0; i < this.tick_center && this.tick_budget > 0; i++) {
			this.inputs.push(this.input_center);
			this.tick_budget -= 1;
		}
		for (let i = 0; this.tick_budget > 0; i++) {
			this.inputs.push(g.INPUT_NEUTRAL);
			this.tick_budget -= 1;
		}
	}

	load_state(game) {
		this.game.status = game.status;
		this.game.who_serves = game.who_serves;
		this.game.ball.position.x = game.ball.position.x;
		this.game.ball.position.y = game.ball.position.y;
		this.game.ball.velocity.x = game.ball.velocity.x;
		this.game.ball.velocity.y = game.ball.velocity.y;
		this.game.player1.position.x = game.player1.position.x;
		this.game.player2.position.x = game.player2.position.x;
	}
}
