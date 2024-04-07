import * as g from './global.js';
import * as ai from './ai.js';
import * as game from './game.js';
import * as sound from './sound.js';
import * as input from './input.js';
import * as snapshot from './snapshot.js';
import * as graphics from './graphics.js';
import * as Oauth from '../Oauth.js';


export class GameManager {
	constructor() {
		this.game = null;
		this.game_id = undefined;
		this.game_type = undefined;
		this.tourney_id = undefined;
		this.game_result = [];
		this.aliases = ["Player 1", "Player 2"];
		this.request_id = undefined;
		this.event_source = null;
		this.key_handler_func = (event) => this.input.key_handler(event);
		this.timestep = g.TIMESTEP;
		this.local_tick = 0;
		this.remote_tick = -1;
		this.latest_server_tick = 0;
		this.accumulator = 0.0;
		this.frame_duration = 0.0;
		this.remote_send_rate = g.REMOTE_SEND_RATE;
		this.last_time = performance.now();

		this.ai = new ai.AIManager()
		this.input = new input.InputManager();
		this.sound = new sound.SoundManager();
		this.graphics = new graphics.GraphicsManager();
		this.snapshot = new snapshot.SnapshotManager();
	}

	eventlisteners() {
		document.getElementById('local-button').addEventListener('click', () => this.game_create(g.TYPE_LOCAL));
		document.getElementById('remote-button').addEventListener('click', () => this.game_create(g.TYPE_REMOTE));
		document.getElementById('ai-button').addEventListener('click', () => this.game_create(g.TYPE_AI));

		window.addEventListener('unload', () => this.game_delete());

		document.getElementById('game-div-test-K').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', 'k'));
		document.getElementById('game-div-test-L').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', 'l'));
		document.getElementById('game-div-test-A').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', 'a'));
		document.getElementById('game-div-test-S').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', 's'));
		document.getElementById('game-div-test-ESC').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', 'Escape'));
		document.getElementById('game-div-test-Space').addEventListener('mousedown', () => this.input.key_handler(null, 'keydown', ' '));
		document.getElementById('game-div-test-K').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', 'k'));
		document.getElementById('game-div-test-L').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', 'l'));
		document.getElementById('game-div-test-A').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', 'a'));
		document.getElementById('game-div-test-S').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', 's'));
		document.getElementById('game-div-test-ESC').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', 'Escape'));
		document.getElementById('game-div-test-Space').addEventListener('mouseup', () => this.input.key_handler(null, 'keyup', ' '));


		document.getElementById('game-div-test-K').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', 'k'), { passive: true });
		document.getElementById('game-div-test-L').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', 'l'), { passive: true });
		document.getElementById('game-div-test-A').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', 'a'), { passive: true });
		document.getElementById('game-div-test-S').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', 's'), { passive: true });
		document.getElementById('game-div-test-ESC').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', 'Escape'), { passive: true });
		document.getElementById('game-div-test-Space').addEventListener('touchstart', () => this.input.key_handler(null, 'keydown', ' '), { passive: true });

		document.getElementById('game-div-test-K').addEventListener('touchend', () => this.input.key_handler(null, 'keyup', 'k'));
		document.getElementById('game-div-test-L').addEventListener('touchend', () => this.input.key_handler(null, 'keyup', 'l'));
		document.getElementById('game-div-test-A').addEventListener('touchend', () => this.input.key_handler(null, 'keyup', 'a'));
		document.getElementById('game-div-test-S').addEventListener('touchend', () => this.input.key_handler(null, 'keyup', 's'));

	}

	reset() {
		this.game = null;
		this.game_id = undefined;
		this.game_type = undefined;
		this.game_result = [];
		this.aliases = ["Player 1", "Player 2"];
		this.request_id = undefined;
		this.event_source = null;

		this.timestep = g.TIMESTEP;
		this.local_tick = 0;
		this.remote_tick = -1;
		this.latest_server_tick = 0;
		this.accumulator = 0.0;
		this.frame_duration = 0.0;
		this.remote_send_rate = g.REMOTE_SEND_RATE;
		this.last_time = performance.now();

		this.ai = new ai.AIManager()
		this.input = new input.InputManager();
		this.sound = new sound.SoundManager();
		this.graphics = new graphics.GraphicsManager();
		this.snapshot = new snapshot.SnapshotManager();
	}

	update_remote_tick() {

		if (this.remote_tick < 0) {
			this.remote_tick = this.latest_server_tick - (this.remote_send_rate * 2);
			return;
		}

		const diff = this.latest_server_tick - this.remote_tick;

		if (diff >= this.remote_send_rate * 3) {
			this.remote_tick += Math.min(diff - (this.remote_send_rate * 2), (this.remote_send_rate * 4))
		} else if (diff >= 0 && diff < this.remote_send_rate) {
			this.remote_tick -= 1;
		} else if (diff < 0 && Math.abs(diff) <= this.remote_send_rate * 2) {
			this.remote_tick -= this.remote_send_rate;
		} else if (diff < 0 && Math.abs(diff) > this.remote_send_rate * 2) {
			this.remote_tick = this.latest_server_tick - (this.remote_send_rate * 2);
		}
	}

	async update_loop() {
		this.request_id = requestAnimationFrame(this.update_loop.bind(this));

		let curr_time = performance.now();

		/* Convert to seconds */
		this.frame_duration = (curr_time - this.last_time) / 1000;

		/* Cap to avoid the 'spriral of death' */
		if (this.frame_duration > 0.25)
			this.frame_duration = 0.25;

		this.last_time = curr_time;

		this.accumulator += this.frame_duration;

		while (this.accumulator >= this.timestep) {

			this.local_tick += 1;
			if (this.remote_tick >= 0) {
				this.remote_tick += 1;
			}

			if (this.game_type == g.TYPE_AI && this.game.status == g.STATUS_ACTIVE && this.game.particle_pool.get_n_actives() === 0) {
				let input = this.ai.refresh(this.game, this.timestep);
				this.input.create_input(g.ID_PLAYER2, input);
			}

			this.input.process_inputs(this.game_id, this.game, this.local_tick);

			if (this.game_type != g.TYPE_REMOTE) {
				this.game.update(this.timestep);

				if (this.game.status === g.STATUS_ENDED) {
					this.save_game_result();
					if (this.game_type === g.TYPE_TOURNY) {
						this.game.status = g.STATUS_QUIT;
					}
				}

				this.snapshot.save_state(this.game, this.local_tick);
			}

			this.accumulator -= this.timestep;
		}

		if (this.game.status === g.STATUS_QUIT) {
			await this.game_destroy();
			return;
		}

		let alpha = undefined;
		let interpolated_snapshots = undefined;
		if (this.game_type === g.TYPE_REMOTE) {
			interpolated_snapshots = this.snapshot.get_interpolated_snapshots(this.remote_tick);
			alpha = (this.remote_tick - interpolated_snapshots[0].tick) / (interpolated_snapshots[1].tick - interpolated_snapshots[0].tick);
		} else {
			interpolated_snapshots = this.snapshot.get_interpolated_snapshots(-1);
			alpha = this.accumulator / this.timestep;
		}

		if (this.game_type === g.TYPE_REMOTE) {
			this.sound.process_sound_events(this.remote_tick);
		} else {
			this.handle_events(this.game);
		}
		this.graphics.interpolate(interpolated_snapshots[0], interpolated_snapshots[1], alpha);
		this.graphics.render(this.game_type);
	}

	handle_events(game) {
		if (game.collision_happened) {
			game.collision_happened = false;
			this.sound.play_hit_sound();
		}
		if (game.victory_happened) {
			game.status = g.STATUS_ENDED;
			game.victory_happened = false;
			this.sound.play_victory_sound();
		}
		if (game.score_happened) {
			game.score_happened = false;
			this.sound.play_score_sound();
		}
	}

	save_game_result() {
		if (this.game_result.length === 0) {
			var game = "local";
			var tourney_game = false;
			if (this.game_type === g.TYPE_REMOTE) {
				game = "remote";
			} else if (this.game_type === g.TYPE_AI) {
				game = "ai";
			} else if (this.game_type === g.TYPE_TOURNY) {
				game = "tournament";
				tourney_game = true;
			}

			var winner = this.aliases[1];
			var loser = this.aliases[0];
			if (this.game.scores[0] > this.game.scores[1]) {
				winner = this.aliases[0];
				loser = this.aliases[1];
			}
			var result = "Defeat";
			if (winner === this.aliases[0]) {
				result = "Victory";
			}

			this.game_result = {
				"player1": this.aliases[0],
				"game_type": game,
				"opponent": this.aliases[1],
				"player_score": this.game.scores[0],
				"opponent_score": this.game.scores[1],
				"winner": winner,
				"loser": loser,
				"result": result,
				"tourney_game": tourney_game,
			}
		}
	}

	async game_create(type) {

		if (this.game && this.game_type === type) {
			window.client.nextPage("game-div");
			return;
		}
		document.addEventListener('keydown', this.key_handler_func);
		document.addEventListener('keyup', this.key_handler_func);

		this.game_type = type;
		if (type === g.TYPE_TOURNY && localStorage.getItem('tournament-game-p1') && localStorage.getItem('tournament-game-p2')) {
			this.aliases[0] = localStorage.getItem('tournament-game-p1');
			this.aliases[1] = localStorage.getItem('tournament-game-p2');
		} else if (type === g.TYPE_LOCAL || type === g.TYPE_AI) {
			this.aliases[0] = document.getElementById('banner-nickname-display').textContent;
			if (type === g.TYPE_LOCAL) {
				this.aliases[1] = "Player 2";
			} else if (type === g.TYPE_AI) {
				this.aliases[1] = "AI";
			}
		}

		document.getElementById('game-div-p1').textContent = this.aliases[1];
		document.getElementById('game-div-p2').textContent = this.aliases[0];

		try {
			if (this.game_type === g.TYPE_REMOTE) {
				await this.send_game_creation_request();

				const token = localStorage.getItem("jwt");
				const url = `https://` + window.location.host + '/game' + `/${this.game_id}/?token=${encodeURIComponent(token)}`;
				this.event_source = new EventSource(url);
				this.event_source.onmessage = async (event) => {
					try {
						const data = JSON.parse(event.data);
						if (!data) {
							console.error(event);
							throw new Error('Data is `null`.');
						} else if (data === "Game has ended.") {
							throw new Error('Player has disconnected.');
						} else if (data[1] == 4) {
							throw new Error('Game finished');
						} else {
							this.latest_server_tick = data[0];
							this.update_remote_tick()
							this.snapshot.save_server_data(data);
							this.sound.create_sound_events(data[5], data[8]);
						}

					} catch (error) {
						this.event_source.close();
						await this.game_destroy();
						if (error.message === 'Player has disconnected.')
							alert("Player has disconnected, the game has been ended.");
						else if (error.message === 'Game finished') {
							alert("The game has ended.");
							return ;
						}
						else
							console.error('EventSource failed:', error);
					}
				}

				this.event_source.onerror = (error) => {
					console.error('EventSource failed:', error);
					this.event_source.close();
					this.game_destroy();
				};
			}
		}
		catch (error) {
			console.error(error);
			alert("An error occured when creating the game.");
			this.game_destroy();
			return;
		}

		this.sound.play_music();
		this.game = new game.Game();
		window.client.nextPage("game-div");
		this.request_id = requestAnimationFrame(this.update_loop.bind(this));
	}

	async game_destroy() {
		document.removeEventListener('keyup', this.key_handler_func);
		document.removeEventListener('keydown', this.key_handler_func);
		this.sound.stop_music();
		cancelAnimationFrame(this.request_id);
		if (this.game_type === g.TYPE_TOURNY && this.game_result.length != 0) {
			await this.tourneyHistory();
		} else {
			window.client.home();
		}
		this.reset();
	}

	game_delete() {
		document.removeEventListener('keyup', this.key_handler_func);
		document.removeEventListener('keydown', this.key_handler_func);
		this.sound.stop_music();
		cancelAnimationFrame(this.request_id);
		if (this.event_source) {
			this.event_source.close();
		}
		this.reset();
	}

	async send_game_creation_request() {
		const token = localStorage.getItem("jwt");
		const response = await fetch('https://' + window.location.host + '/game/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
				'X-CSRFToken': window.client.get_cookie('csrftoken'),
			},
			credentials: 'include',
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Network response was not ok.');
		}

		this.game_id = data.id
	}

	async tourneyHistory() {

		const url1 = '/game/pongHistory/';
		const response1 = await Oauth.poster(url1, window.client.game_manager.game_result);
		if (response1.error) {
			console.error(response1.error);
			return ;
		}

		const url = '/game/tournament/';
		const data = {
			game_round: localStorage.getItem('tournament-round'),
			game_id: response1.game_id,
			tourney_id: this.tourney_id,
		}

		const response = await Oauth.poster(url, data);
		if (response.error) {
			console.error(response.error);
		} else {
			this.tourney_id = response.tourney_id;
		}

		if (localStorage.getItem('tournament-round') === "1") {
			await window.client.tournament.secondGame(this.game_result['winner'], this.game_result['loser']);
		} else if (localStorage.getItem('tournament-round') === "2") {
			await window.client.tournament.finalGame(this.game_result['winner'], this.game_result['loser']);
		} else if (localStorage.getItem('tournament-round') === "3") {
			await window.client.tournament.sendToBlockchain(this.tourney_id);
			await window.client.tournament.displayWinner(this.game_result['winner'], this.game_result['loser']);
			this.tourney_id = undefined;
		}
	}
}
