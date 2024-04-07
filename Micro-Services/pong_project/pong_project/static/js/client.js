import * as g from './pong/global.js';
import * as profile from './profile.js';
import * as Oauth from './Oauth.js';
import * as game_manager from './pong/game_manager.js';
import * as sound from './pong/sound.js';
import * as connection from './connection.js';
import * as chatbot from './chatbot.js';
import * as janken from './janken.js';
import * as tournament from './tournament.js';

export class Client {

	constructor() {
		//client interface
		this.previous_div = null;
		this.loggedDiv = document.getElementById('isLogged');
		this.notLoggedDiv = document.getElementById('isNotLogged');
		this.logginBanner = document.getElementById('login-banner');
		this.lang = 'en';
		this.game_manager = new game_manager.GameManager();
		this.connection = new connection.Connection();
		this.chatbot = new chatbot.Chatbot();
		this.Oauth = new Oauth.Oauth();
		this.janken = new janken.Janken();
		this.tournament = new tournament.Tournament();
		this.inTournament = false;
	}

	async init() {
		//event listeners
		this.game_manager.eventlisteners(); //game
		this.connection.eventlisteners(); //registration/login/logout
		profile.eventlisteners(); //profile
		this.chatbot.eventlisteners(); //chabot
		this.Oauth.eventlisterners(); //42login
		this.janken.eventlisteners(); //janken
		this.tournament.eventlisteners(); //tournament
		
		//spa and 42login, has to be altogether for f5/redirection/firstload
		if (await this.Oauth.isRedirectedFrom42API() === true) { // redirection from 42 API when trying to connect via 42
			this.Oauth.login42();
		} else if (history.length > 1 && history.state != null) { //reload of the page: SPA PART
			this.divDisplay(history.state.id); //NOT ADDING TO HISTORY IF RELOAD
		} else { //first load of the page
			this.home();		
		}
		
		//history event listener (back/forward buttons)
		window.addEventListener('popstate', async () => {await this.HistoryButtonsClicked();});
		//client event listeners
		document.getElementById('home-banner').addEventListener('click', () =>  this.home()); //home
		document.getElementById('pong-not-authorized-back').addEventListener('click', () => this.nextPage('play'));
		document.getElementById('tournament-display-not-authorized-back').addEventListener('click', () => this.home());
		document.getElementById('unauthorized-button').addEventListener('click', () => this.home());
		document.getElementById('play-pong-button').addEventListener('click', () => this.nextPage('play'));
	}
	
	//SHOWS THE DIV + ADDS IT TO HISTORY
	async nextPage(div_to_show) {

		await this.divDisplay(div_to_show);
		this.addToHistory();
	}

	//ONLY SHOWS THE DIV, NO HISTORY ADDING
	async divDisplay(div_to_show) {
	
		const isLogged = await this.connection.isLoggedIn();

		if (isLogged === 'true') {
			await profile.fetchProfileData(div_to_show);
			await this.janken.relaunchGetters();
		}

		if (div_to_show === 'friend-profile') {
			div_to_show = await profile.showFriendInfo();
		}
		
		if (div_to_show === 'janken-game' || div_to_show === 'janken-already-played' || div_to_show === 'janken-result' || div_to_show === 'janken-lobby') {
			div_to_show = await this.janken.game_in_progress();
		}

		if (div_to_show === 'janken-history') {
			await this.janken.displayJankenHistory();
		}

		if (div_to_show === 'tournament-history') {
			await this.tournament.tourneyHistoryDisplay();
		}

		if (div_to_show !== 'game-div') {
			this.game_manager.game_delete();
		}

		if (div_to_show === 'pong-history') {
			await profile.getPongHistory();
		}

		if (div_to_show === 'game-div' && this.game_manager.game === null) {
			div_to_show = 'pong-not-authorized';
		}

		if (div_to_show.includes('tournament-display') && this.inTournament === false) {
			div_to_show = 'tournament-display-not-authorized';
		}

		div_to_show = this.authorisationCheck(isLogged, div_to_show);
			
		if (this.previous_div) //hides previous div
			this.previous_div.style.display = 'none';
			
		if (this.previous_div && this.previous_div.id == 'friend-profile') {
			document.getElementById('friend-profile-history-list').style.display = 'none';
		}
		
		if (window.innerWidth < 1000 && div_to_show == 'game-div') //if window is too small, zoom out (for mobiles
			document.body.style.zoom = '80%'; //reset zoom
		else
			document.body.style.zoom = '100%'; //reset zoom

		document.getElementById('loading').style.display = 'none'; //hides loading div

		let div = document.getElementById(div_to_show);
		div.style.display = 'block';

		this.previous_div = div;
	}

	//to check if this div is allowed to be shown (example: you log out and try to access a logged in div)
	authorisationCheck(isLogged, div_to_show) {
		let childDivs = null;
		if (isLogged === 'true') {
			childDivs = this.loggedDiv.querySelectorAll('div');
		} else {
			childDivs = this.notLoggedDiv.querySelectorAll('div');
		}
		let canBeShown = false;
		childDivs.forEach(childDiv => {
			if (childDiv.id === div_to_show) {
				canBeShown = true;
			}
		});

		if (canBeShown === false ) {
			div_to_show = 'unauthorized';
			document.getElementById('unauthorized').querySelector('p').textContent = 'Unauthorized: ' + (isLogged === 'true' ? 'you are already logged in.' : 'you need to be logged in to see this page.');
		}

		this.sectionDisplay(isLogged);

		return (div_to_show);
	}

	// If user is Logged, displays the logged divs and the banner elements, otherwise displays the not logged divs
	sectionDisplay(isLogged) {
		if (isLogged === 'true') {
			this.loggedDiv.style.display = 'block';
			this.logginBanner.style.display = 'block';
			this.notLoggedDiv.style.display = 'none';
		} else {
			this.loggedDiv.style.display = 'none';
			this.logginBanner.style.display = 'none';
			this.notLoggedDiv.style.display = 'block';
		}
	}

	// HISTORY FUNCTIONS
	// TO PUT THE DIV IN THE HISTORY FOR BACK AND FORWARD BUTTON EVENTS
	addToHistory() {
	
		let div = this.previous_div;
		if (div === null) {
			return ;
		}

		if (history.state !== null) {
			if (div.id === 'friend-profile') {
				history.pushState({id: div.id, friend_nickname: localStorage.getItem('friend_nickname')}, '', '');
				localStorage.removeItem('friend_nickname');
			} else {
				history.pushState({id: div.id}, '', '');
			}
		} else {
			history.replaceState({id: div.id}, '', '');
		}
	}
	
	//for BACK and FORWARD buttons
	async HistoryButtonsClicked() {

		if (history.state === null) {
			return ;
		}
		await this.divDisplay(history.state.id);
	}
	

	// HOME BUTTON FUNCTION
	async home() {

		if (await this.connection.isLoggedIn() === 'true') {
			this.nextPage("logged-in-home");
		} else {
			this.nextPage("not-logged-home");
		}
	}
	
	//COOKIE FUNCTION
	get_cookie(name) {
		let cookie_value = null;
		if (document.cookie && document.cookie !== '') {
			const cookies = document.cookie.split(';');
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i].trim();
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookie_value = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookie_value;
	}

}
