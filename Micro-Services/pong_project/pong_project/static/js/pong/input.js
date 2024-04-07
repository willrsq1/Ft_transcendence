import * as g from './global.js';
import * as Oauth from '../Oauth.js';

class Input {
	constructor(player_id, input_id) {
		this.sent = false;
		this.timestamp = 0;
		this.input_id = input_id;
		this.player_id = player_id;
	}
}

export class InputManager {
	constructor() {
		/* The timestamp of the last input processed by the server */
		this.last_ack_timestamp = 0;
		/* The timestamp of the last input sent to the server */
		this.last_sent_timestamp = 0;
		this.keyboard_state = {};
		this.input_queue = [];
		this.init();
	}

	init() {
		this.keyboard_state['a'] = false;
		this.keyboard_state['s'] = false;
		this.keyboard_state['k'] = false;
		this.keyboard_state['l'] = false;
		this.keyboard_state['Escape'] = false;
		this.keyboard_state[' '] = false;
	}

	create_input(player_id, input_id) {
		this.input_queue.push(new Input(player_id, input_id));
	}

	send_inputs_to_server(game_id) {
		for (let i = 0; i < this.input_queue.length; i++) {
			const input = this.input_queue[i];
			if (input.sent)
				continue;
			input.sent = true;
			this.send_user_input(game_id, input.input_id, input.timestamp);
		}
	}

	apply_inputs_to_game(game) {
		this.input_queue.forEach((input) => {
			let player = (input.player_id === g.ID_PLAYER1 ? game.player1 : game.player2);
			switch (input.input_id) {
				case g.INPUT_NEUTRAL:
					player.velocity.x = 0;
					break;
				case g.INPUT_LEFT:
					player.velocity.x = -g.PADDLE_SPEED;
					break;
				case g.INPUT_RIGHT:
					player.velocity.x = g.PADDLE_SPEED;
					break;
				case g.INPUT_SPACE:
					if (game.status === g.STATUS_ACTIVE || game.status === g.STATUS_PAUSED) {
						game.status = (game.status === g.STATUS_ACTIVE ? g.STATUS_PAUSED : g.STATUS_ACTIVE);
					} else if (game.status === g.STATUS_ENDED) {
						const url = '/game/pongHistory/';
						Oauth.poster(url, window.client.game_manager.game_result);
						window.client.game_manager.game_result = [];
						game.reset();
					}
					break;
				case g.INPUT_QUIT:
					game.status = g.STATUS_QUIT;
					const url = '/game/pongHistory/';
					Oauth.poster(url, window.client.game_manager.game_result);
					break;
			}
		});
	}

	process_inputs(game_id, game, timestamp) {

		for (let i = 0; i < this.input_queue.length; i++) {
			this.input_queue[i].timestamp = timestamp;
		}

		if (game_id) {
			this.send_inputs_to_server(game_id);
		} else {
			this.apply_inputs_to_game(game);
		}
		this.input_queue = [];
	}

	get_input_id(key_name) {
		switch (key_name) {
			case 'a':
				return g.INPUT_LEFT
			case 'k':
				return g.INPUT_LEFT
			case 's':
				return g.INPUT_RIGHT
			case 'l':
				return g.INPUT_RIGHT
			case ' ':
				return g.INPUT_SPACE
			case 'Escape':
				return g.INPUT_QUIT
			default:
				return -1;
		}
	}

	key_handler(event, bouton_action, button_key) {
		const relevant_keys = ['a', 's', 'k', 'l', ' ', 'Escape'];
		let type = bouton_action;
		let key = button_key;
		if (event && event.key && event.type) {
			key = event.key;
			type = event.type;
		}

		if (!relevant_keys.includes(key)) {
			return;
		}
		let player_id = key === 'a' || key === 's' || key === ' ' || key === 'Escape' ? g.ID_PLAYER1 : g.ID_PLAYER2;

		if (type === 'keydown') {
			if (!this.keyboard_state[key]) {
				this.keyboard_state[key] = true;
				let input_id = this.get_input_id(key);
				this.create_input(player_id, input_id);
			}
		} else if (type === 'keyup') {
			this.keyboard_state[key] = false;
			let opposite_key = 0;
			if (player_id == g.ID_PLAYER1) {
				opposite_key = key === 'a' ? 's' : 'a';
			} else {
				opposite_key = key === 'k' ? 'l' : 'k';
			}
			if (this.keyboard_state[opposite_key]) {
				let input_id = this.get_input_id(opposite_key);
				this.create_input(player_id, input_id);
			} else {
				this.create_input(player_id, g.INPUT_NEUTRAL);
			}
		}
	}

	async send_user_input(game_id, input, timestamp) {
		const token = localStorage.getItem("jwt");
		const url = 'https://' + window.location.host + `/game/${game_id}/`;
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'X-CSRFToken': window.client.get_cookie("csrftoken"),
				},
				credentials: 'include',
				body: JSON.stringify([input, timestamp]),
			});

			if (!response.ok) {
				throw new Error(response.statusText);
			}
		} catch (error) {
			console.error('Error sending input:', error);
		}
	}
}
