export class Oauth {
	constructor() {
		this.code = null;
	}
	
	eventlisterners() {
		document.getElementById('42-login-button').addEventListener('click', () => this.RedirectTo42Login());
	}
	
	async RedirectTo42Login()
	{
		const url = '/auth/OAuthRedirectUrl/';
		const response = await getter(url);
		if (response.error) {
			return ;
		}
		window.addEventListener('pageshow', this.redirHandlerPageshow);
		window.addEventListener('unload', this.redirHandlerUnload);

		response.uri = response.uri.replace('localhost:8443', window.location.host)
		window.location.href = response.uri;
		// Now the user will be redirected to the 42 login page, which will proc isRedirectedFrom42API() in the listners !
		// isRedirectedFrom42API() will be triggered because the url will contain the code and state parameters
	}

	async isRedirectedFrom42API() {
		const urlParams = new URLSearchParams(window.location.search);
		this.code = urlParams.get('code');
		const state = urlParams.get('state');
		if (this.code && state) {
			if (await this.isValidState(state) !== true) {
				this.code = null;
				console.error('Invalid state gotten from the redirection ! This is not a valid redirection from 42. Not authorising the connection.');
				return false;
			}
			document.getElementById('loading').textContent = "Redirecting through 42";
			return true;
		} else {
			this.code = null;
			return false;
		}
	}
	
	//mini main
	async login42() { // if step2 == true -> procs this: step3 that calls the 3 next functions to effectively log in
		await this.obtainUserAccessToken();
		const authForm = await this.CreateUserAndGetHisIDs();
		if (authForm === null) {
			console.error('Error while trying to get the username and password from the backend');
			return ;
		}
		await this.LogTheUserIn(authForm);
		
	}
	
	async obtainUserAccessToken() { //first step that get a specific user token, stored temporarily in the backend
		const url = '/auth/login42/';
		const data = {
			'code': this.code,
		};
		this.code = null;
		await poster(url, data);
	}
	
	async CreateUserAndGetHisIDs() {
		const url = '/auth/login42/'
		const response = await getter(url);
		if (response.error) {
			alert(response.error);
			return null;
		}
		return response;
	}
	
	async LogTheUserIn(data) {
		data['is42'] = true;
		const url = '/auth/login/';
		const response = await poster(url, data);
		if (response.error) {
			window.client.nextPage('not-logged-home');
			return ;
		}
		localStorage.setItem('jwt', response.token);
		window.history.replaceState({id: 'logged-in-home'}, '', 'https://' + window.location.host);
		window.client.divDisplay('logged-in-home');
	}
	
	//UTILS

	//checks the state gotten from the redirection post login on 42 website (identity check)
	async isValidState(state) {
		const url = '/auth/OAuthVerifyState/';
		const data = {
			'state': state,
		};
		const response = await poster(url, data);
		if (response.error) {
			return false;
		}
		return true;
	}
	
	//handlers for back/forward buttons after redirection
	redirHandlerUnload() {
		window.removeEventListener('unload', redirHandlerUnload);
		window.client.divDisplay("loading");
	}
	
	redirHandlerPageshow() {
		window.removeEventListener('pageshow', redirHandlerPageshow);
		window.client.divDisplay(history.state.id);
	}
}

export async function getter(url) {
	url = 'https://' + window.location.host + url;
	try {
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${localStorage.getItem("jwt")}`,
				'Content-Type': 'application/json',
				'X-CSRFToken': window.client.get_cookie("csrftoken"),
			},
			credentials: 'include',
		});
		const rep = await response.json();
		
		if (rep.error) {
			throw new Error(rep.error);
		}
		return rep;
	}
	catch (error) {
		// console.error(error);
		return {'error': error};
	}
}

export async function poster(url, data) {
	url = 'https://' + window.location.host + url;
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem("jwt")}`,
				'Content-Type': 'application/json',
				'X-CSRFToken': window.client.get_cookie("csrftoken"),
			},
			credentials: 'include',
			body: JSON.stringify(data),
		});
		const rep = await response.json();

		if (rep.error) {
			throw new Error(rep.error);
		}		
		return rep;
	}
	catch (error) {
		// console.error(error);
		return {'error': error};
	}
}

