import * as g from './global.js';
import * as game from './game.js';

class Snapshot {
	constructor() {
		this.tick = 0;
		this.state = new game.Game();
	}
}

export class SnapshotManager {
	constructor() {
		this.index = 0;
		this.size = 64;
		this.snap_count = 0;
		this.older_snap = new Snapshot();
		this.newer_snap = new Snapshot();
		this.snap_buffer = Array.from({ length: this.size }, () => new Snapshot());
	}

	init() {
		this.older_snap = this.snap_buffer[(this.index - 2 + this.size) % this.size];
		this.newer_snap = this.snap_buffer[(this.index - 1 + this.size) % this.size];
	}

	save_server_data(data) {
		const snap = this.snap_buffer[this.index];
		const snap_state = snap.state;

		snap.tick = data[0];
		snap_state.status = data[1];
		snap_state.scores[g.ID_PLAYER1] = data[2][0];
		snap_state.scores[g.ID_PLAYER2] = data[2][1];
		snap_state.players_ready[g.ID_PLAYER1] = data[3][0];
		snap_state.players_ready[g.ID_PLAYER2] = data[3][1];
		snap_state.ball.position.x = data[4][0];
		snap_state.ball.position.y = data[4][1];
		snap_state.player1.position.x = data[4][2];
		snap_state.player2.position.x = data[4][3];

		const particle_arr = data[6];
		const len_particle_arr = data[7];

		snap_state.particle_pool.pool.forEach(particle => particle.active = false);

		for (let i = 0; i < len_particle_arr; i++) {
			const p = snap_state.particle_pool.pool[i];

			p.active = true;
			p.rectangle.position.x = particle_arr[i][0];
			p.rectangle.position.y = particle_arr[i][1];
		}

		this.snap_count += 1;
		this.index = (this.index + 1) % this.size;
	}

	get_interpolated_snapshots(remote_tick) {
		if (remote_tick < 0) {

			this.newer_snap = this.snap_buffer[(this.index - 1 + this.size) % this.size];
			this.older_snap = this.snap_buffer[(this.index - 2 + this.size) % this.size];

		} else {

			let found_older_snap = null;
			let found_newer_snap = null;

			for (let i = 0; i < this.size; i++) {
				let snap = this.snap_buffer[i];

				if (snap.tick === undefined) continue;

				if (snap.tick <= remote_tick && (!found_older_snap || snap.tick > found_older_snap.tick)) {
					found_older_snap = snap;
				}
				if (snap.tick > remote_tick && (!found_newer_snap || snap.tick < found_newer_snap.tick)) {
					found_newer_snap = snap;
				}
			}

			if (found_older_snap && found_newer_snap) {
				this.older_snap = found_older_snap;
				this.newer_snap = found_newer_snap;
			}
		}

		return [this.older_snap, this.newer_snap];
	}

	static copy_particles(dst, src) {
		for (let i = 0; i < dst.pool.length; i++) {
			dst.pool[i].life = src.pool[i].life;
			dst.pool[i].active = src.pool[i].active;
			dst.pool[i].rectangle.position.x = src.pool[i].rectangle.position.x;
			dst.pool[i].rectangle.position.y = src.pool[i].rectangle.position.y;
			dst.pool[i].rectangle.velocity.x = src.pool[i].rectangle.velocity.x;
			dst.pool[i].rectangle.velocity.y = src.pool[i].rectangle.velocity.y;
		}
	}

	save_state(game, tick) {
		const snap = this.snap_buffer[this.index];
		const snap_state = snap.state;

		snap.tick = tick;
		snap_state.status = game.status;
		snap_state.players_ready = [...game.players_ready];
		snap_state.scores = [...game.scores];
		snap_state.who_serves = game.who_serves;

		SnapshotManager.copy_particles(snap_state.particle_pool, game.particle_pool);

		snap_state.ball.position.x = game.ball.position.x;
		snap_state.ball.position.y = game.ball.position.y;
		snap_state.ball.velocity.x = game.ball.velocity.x;
		snap_state.ball.velocity.y = game.ball.velocity.y;
		snap_state.player1.position.x = game.player1.position.x;
		snap_state.player2.position.x = game.player2.position.x;
		snap_state.collision_happened = game.collision_happened;
		snap_state.victory_happened = game.victory_happened;
		snap_state.score_happened = game.score_happened;

		this.snap_count += 1;
		this.index = (this.index + 1) % this.size;
	}

	static load_state(game, snapshot) {
		const snap_state = snapshot.state;

		game.status = snap_state.status;
		game.players_ready = [...snap_state.players_ready];
		game.scores = [...snap_state.scores];
		game.who_serves = snap_state.who_serves;

		SnapshotManager.copy_particles(game.particle_pool, snap_state.particle_pool);

		game.ball.position.x = snap_state.ball.position.x;
		game.ball.position.y = snap_state.ball.position.y;
		game.ball.velocity.x = snap_state.ball.velocity.x;
		game.ball.velocity.y = snap_state.ball.velocity.y;
		game.player1.position.x = snap_state.player1.position.x;
		game.player2.position.x = snap_state.player2.position.x;
		game.collision_happened = snap_state.collision_happened;
		game.victory_happened = snap_state.victory_happened;
		game.score_happened = snap_state.score_happened;
	}

	get_snap_count() {
		return this.snap_count;
	}
}
