import * as Oauth from './Oauth.js';
import { getNicknameWithUserId } from './profile.js';

export class Janken {
	constructor() {
		this.inJankenGame = false;
	}
	
	eventlisteners() {
		document.getElementById('janken-button').addEventListener('click', () => window.client.nextPage('janken')); //janken
		document.getElementById('janken-create-game-button').addEventListener('click', () => this.create_game());
		document.getElementById('janken-join-game-button').addEventListener('click', () => this.join_game());
		document.getElementById('rock-button').addEventListener('click', () => this.play('rock'));
		document.getElementById('paper-button').addEventListener('click', () => this.play('paper'));
		document.getElementById('scissors-button').addEventListener('click', () => this.play('scissors'));
		document.getElementById('janken-cancel-game').addEventListener('click', () => this.cancel_game());
		document.getElementById('janken-game-in-progress-button').addEventListener('click', () => client.nextPage('janken-game'));
		document.getElementById('janken-already-played-back').addEventListener('click', () => client.nextPage('janken'));
		document.getElementById('janken-lobby-back').addEventListener('click', () => client.nextPage('janken'));
		document.getElementById('janken-game-back').addEventListener('click', () => client.nextPage('janken'));
		document.getElementById('janken-result-back').addEventListener('click', () => client.nextPage('janken'));
		document.getElementById('janken-history-back').addEventListener('click', () => client.nextPage('janken'));
		document.getElementById('janken-history-back-to-profile').addEventListener('click', () => client.nextPage('profile'));
		document.getElementById('janken-history-button').addEventListener('click', () => client.nextPage('janken-history'));
		document.getElementById('janken-not-authorized-back').addEventListener('click', () => client.nextPage('janken'));
	}
	
	async game_in_progress() {
		const url = '/janken/gameInProgress/'
		const response = await Oauth.getter(url);
		if (response.error) {
			return ('janken-not-authorized');
		}
		if (response.message == 'waiting for opponent') {
			return ('janken-lobby');
		} else if (response.message == 'game in progress') {
			document.getElementById('janken-game-opponent-nickname-nickname').textContent = await getNicknameWithUserId(response.opponent);
			return ('janken-game');
		} else if (response.message == 'already played') {
			document.getElementById('janken-already-played-opponent-nickname').textContent = await getNicknameWithUserId(response.opponent);
			return ('janken-already-played');
		} else if (response.message == 'game finished') {
			await this.displayResults();
			return ('janken-result');
		}
	}

	async create_game() {
		const url = '/janken/createJankenGame/'
		const response = await Oauth.getter(url);
		if (response.error) {

			if (response.error == "Error: You are already waiting for an opponent") {
				await window.client.nextPage('janken-lobby');
			} else {
				alert(response.error);
			}
			return ;
		}
		await window.client.nextPage('janken-lobby');
		document.getElementById("janken-game-in-progress-button").style.display = "block";
	}

	async join_game() {
		const url = '/janken/jankenGame/'
		const response = await Oauth.getter(url);
		if (response.error) {
			alert(response.error);
			return ;
		}
		await window.client.nextPage('janken-game');
		document.getElementById("janken-game-in-progress-button").style.display = "block";
	}

	async play(choice) {
		const url = '/janken/jankenGame/'
		const data = {
			'input': choice,
		};
		const response = await Oauth.poster(url, data);
		if (response.error) {
			alert(response.error);
			return ;
		}
		await window.client.nextPage('janken-already-played');
	}

	async waitForOpponent() {
		const url = '/janken/waitForOpponent/'
		const response = await Oauth.getter(url);
		if (response.error) {
			if (response.error == "Error: bad jwt") {
				clearInterval(localStorage.getItem('id_interval_game_waiting'));
				localStorage.removeItem('id_interval_game_waiting');
			}
			return ;
		}
		clearInterval(localStorage.getItem('id_interval_game_waiting'));
		localStorage.removeItem('id_interval_game_waiting');
		if (document.getElementById('janken-lobby').style.display != 'none') {
			await window.client.nextPage('janken-game');
		} else {
			alert(await getNicknameWithUserId(response.opponent) + " joined your game !")
			document.getElementById('janken-button').style.setProperty('--display-before', 'flex');
			document.getElementById('janken-game-in-progress-button').style.setProperty('--display-before', 'flex');
		}
	}		
		
	async waitResults() {
		const url = '/janken/waitForResults/'
		const response = await Oauth.getter(url);
		if (response.error) {
			if (response.error == "Error: bad jwt" || response.error == 'Error: You are not part of a game') {
				clearInterval(localStorage.getItem('id_interval_wait_results'));
				localStorage.removeItem('id_interval_wait_results');
			}
			return ;
		}
		clearInterval(localStorage.getItem('id_interval_wait_results'));
		localStorage.removeItem('id_interval_wait_results');
		if (document.getElementById('janken-already-played').style.display != 'none')
			await window.client.nextPage('janken-result');
		else
			alert("The game is finished !")
	}

	async displayResults() {
		
		clearInterval(localStorage.getItem('id_interval_wait_results'));
		localStorage.removeItem('id_interval_wait_results');
		const url = '/janken/getResults/'
		var lang = window.client.lang;
		const response = await Oauth.getter(url);
		if (response.error) {
			alert(response.error);
			return ;
		}
		response.creator = await getNicknameWithUserId(response.creator);
		response.opponent = await getNicknameWithUserId(response.opponent);

		var div = document.getElementById('janken-result-text');
		if (lang == 'fr')
			div.textContent = response.creator + " a joué " + response.creator_choice + " et " + response.opponent + " a joué " + response.opponent_choice + ". ";
		else if (lang == 'en')
			div.textContent = response.creator + " played " + response.creator_choice + " and " + response.opponent + " played " + response.opponent_choice + ". ";
		else if (lang == 'es')
			div.textContent = response.creator + " jugó " + response.creator_choice + " y " + response.opponent + " jugó " + response.opponent_choice + ". ";
		if (response.winner == response.myself) {
			if (lang == 'fr') {
				div.textContent += "Vous " + response.result + " !";
				div.style.backgroundColor = "#98fb98";
			}
			else if (lang == 'en') {
				div.textContent += "You " + response.result + " !";
				div.style.backgroundColor = "#98fb98";
			}
			else if (lang == 'es') {
				div.textContent += "Tu " + response.result + " !";
				div.style.backgroundColor = "#98fb98";
			}
		}
		else if (response.result == "draw") {
			if (lang == 'fr') {
				div.textContent += "C'est une égalité !";
				div.style.backgroundColor = "#fffacd";
			}
			else if (lang == 'en') {
				div.textContent += "It's a draw !";
				div.style.backgroundColor = "#fffacd";
			}
			else if (lang == 'es') {
				div.textContent += "Es un empate !";
				div.style.backgroundColor = "#fffacd";
			}
		} else {
			div.textContent += await getNicknameWithUserId(response.winner) + " " + response.result + " !";
			div.style.backgroundColor = "#ffb6c1";
		}
	}
	
	async cancel_game() {
		const url = '/janken/deleteMyJankenGameCreation/'
		const response = await Oauth.getter(url);
		if (response.error) {
			return ;
		}
		await window.client.nextPage('janken');
		clearInterval(localStorage.getItem('id_interval_game_waiting'));
		localStorage.removeItem('id_interval_game_waiting');
	}

	async relaunchGetters() {
		const url = '/janken/amIPlaying/'
		const response = await Oauth.getter(url);
		if (response.error) {
			document.getElementById("janken-game-in-progress-button").style.display = "none";
			document.getElementById('janken-game-in-progress-button').style.setProperty('--display-before', 'none');
			document.getElementById('janken-button').style.setProperty('--display-before', 'none');
			this.inJankenGame = false;
		} else {
			this.inJankenGame = true;
			if (response.message == 'You are waiting for an opponent') {
				clearInterval(localStorage.getItem('id_interval_game_waiting'));
				localStorage.setItem('id_interval_game_waiting', setInterval(this.waitForOpponent, 1000));
				return ;
			}
			else if (response.message == 'Waiting for your opponent to play'){
				clearInterval(localStorage.getItem('id_interval_wait_results'));
				localStorage.setItem('id_interval_wait_results', setInterval(this.waitResults, 1000));
			}
				document.getElementById('janken-game-in-progress-button').style.setProperty('--display-before', 'flex');
				document.getElementById('janken-button').style.setProperty('--display-before', 'flex');
		}
	}

	async displayJankenHistory() {
		const url = '/janken/jankenHistory/'
		var div = document.getElementById('janken-history-list');
		div.textContent = "";
		var lang = window.client.lang;
		const response = await Oauth.getter(url);
		if (response.error) {
			document.getElementById('janken-history-wins').textContent = 0;
			document.getElementById('janken-history-draws').textContent = 0;
			document.getElementById('janken-history-losses').textContent = 0;
			if (lang == 'fr') {
				document.getElementById('janken-history-winrate-display').textContent = "Pas de winrate à afficher";
				document.getElementById('janken-history-most-played-choice').textContent = "Jamais joué";
			}
			else if (lang == 'en') {
				document.getElementById('janken-history-winrate-display').textContent = "No winrate to display";
				document.getElementById('janken-history-most-played-choice').textContent = "Never played";
			}
			else if (lang == 'es') {
				document.getElementById('janken-history-winrate-display').textContent = "No hay winrate para mostrar";
				document.getElementById('janken-history-most-played-choice').textContent = "Nunca jugado";
			}
			return ;
		}
		var owner = document.getElementById('banner-nickname-display').textContent;
		const limit = response.history.length > 10 ? response.history.length - 10 : 0;
		for (var i = response.history.length - 1; i >= limit; i--) {
			var p = document.createElement('p');
			var p2 = document.createElement('p');
			var p3 = document.createElement('p');
			response.history[i].owner = owner;
			response.history[i].opponent = await getNicknameWithUserId(response.history[i].opponent);
			if (lang == 'fr') {
				p.textContent = response.history[i].owner + " a joué ";
				p.textContent += response.history[i].owner_choice + (response.history[i].owner_choice == "None" ? "(Forfeit)" : "");
				p.textContent += " et " + response.history[i].opponent + " a joué ";
				p.textContent += response.history[i].opponent_choice + (response.history[i].opponent_choice == "None" ? "(Forfeit)" : "") + ". ";
				p2.textContent += "Résultat: " + response.history[i].result + ". ";
				p3.textContent += "Partie terminée le " + response.history[i].end_day + " à " + response.history[i].end_time + ".";
			}
			else if (lang == 'en') {
				p.textContent = response.history[i].owner + " played ";
				p.textContent += response.history[i].owner_choice  + (response.history[i].owner_choice == "None" ? "(Forfeit)" : "");
				p.textContent += " and " + response.history[i].opponent + " played ";
				p.textContent += response.history[i].opponent_choice + (response.history[i].opponent_choice == "None" ? "(Forfeit)" : "") + ". ";
				p2.textContent += "Result: " + response.history[i].result + ". ";
				p3.textContent += "Game ended the " + response.history[i].end_day + " at " + response.history[i].end_time + ".";
			}
			else if (lang == 'es') {
				p.textContent = response.history[i].owner + " jugó ";
				p.textContent += response.history[i].owner_choice + (response.history[i].owner_choice == "None" ? "(Forfeit)" : "");
				p.textContent += " y " + response.history[i].opponent + " jugó ";
				p.textContent += response.history[i].opponent_choice + (response.history[i].opponent_choice == "None" ? "(Forfeit)" : "") + ".";
				p2.textContent += "Resultado: " + response.history[i].result + ". ";
				p3.textContent += "Juego terminado el " + response.history[i].end_day + " a las " + response.history[i].end_time + ".";
			}
			
			if (response.history[i].result == "Victory") {
				p.style.backgroundColor = "#98fb98";
			}
			else if (response.history[i].result == "draw") {
				p.style.backgroundColor = "#fffacd";
			}
			else {
				p.style.backgroundColor = "#ffb6c1";
			}
			div.appendChild(p);
			
			p.style.height = "auto";
			p.style.width = "80%"
			p.style.border = "1px solid #ccc";
			p.style.borderRadius = "30px";
			p.style.padding = "10px";
			p.appendChild(p2);
			p2.appendChild(p3);
		}
		document.getElementById('janken-history-winrate-display').textContent = response.winrate;
		document.getElementById('janken-history-wins').textContent = response.wins;
		document.getElementById('janken-history-draws').textContent = response.draws;
		document.getElementById('janken-history-losses').textContent =  response.losses;
		document.getElementById('janken-history-most-played-choice').textContent = response.most_played;

	}

}