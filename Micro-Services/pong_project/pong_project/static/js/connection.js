import * as Oauth from './Oauth.js';

export class Connection {

	constructor() {
	}

	eventlisteners() {
		document.getElementById('login-button').addEventListener('click', () => window.client.nextPage("Login"));
		document.getElementById('register-button').addEventListener('click', () => window.client.nextPage("Register"));
		document.getElementById('loginForm').addEventListener('submit', (event) => this.login_user_request(event));
		document.getElementById('registerForm').addEventListener('submit', (event) => this.register_user_request(event));
		document.getElementById('logout-button').addEventListener('click', (event) => this.logout_user_request(event));
	}


	async login_user_request(event) {
		if (event)
			event.preventDefault()
		const url = '/auth/login/';
		const data = {
			username: document.getElementById('username_login').value,
			password: document.getElementById('password_login').value,
		};
		const response = await Oauth.poster(url, data);
		
		document.getElementById('username_login').value = '';
		document.getElementById('password_login').value = '';

		if (response.error) {
			alert(response.error);
			return ;
		}
		localStorage.setItem('jwt', response.token);
		window.client.home();
	}

	
	async register_user_request(event) {
		event.preventDefault()
		const url = '/auth/register/';
		const data = {
			username: document.getElementById('username_register').value,
			password1: document.getElementById('password1_register').value,
			password2: document.getElementById('password2_register').value,
			email: document.getElementById('email_address_register').value,
			first_name: document.getElementById('first_name_register').value,
		};
		const response = await Oauth.poster(url, data);
		
		document.getElementById('username_login').value = document.getElementById('username_register').value;
		document.getElementById('password_login').value = document.getElementById('password1_register').value;
		
		document.getElementById('username_register').value = '';
		document.getElementById('password1_register').value = '';
		document.getElementById('password2_register').value = '';
		document.getElementById('email_address_register').value = '';
		document.getElementById('first_name_register').value = '';

		if (response.error) {
			alert(response.error);
			return ;
		}
		alert('Registration was successful');
		this.login_user_request();
	}

	async logout_user_request(event) {
		if (event)
			event.preventDefault()
		const url = '/auth/logout/'
		const response = await Oauth.getter(url);

		if (response.error) {
			alert(response.error);
			return ;
		}

		localStorage.removeItem('jwt');
		window.client.home();
	}

	async isLoggedIn() {
		const url = '/auth/check-authentication/';
		const response = await Oauth.getter(url);
		if (response.error) {
			return 'false';
		}
		return 'true';
	}
}