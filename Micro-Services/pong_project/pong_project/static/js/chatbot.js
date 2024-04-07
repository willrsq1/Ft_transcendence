import { poster } from "./Oauth.js";

export class Chatbot {
	constructor() {}

	eventlisteners() {
		document.getElementById('chatbot-button').addEventListener('click', () => window.client.nextPage("chatbot"));
		document.getElementById('OPENai').addEventListener('submit', (event) => this.chatgpt(event));
	}
	
	async chatgpt(event) {
		event.preventDefault();
		const url = '/auth/chatgpt/';
		const data = {
			'question': document.getElementById('OpenAIquestion').value,
		};
		document.getElementById('OpenAIquestion').value = '';

		const response = await poster(url, data);
		if (response.error) {
			console.warn(response.error);
			return ;
		}

		document.getElementById('howcan').textContent = response.response;
	}
}