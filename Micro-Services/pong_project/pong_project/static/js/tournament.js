import * as Oauth from './Oauth.js';

export class Tournament {

	constructor() {}

	eventlisteners() {
		document.getElementById('tournament-button').addEventListener('click', () => window.client.nextPage('tournament-lobby'));
		document.getElementById('tournament-nicknames-form').addEventListener('submit', (event) => this.createTournament(event));
		document.getElementById('tournament-game-start-button').addEventListener('click', () => window.client.game_manager.game_create(3));
		document.getElementById('tournament-game-start-button-round2').addEventListener('click', () => window.client.game_manager.game_create(3));
		document.getElementById('tournament-game-start-button-final').addEventListener('click', () => window.client.game_manager.game_create(3));
		document.getElementById('tournament-back-to-menu').addEventListener('click', () => window.client.nextPage('tournament-lobby'));
		document.getElementById('profile-tournament-history').addEventListener('click', () => window.client.nextPage('tournament-history'));
		document.getElementById('blockchain-link').addEventListener('click', function(event) {
			event.preventDefault();
			window.open(document.getElementById('blockchain-link').href, '_blank');
		});
	}

	async sendToBlockchain(tourney_id) {
		const url = '/game/tourneyHistory/';
		const data = {
			tourney_id: tourney_id
		}
		const response = await Oauth.poster(url, data);
		if (response.error) {
			alert(response.error);
			return ;
		}
		console.log(response.games[0]);
		const urlBlockchain = '/tournament/saveTournament/';
		const responseBlock = await Oauth.poster(urlBlockchain, response.games[0]);
		if (responseBlock.error) {
			alert(responseBlock.error);
			return ;
		}
		console.log(responseBlock);

		const urlTx = '/game/tourneyBlockchainKey/'
		const dataTx = {
			tourney_id: tourney_id,
			tx: responseBlock.tx
		}
		const responseTx = await Oauth.poster(urlTx, dataTx);
		console.log(responseTx);
	}
	
	async tourneyHistoryDisplay() {
		const url = '/game/tournament/';
		const response = await Oauth.getter(url);
		const lang = window.client.lang;
	
		if (response.error) {
			return ;
		}
		document.getElementById('blockchain-link').style.display = 'block';
		var div = document.getElementById('tournament-history-list');
		div.textContent = "";
		const limit = response.history.length > 10 ? response.history.length - 10 : 0;
		for (var i = response.history.length - 1; i >= limit; i--) {
			var p = document.createElement('p');
			var p2 = document.createElement('p');
			if (lang == 'fr') {
				p.textContent = "Tournoi avec l'id " + response.history[i].id + " avec les joueurs: " + response.history[i].player1 + ", " + response.history[i].player2 + ", " + response.history[i].player3 + " et " + response.history[i].player4 + ".";
				p2.textContent = "Vainqueur: " + response.history[i].winner;
			} else if (lang == 'es') {
				p.textContent = "Torneo con id " + response.history[i].id + " con los jugadores: " + response.history[i].player1 + ", " + response.history[i].player2 + ", " + response.history[i].player3 + " y " + response.history[i].player4 + ".";
				p2.textContent = "Ganador: " + response.history[i].winner;
			} else {
				p.textContent = "Tournament with id " + response.history[i].id + " with the players: " + response.history[i].player1 + ", " + response.history[i].player2 + ", " + response.history[i].player3 + " and " + response.history[i].player4 + ".";
				p2.textContent = "Winner: " + response.history[i].winner;
			}
			div.appendChild(p);
			p.appendChild(p2);
			var link = document.createElement('a');

			p.style.height = "auto";
			p.style.width = "80%"
			p.style.border = "1px solid #ccc";
			p.style.borderRadius = "30px";
			p.style.padding = "10px";
			const responseTx = await Oauth.poster('/game/tourneyTx/', {'tourney_id': response.history[i].id})
			var tx = 'error';
			console.log(responseTx);
			if (responseTx.message)
			{
				tx = responseTx.tx;
			}	
            link.href = 'https://sepolia.arbiscan.io/tx/' + tx + '#eventlog';
			console.log(link.href);
			if (lang == 'fr')
            	link.textContent = 'Cliquez ici pour aller à cette URL';
			else if (lang == 'es')
				link.textContent = 'Clicar to el URL';
			else
				link.textContent = 'Click here to go to URL'

            
			p.appendChild(link);
			link.style.backgroundColor = "white";
		}
	}
	
	async displayWinner(winnerFinal, loserFinal) {
		document.getElementById('tournament-display-final-winner').textContent = winnerFinal;
		document.getElementById('tournament-display-final-loser').textContent = loserFinal;

		await window.client.nextPage('tournament-display-winner');
		window.client.inTournament = false;
		localStorage.removeItem('tournament-game-p1');
		localStorage.removeItem('tournament-game-p2');
		localStorage.removeItem('tournament-round');
	}

	async finalGame(winnerGame2, loserGame2) {
		document.getElementById('tournament-display-second-match-winner').textContent = winnerGame2;
		document.getElementById('tournament-display-second-match-loser').textContent = loserGame2;
		document.getElementById('tournament-display-final-p1').textContent = localStorage.getItem('tournament-winner-game1');
		document.getElementById('tournament-display-final-p2').textContent = winnerGame2;

		localStorage.setItem('tournament-game-p1', localStorage.getItem('tournament-winner-game1')); //get ids in game through this
		localStorage.setItem('tournament-game-p2', winnerGame2);

		localStorage.setItem('tournament-round', 3);
		localStorage.removeItem('tournament-winner-game1');
		await window.client.nextPage('tournament-display-final');
	}

	//call this when 1st game ends
	async secondGame(winnerGame1, loserGame1) {
		document.getElementById('tournament-display-first-match-winner').textContent = winnerGame1;
		document.getElementById('tournament-display-first-match-loser').textContent = loserGame1;
		document.getElementById('tournament-display-round2-p1').textContent = localStorage.getItem('tournament-p3');
		document.getElementById('tournament-display-round2-p2').textContent = localStorage.getItem('tournament-p4');
		localStorage.setItem('tournament-winner-game1', winnerGame1);
		
		localStorage.setItem('tournament-game-p1', localStorage.getItem('tournament-p3')); //get ids in game through this
		localStorage.setItem('tournament-game-p2', localStorage.getItem('tournament-p4'));

		localStorage.removeItem('tournament-p3');
		localStorage.removeItem('tournament-p4');
		localStorage.setItem('tournament-round', 2);

		await window.client.nextPage('tournament-display-round2');
	}


	async createTournament(event) {
		if (event)
			event.preventDefault();
		const data = [
			document.getElementById('tournament-host-nickname').innerText,
			document.getElementById('tournament-player-2').value,
			document.getElementById('tournament-player-3').value,
			document.getElementById('tournament-player-4').value,
		]

		document.getElementById('tournament-host-nickname').value = '';
		document.getElementById('tournament-player-2').value = '';
		document.getElementById('tournament-player-3').value = '';
		document.getElementById('tournament-player-4').value = '';
		
		if (data[0] == data[1] || data[0] == data[2] || data[0] == data[3] || data[1] == data[2] || data[1] == data[3] || data[2] == data[3]) {
			await window.client.home();
			if (window.client.lang == 'en')
				alert('Nicknames must be unique');
			else if (window.client.lang == 'fr')
				alert('Les pseudos doivent être uniques');
			else if (window.client.lang == 'es')
				alert('Los apodos deben ser únicos');
			return;
		}

		this.shuffleArray(data);

		document.getElementById('tournament-display-p1').textContent = data[0];
		document.getElementById('tournament-display-p2').textContent = data[1];
		document.getElementById('tournament-display-p3').textContent = data[2];
		document.getElementById('tournament-display-p4').textContent = data[3];

		localStorage.setItem('tournament-p3', data[2]);
		localStorage.setItem('tournament-p4', data[3]);

		localStorage.setItem('tournament-game-p1', data[0]);  //get ids in game through this
		localStorage.setItem('tournament-game-p2', data[1]);
		localStorage.setItem('tournament-round', 1);

		window.client.inTournament = true;
		window.client.nextPage('tournament-display-start');

	}
	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

}