import * as g from './global.js';
import * as game from './game.js';
import { Rectangle } from './physics.js';
import { SnapshotManager } from './snapshot.js';

export class GraphicsManager {
	constructor() {
		this.canvas = g.canvas;
		this.ctx = g.ctx;
		this.display = new game.Game(g.TYPE_LOCAL);
		this.board_wall = g.BOARD_WALL;
		this.board_width = g.BOARD_WIDTH;
		this.board_height = g.BOARD_HEIGHT;
		this.shadow_offset_x = 5;
		this.shadow_offset_y = 5;
		this.font_size = 24;
		this.double_font_size = 2 * this.font_size;
		this.net = new Rectangle(this.board_wall, (this.board_height - 2) / 2, this.board_width - (2 * this.board_wall), 2, 0, 0);

		/*  purple, shadow purple, red, flesh, light grey */
		this.palette = ["#333333", "#262626", "#9e887a", "#EA906C", "#EEE2DE"];

		this.init();
	}

	init() {
		document.fonts.ready.then(() => {
			this.ctx.font = '24px "Code Page 437"';
		});
	}

	draw_rect_fill(x, y, w, h, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x, y, w, h);
	}

	draw_rect(x, y, w, h, line_width, color) {
		this.ctx.beginPath();
		this.ctx.rect(x, y, w, h);
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = line_width;
		this.ctx.stroke();
	}

	draw_text(text, x, y, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillText(text, x, y);
	}

	interpolate(older_snap, newer_snap, alpha) {

		SnapshotManager.load_state(this.display, newer_snap);

		const newer_state = newer_snap.state;
		const older_state = older_snap.state;

		this.display.ball.position.x = newer_state.ball.position.x * alpha + older_state.ball.position.x * (1.0 - alpha);
		this.display.ball.position.y = newer_state.ball.position.y * alpha + older_state.ball.position.y * (1.0 - alpha);
		this.display.player1.position.x = newer_state.player1.position.x * alpha + older_state.player1.position.x * (1.0 - alpha);
		this.display.player2.position.x = newer_state.player2.position.x * alpha + older_state.player2.position.x * (1.0 - alpha);

		if (older_state.particle_pool.get_n_actives() === 0 && newer_state.particle_pool.get_n_actives() > 0) {
			SnapshotManager.copy_particles(older_state.particle_pool, newer_state.particle_pool);
		}

		for (let i = 0; i < this.display.particle_pool.size; i++) {
			const older_particle = older_state.particle_pool.pool[i].rectangle.position;
			const newer_particle = newer_state.particle_pool.pool[i].rectangle.position;
			const display_particle = this.display.particle_pool.pool[i].rectangle.position;

			display_particle.x = newer_particle.x * alpha + older_particle.x * (1.0 - alpha);
			display_particle.y = newer_particle.y * alpha + older_particle.y * (1.0 - alpha);
		}
	}

	render_background() {
		/* Draw the background */
		this.draw_rect_fill(0, 0, this.board_width, this.board_height, this.palette[0]);

		/* Draw the walls */
		this.draw_rect_fill(0, 0, this.board_wall, this.board_height, this.palette[4]);
		this.draw_rect_fill(0, 0, this.board_width, this.board_wall, this.palette[4]);
		this.draw_rect_fill(this.board_width - this.board_wall, 0, this.board_wall, this.board_height, this.palette[4]);
		this.draw_rect_fill(0, this.board_height - this.board_wall, this.board_width, this.board_wall, this.palette[4]);

		/* Draw the vertical line in the middle of the table */
		this.draw_rect_fill(((this.board_width - (this.board_wall / 2)) / 2), 0, this.board_wall / 2, this.board_height, this.palette[4]);

		/* Draw the net */
		this.draw_rect_fill(this.net.position.x + this.shadow_offset_x, this.net.position.y + this.shadow_offset_y - this.net.size.y - 1, this.net.size.x - this.shadow_offset_x, this.net.size.y + 2, this.palette[1]);
		this.draw_rect_fill(this.net.position.x, this.net.position.y, this.net.size.x, this.net.size.y, this.palette[4]);

		/* Draw scores */
		this.draw_text(this.display.scores[g.ID_PLAYER1], this.board_width - this.double_font_size + this.shadow_offset_x, ((this.board_height / 2) + this.font_size) + this.shadow_offset_y, this.palette[1]);
		this.draw_text(this.display.scores[g.ID_PLAYER2], this.board_width - this.double_font_size + this.shadow_offset_x, ((this.board_height / 2) - (this.font_size / 3)) + this.shadow_offset_y, this.palette[1]);
		this.draw_text(this.display.scores[g.ID_PLAYER1], this.board_width - this.double_font_size, (this.board_height / 2) + this.font_size, this.palette[4]);
		this.draw_text(this.display.scores[g.ID_PLAYER2], this.board_width - this.double_font_size, (this.board_height / 2) - (this.font_size / 3), this.palette[4]);
	}

	render_entities() {

		const particles = this.display.particle_pool.get();

		/* Draw ball or particles */
		if (particles.length > 0) {
			particles.forEach(p => {
				this.draw_rect_fill(p.rectangle.position.x + this.shadow_offset_x, p.rectangle.position.y + this.shadow_offset_y, p.rectangle.size.x, p.rectangle.size.y, this.palette[1]);
			});
		} else {
			this.draw_rect_fill(this.display.ball.position.x + this.shadow_offset_x, this.display.ball.position.y + this.shadow_offset_y, this.display.ball.size.x, this.display.ball.size.y, this.palette[1]);
		}
		this.draw_rect_fill(this.display.player1.position.x + this.shadow_offset_x, this.display.player1.position.y + this.shadow_offset_y, this.display.player1.size.x, this.display.player1.size.y, this.palette[1]);
		this.draw_rect_fill(this.display.player2.position.x + this.shadow_offset_x, this.display.player2.position.y + this.shadow_offset_y, this.display.player2.size.x, this.display.player2.size.y, this.palette[1]);

		/* Draw ball or particles */
		if (particles.length > 0) {
			particles.forEach(p => {
				this.draw_rect_fill(p.rectangle.position.x, p.rectangle.position.y, p.rectangle.size.x, p.rectangle.size.y, this.palette[3]);
			});
		} else {
			this.draw_rect_fill(this.display.ball.position.x, this.display.ball.position.y, this.display.ball.size.x, this.display.ball.size.y, this.palette[3]);
		}

		/* Draw paddles */
		this.draw_rect_fill(this.display.player1.position.x, this.display.player1.position.y, this.display.player1.size.x, this.display.player1.size.y, this.palette[3]);
		this.draw_rect_fill(this.display.player2.position.x, this.display.player2.position.y, this.display.player2.size.x, this.display.player2.size.y, this.palette[3]);
	}

	render_text_active(game_type) {
		/* Draw message boxes */
		let text;
		if (this.display.status === g.STATUS_READY) {
			text = "Hit 'Space' to start";
			if (game_type === g.TYPE_REMOTE) {
				const nready = this.display.players_ready[g.ID_PLAYER1] + this.display.players_ready[g.ID_PLAYER2];
				text += ": " + nready + "/2"
			}
		} else if (this.display.status === g.STATUS_PAUSED) {
			text = "Paused";
		} else if (this.display.status === g.STATUS_WAITING) {
			text = "Waiting for player...";
		}

		const padding = 10;

		const text_w = this.ctx.measureText(text).width;
		const text_x = (this.board_width - text_w) / 2;
		const text_y = (this.board_height + this.font_size / 2) / 2;

		const box_w = text_w + padding * 2;
		const box_h = this.double_font_size;
		const box_x = (this.board_width - box_w) / 2;
		const box_y = (this.board_height - box_h) / 2;

		/* Draw box */
		this.draw_rect(box_x + this.shadow_offset_x - 1, box_y + this.shadow_offset_y - 1, box_w, box_h, 4, this.palette[1]);
		this.draw_rect(box_x, box_y, box_w, box_h, 4, this.palette[4]);
		this.draw_rect_fill(box_x, box_y, box_w, box_h, this.palette[0]);

		/* Draw text */
		this.draw_text(text, text_x + this.shadow_offset_x, text_y + this.shadow_offset_y, this.palette[1]);
		this.draw_text(text, text_x, text_y, this.palette[4]);
	}

	render_text_ended(game_type) {
		const who_won = this.display.scores[g.ID_PLAYER1] > this.display.scores[g.ID_PLAYER2] ? 1 : 0;
		const text_victory = who_won ? window.client.game_manager.aliases[0] + " won !" : window.client.game_manager.aliases[1] + " won !";
		const text_again = "Hit 'Space' to play again";
		const text_quit = "or 'Escape' to quit";
		const nreplay = this.display.players_ready[g.ID_PLAYER1] + this.display.players_ready[g.ID_PLAYER2];
		const text_replay = "Replay: " + nreplay + "/2";
		const fourth = this.board_height / 4;
		const padding = 10;

		let text_w = this.ctx.measureText(text_victory).width;
		let box_w = text_w + padding * 2;
		let box_h = this.double_font_size;
		let box_x = (this.board_width - box_w) / 2;
		let box_y = who_won ? ((this.board_height - box_h) / 2) + fourth : ((this.board_height - box_h) / 2) - fourth;

		let text_x = (this.board_width - text_w) / 2;
		let text_y = who_won ? ((this.board_height + this.font_size / 2) / 2) + fourth : ((this.board_height + this.font_size / 2) / 2) - fourth;

		/* Draw victory box */
		this.draw_rect(box_x + this.shadow_offset_x - 1, box_y + this.shadow_offset_y - 1, box_w, box_h, 4, this.palette[1]);
		this.draw_rect(box_x, box_y, box_w, box_h, 4, this.palette[4]);
		this.draw_rect_fill(box_x, box_y, box_w, box_h, this.palette[0]);

		/* Draw victory text */
		this.draw_text(text_victory, text_x + this.shadow_offset_x, text_y + this.shadow_offset_y, this.palette[1]);
		this.draw_text(text_victory, text_x, text_y, this.palette[4]);

		let text_again_w = this.ctx.measureText(text_again).width;
		let text_quit_w = this.ctx.measureText(text_quit).width;
		let text_replay_w = this.ctx.measureText(text_replay).width;
		let max_text_w = this.ctx.measureText(text_again).width;

		box_w = max_text_w + padding * 2;
		box_h = game_type === g.TYPE_REMOTE ? 2.5 * this.double_font_size : 1.85 * this.double_font_size;
		box_x = (this.board_width - box_w) / 2;
		box_y = (this.board_height - box_h) / 2;

		let text_again_x = (this.board_width - text_again_w) / 2;
		let text_quit_x = (this.board_width - text_quit_w) / 2;
		let text_replay_x = (this.board_width - text_replay_w) / 2;

		let text_again_y = box_y + padding + this.font_size;
		let text_quit_y = text_again_y + padding + this.font_size;
		let text_replay_y = text_quit_y + padding + this.font_size;

		/* Draw info box */
		this.draw_rect(box_x + this.shadow_offset_x - 1, box_y + this.shadow_offset_y - 1, box_w, box_h, 4, this.palette[1]);
		this.draw_rect(box_x, box_y, box_w, box_h, 4, this.palette[4]);
		this.draw_rect_fill(box_x, box_y, box_w, box_h, this.palette[0]);

		/* Draw info text */
		this.draw_text(text_again, text_again_x + this.shadow_offset_x, text_again_y + this.shadow_offset_y, this.palette[1]);
		this.draw_text(text_quit, text_quit_x + this.shadow_offset_x, text_quit_y + this.shadow_offset_y, this.palette[1]);
		this.draw_text(text_again, text_again_x, text_again_y, this.palette[4]);
		this.draw_text(text_quit, text_quit_x, text_quit_y, this.palette[4]);
		if (game_type === g.TYPE_REMOTE) {
			this.draw_text(text_replay, text_replay_x + this.shadow_offset_x, text_replay_y + this.shadow_offset_y, this.palette[1]);
			this.draw_text(text_replay, text_replay_x, text_replay_y, this.palette[4]);
		}
	}

	render(game_type) {
		this.render_background();
		this.render_entities();
		if (this.display.status === g.STATUS_WAITING || this.display.status === g.STATUS_PAUSED || this.display.status === g.STATUS_READY) {
			this.render_text_active(game_type);
		} else if (this.display.status === g.STATUS_ENDED) {
			this.render_text_ended(game_type);
		}
	}
}
