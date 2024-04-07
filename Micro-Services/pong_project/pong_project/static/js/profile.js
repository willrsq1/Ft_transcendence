import { poster, getter } from './Oauth.js';

export async function eventlisteners() {
		//Profile
	document.getElementById('myprofile-button').addEventListener('click', () => window.client.nextPage("profile"));
	document.getElementById('banner-profile-image-display').addEventListener('click', () => window.client.nextPage("profile"));
	document.getElementById('modify_email').addEventListener('submit', (event) => changeEmail(event));
	document.getElementById('modify_nickname').addEventListener('submit', (event) => changeNickname(event));
	document.getElementById('modify_password').addEventListener('submit', (event) => changePassword(event));
	document.getElementById('modify_profile_picture').addEventListener('submit', (event) => changeProfilePicture(event));
	//friends
	document.getElementById('friends-button').addEventListener('click', (event) => window.client.nextPage("friends"));
	document.getElementById('add-friend-form').addEventListener('submit', (event) => addFriend(event));
	document.getElementById('profile-janken-history-button').addEventListener('click', () => window.client.nextPage('janken-history'));
	document.getElementById('profile-pong-history-button').addEventListener('click', () => window.client.nextPage('pong-history'));
	document.getElementById('pong-history-back').addEventListener('click', () => window.client.nextPage('profile'));
	document.getElementById('friend-not-found-back').addEventListener('click', () => window.client.nextPage('friends'));
	document.getElementById('language-dropdown').addEventListener('change', (event) => langModification(event));
	document.getElementById('friend-history-button').addEventListener('click', () => friendHistoryDisplay());


}

export async function fetchProfileData(div_to_show) {

	const data = await getUserData();
	var lang = window.client.lang;

	if (data.error && data.error == 'Error: No profile for this user') {
		await window.client.connection.logout_user_request();
		if (lang === 'fr')
			alert("Vous n'avez pas de profil utilisateur associé à votre compte, vous avez été déconnecté");
		else if (lang === 'es')
			alert("No tienes un perfil de usuario asociado a tu cuenta, has sido desconectado");
		else if (lang === 'en')
			alert("You don't have a user profile associated to your account, you have been disconnected");
		return ;
	}

    await changeLanguage(data.default_language);

	document.getElementById('banner-nickname-display').innerText = data.nickname;
	document.getElementById('banner-profile-image-display').src = "auth/static/" + data.img;
	document.getElementById('tournament-host-nickname').innerText = data.nickname;
	localStorage.setItem('jwt', data.token);
	
	if (div_to_show === 'profile') {
		document.getElementById('profile-username-display').innerText = data.username;
		document.getElementById('profile-email-display').innerText = data.email;
		document.getElementById('profile-nickname-display').innerText = data.nickname;
		document.getElementById('profile-profile-picture-display').src = "auth/static/" + data.img;
	}
	else if (div_to_show === 'friends')
	{
		await this.show_friendlist();
		await this.showFriendRequests();
	}
	else if (div_to_show === 'logged-in-home')
	{
		document.getElementById('friends-button').setAttribute('data-count', data.notifications);
		if (data.notifications == 0) {
			document.getElementById('friends-button').style.setProperty('--display-before', 'none');
		} else {
			document.getElementById('friends-button').style.setProperty('--display-before', 'flex');
		}
	}
}

export async function getUserData() {
	const url = '/auth/getInfo/';
	return (await getter(url));
}

export async function changeEmail(event) {
	event.preventDefault()
	const url = '/auth/email/';
	const data = {
        email: document.getElementById('email_new').value,
    };

	const response = await poster(url, data);
	document.getElementById('email_new').value = '';

	if (response.error) {
		alert(response.error);
		return ;
	}
	document.getElementById('profile-email-display').textContent = response.email;
}

export async function changeNickname(event) {
	event.preventDefault()
	const url = '/auth/nickname/';
	const data = {
        first_name: document.getElementById('nickname_new').value,
    };
	const response = await poster(url, data);

	document.getElementById('nickname_new').value = '';
	if (response.error) {
		alert(response.error);
		return ;
	}
	document.getElementById('profile-nickname-display').textContent = response.first_name;
	document.getElementById('banner-nickname-display').textContent = response.first_name;

	
}

export async function changePassword(event) { 
	event.preventDefault()

	const url = '/auth/password/';
	const data = {
        password: document.getElementById('password_new').value,
    };
	if (document.getElementById('password_new').value !== document.getElementById('password_new2').value) {

		document.getElementById('password_new').value = '';
		document.getElementById('password_new2').value = '';
		if (window.client.lang === 'fr')
			alert("Les deux mots de passe ne correspondent pas !");
		else if (window.client.lang === 'es')
			alert("Las dos contraseñas no coinciden !");
		else if (window.client.lang === 'en')
			alert("The two passwords do not match !");
		return ;
	}

	document.getElementById('password_new').value = '';
	document.getElementById('password_new2').value = '';
	const response = await poster(url, data);

	var lang = window.client.lang;
	if (response.error) {
		alert(response.error);
		return ;
	}
	await window.client.home();
	if (lang === 'fr')
		alert("Vous avez changé votre mot de passe, veuillez vous reconnecter !");
	else if (lang === 'es')
		alert("Has cambiado tu contraseña, por favor vuelve a conectarte !");
	else if (lang === 'en')
		alert("You have changed your password, please log back in !");
}

export async function changeLanguage(lang) {

	if (lang === window.client.lang) {
		return ;
	}
	window.client.lang = lang;

	var elements = document.querySelectorAll("[data-en]");
	elements.forEach(function(elem) {
		if (lang === 'fr') {
			elem.textContent = elem.getAttribute('data-fr');
		} else if (lang === 'en') {
			elem.textContent = elem.getAttribute('data-en');
		} else if (lang === 'es') {
			elem.textContent = elem.getAttribute('data-es');
		}
	});
	
}

export async function langModification(event) {
	const selectedLanguage = event.target.value;
	
	const response = await updateDefaultLanguage(selectedLanguage);
	
	if (response.error) {
		alert(response.error);
		return ;
	}
	
	await changeLanguage(selectedLanguage);

	if (window.client.previous_div.id == 'friends') {
		await show_friendlist();
		await showFriendRequests();
	}
	if (window.client.previous_div.id == 'friend-profile') {
		await showFriendInfo();
	}
	if (window.client.previous_div.id == 'pong-history') {
		await getPongHistory();
	}
	if (window.client.previous_div.id == 'janken-history') {
		await window.client.janken.displayJankenHistory();
	}
	if (window.client.previous_div.id == 'tournament-history') {
		await window.client.tournament.tourneyHistoryDisplay();
	}
}

export async function updateDefaultLanguage(lang) {

	const url = '/auth/SaveLanguage/';

    const data = {
        language: lang,
    };

    return await poster(url, data);
}



export async function changeProfilePicture(event) {
	event.preventDefault()
	const url = 'https://'  + window.location.host + '/auth/update_profile_picture/';
	const formData = new FormData(document.getElementById('modify_profile_picture'));
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${localStorage.getItem("jwt")}`,
				'X-CSRFToken': window.client.get_cookie("csrftoken"),
			},
			credentials: 'include',
			body: formData,
		});

		const responseData = await response.json();

		if (responseData.error) {
			alert(responseData.error);
			throw new Error(responseData.error);
		}

		document.getElementById('profile-profile-picture-display').src = "auth/static/" + responseData.profile_picture;
		document.getElementById('banner-profile-image-display').src = "auth/static/" + responseData.profile_picture;

		window.location.reload();
	}
	catch (error) {
		console.error(error);
	}

}

export async function show_friendlist() {
	
	var list_names = document.getElementById('friends-list-names');
	var list_delete = document.getElementById('friends-list-delete');
	list_names.innerHTML = '';
	list_delete.innerHTML = '';

	const url = '/auth/getMyFriends/';
	const response = await getter(url);
	if (response.error) {
		const lang = window.client.lang;
		if (response.error == 'Error: no friends') {
			if (lang === 'fr')
				list_names.textContent = "Vous n'avez pas d'amis pour le moment !";
			else if (lang === 'es')
				list_names.textContent = "No tienes amigos por el momento !";
			else if (lang === 'en')
				list_names.textContent = "You have no friends yet !";
		}
		return ;
	}

	var length = response.friends.length;
	for (var i = 0; i < length; i++) {

		var new_friend = document.createElement('button');
		new_friend.textContent = response.friends[i];
		new_friend.name = response.friends[i];
		new_friend.addEventListener('click', (event) => showFriendProfile(event));
		list_names.appendChild(new_friend);


		var delete_button = document.createElement('button');
		delete_button.name = response.friends[i];
		delete_button.addEventListener('click', (event) => deleteFriend(event));
		var lang = window.client.lang;
		if (lang === 'fr')
			delete_button.textContent = 'Supprimer';
		else if (lang === 'es')
			delete_button.textContent = 'Borrar';
		else if (lang === 'en')
			delete_button.textContent = 'Delete';
		list_delete.appendChild(delete_button);
	}
}

export async function addFriend(event) {
	event.preventDefault()
	const url = '/auth/addFriend/';
	const data = {
		friend: document.getElementById('add-friend-input').value,
	};
	const response = await poster(url, data);
	document.getElementById('add-friend-input').value = "";
	if (response.error) {
		alert(response.error);
		return ;
	}
	alert(response.message);
}

export async function deleteFriend(event) {
	const friend_name = event.target.name;
	const url = '/auth/DeleteFriend/';

	const data = {
		'friend': friend_name,
	};
	const response = await poster(url, data);
	if (response.error) {
		alert(response.error);
		return ;
	}

	show_friendlist();
}


export async function showFriendRequests() {
	var list = document.getElementById('friends-requests');
	list.innerHTML = '';

	const url = '/auth/FriendRequests/';
	const response = await getter(url);


	if (response.error) {
        const lang = window.client.lang;

		if (lang === 'fr')
			list.textContent = "Vous n'avez pas de demandes d'amis en attente !";
		else if (lang === 'es')
			list.textContent = "No tienes solicitudes de amistad pendientes !";
		else if (lang === 'en')
			list.textContent = "You have no pending friend requests !";
		return ;
	}

	var length = response.friend_requests.length;
	for (var i = 0; i < length; i++) {
		var new_friend = document.createElement('div');
		var lang = window.client.lang;
		if (lang === 'fr')
			new_friend.textContent = 'Demande d\'ami de: ' + response.friend_requests[i];
		else if (lang === 'es')
			new_friend.textContent = 'Solicitud de amistad de: ' + response.friend_requests[i];
		else if (lang === 'en')
			new_friend.textContent = 'Friend request from: ' + response.friend_requests[i];
		new_friend.id = "friend_request_from_" + response.friend_requests[i];
		new_friend.style.width = "100%";
		new_friend.style.alignItems = "center";
		new_friend.style.display = "flex";
		new_friend.style.marginTop = "1%";

		var accept_button = document.createElement('button');
		if (lang === 'fr')
			accept_button.textContent = 'Accepter';
		else if (lang === 'es')
			accept_button.textContent = 'Aceptar';
		else if (lang === 'en')
			accept_button.textContent = 'Accept';
		accept_button.name = response.friend_requests[i];
		accept_button.style.marginLeft = "auto";
		accept_button.style.marginRight = "3%";
		
		accept_button.addEventListener('click', (event) => acceptFriendRequest(event));
		new_friend.appendChild(accept_button);

		var refuse_button = document.createElement('button');
		if (lang === 'fr')
			refuse_button.textContent = 'Refuser';
		else if (lang === 'es')
			refuse_button.textContent = 'Rechazar';
		else if (lang === 'en')
			refuse_button.textContent = 'Refuse';
		refuse_button.name = response.friend_requests[i];
		refuse_button.addEventListener('click', (event) => refuseFriendRequest(event));
		new_friend.appendChild(refuse_button);

		list.appendChild(new_friend);
		
	}
}

export async function acceptFriendRequest(event) {
	const url = '/auth/FriendRequests/';
	const friend_name = event.target.name;

	const data = {
		'friend': friend_name,
	};
	const response = await poster(url, data);
	if (response.error) {
		alert(response.error);
		return ;
	}
	document.getElementById('friend_request_from_' + friend_name).remove();
	await show_friendlist();
	await showFriendRequests();
}



export async function refuseFriendRequest(event) {
    const friend_name = event.target.name;
    const url = '/auth/RefuseFriendRequest/';
    const data = {
        friend: friend_name,
    };
    const response = await poster(url, data);
    if (response.error) {
        alert(response.error);
        return ;
    }
    document.getElementById('friend_request_from_' + friend_name).remove();
	await show_friendlist();
	await showFriendRequests();
}


export async function getPongHistory() {
	const url = '/game/pongHistory/'
	const response = await getter(url);
	var lang = window.client.lang;

	if (response.error) {
		document.getElementById('pong-history-wins').textContent = 0;
		document.getElementById('pong-history-losses').textContent =  0;
		document.getElementById('pong-history-winrate').textContent = "0%";
		return ;
	}
	var div = document.getElementById('pong-history-list');
	div.textContent = "";
	var owner = document.getElementById('banner-nickname-display').textContent;
	const limit = response.history.length > 10 ? response.history.length - 10 : 0;
	for (var i = response.history.length - 1; i >= limit; i--) {
		var p = document.createElement('p');
		var p2 = document.createElement('p');
		var p3 = document.createElement('p');

		if (response.history[i].winner == response.history[i].owner) {
			response.history[i].winner = owner;
		}

		if (response.history[i].game_type == "remote") {
			if (response.history[i].winner != owner)
				response.history[i].winner = owner;
			response.history[i].opponent = await getNicknameWithUserId(response.history[i].opponent);
		}
		if (lang == 'fr') {
			p.textContent = owner + " a joué ";
			p.textContent += "une partie de " + response.history[i].game_type + " contre ";
			p.textContent += response.history[i].opponent + ". ";
			p2.textContent += "Score: " + owner + ": " + response.history[i].player_score;
			p2.textContent += " et " + response.history[i].opponent + ": " + response.history[i].opponent_score + ". ";
			p2.textContent += "Gagnant: " + response.history[i].winner + ". ";
			p3.textContent += "La partie s'est terminée le " + response.history[i].end_day + " à " + response.history[i].end_time + ".";
		}
		else if (lang == 'es') {
			p.textContent = owner + " jugó ";
			p.textContent += "un partido de " + response.history[i].game_type + " contra ";
			p.textContent += response.history[i].opponent + ". ";
			p2.textContent += "Puntuación: " + owner + ": " + response.history[i].player_score;
			p2.textContent += " y " + response.history[i].opponent + ": " + response.history[i].opponent_score + ". ";
			p2.textContent += "Ganador: " + response.history[i].winner + ". ";
			p3.textContent += "El juego terminó el " + response.history[i].end_day + " a las " + response.history[i].end_time + ".";
		}
		else if (lang == 'en') {
			p.textContent = owner + " played ";
			p.textContent += "a " + response.history[i].game_type + " game against ";
			p.textContent += response.history[i].opponent + ". ";

			p2.textContent += "Score: " + owner + ": " + response.history[i].player_score;
			p2.textContent += " and " + response.history[i].opponent + ": " + response.history[i].opponent_score + ". ";
			p2.textContent += "Winner: " + response.history[i].winner + ". ";
			p3.textContent += "Game ended the " + response.history[i].end_day + " at " + response.history[i].end_time + ".";
		}
		if (response.history[i].result == "Victory") {
			p.style.backgroundColor = "#98fb98";
		}
		else {
			p.style.backgroundColor = "#ffb6c1";
		}
		div.appendChild(p);
		p.appendChild(p2);
		p.style.height = "auto";
		p.style.width = "80%"
		p.style.border = "1px solid #ccc";
		p.style.borderRadius = "30px";
		p.style.padding = "10px";
		p2.appendChild(p3);
	}
	document.getElementById('pong-history-wins').textContent = response.wins;
	document.getElementById('pong-history-losses').textContent =  response.losses;
	document.getElementById('pong-history-winrate').textContent =  response.winrate;
}

export async function showFriendProfile(event) {

	localStorage.setItem('friend_nickname', event.target.name);
	window.client.nextPage('friend-profile');
}

export async function showFriendInfo() {

	var friend_name;

	if (history.state.friend_nickname) {
		friend_name = history.state.friend_nickname;
	}
	else {
		friend_name = localStorage.getItem('friend_nickname');
	}

	const url = '/auth/getFriendInfo/';
	const data = {
		'friend': friend_name,
	};
	const response = await poster(url, data);
	if (response.error) {
		document.getElementById('friend-not-found').querySelector('p').textContent = 'When trying to access ' + friend_name + '\'s profile, ' + response.error;
		return 'friend-not-found';
	}

	document.getElementById('friend-profile-nickname-display').textContent = response.nickname;
	document.getElementById('friend-profile-profile-picture-display').src = "auth/static/" + response.img;
	if (response.online_status == true )
		document.getElementById('friend-online-status-image').src = "auth/static/online.jpg";
	else
		document.getElementById('friend-online-status-image').src = "auth/static/offline.jpg";
	
	await getFriendGameStats(friend_name);

	return 'friend-profile';
}

export async function getFriendGameStats(name) {

	const friend_id = await getUserIdWithNickname(name);

	const lang = window.client.lang;
	//Pong stats
	const url = '/game/getFriendStats/';
	const data = {
		'friend_id': friend_id,
	};
	const response = await poster(url, data);
	if (response.error) {
		document.getElementById('friend-pong-history-wins').textContent = 0;
		document.getElementById('friend-pong-history-losses').textContent = 0;
		document.getElementById('friend-winrate-game-display').textContent = "0%";
		if (lang == 'en') {
			document.getElementById('friend-pong-history-list').textContent = "No history available";
		} else if (lang == 'fr') {
			document.getElementById('friend-pong-history-list').textContent = "Pas d'historique disponible";
		} else if (lang == 'es') {
			document.getElementById('friend-pong-history-list').textContent = "No hay historial disponible";
		}
	} else {
		document.getElementById('friend-pong-history-wins').textContent = response.wins;
		document.getElementById('friend-pong-history-losses').textContent = response.losses;
		document.getElementById('friend-winrate-game-display').textContent = response.winrate;
		friendPongHistory(response.history, name);
	}

	//Janken stats
	const url2 = '/janken/getFriendStats/';
	const response2 = await poster(url2, data);
	if (response2.error) {
		document.getElementById('friend-janken-history-wins').textContent = 0;
		document.getElementById('friend-janken-history-losses').textContent = 0;
		document.getElementById('friend-janken-history-draws').textContent = 0;
		document.getElementById('friend-winrate-janken-display').textContent = "0%";
		if (lang == 'en') {
			document.getElementById('friend-janken-history-list').textContent = "No history available";
		} else if (lang == 'fr') {
			document.getElementById('friend-janken-history-list').textContent = "Pas d'historique disponible";
		} else if (lang == 'es') {
			document.getElementById('friend-janken-history-list').textContent = "No hay historial disponible";
		}
	} else {
		document.getElementById('friend-janken-history-wins').textContent = response2.wins;
		document.getElementById('friend-janken-history-losses').textContent = response2.losses;
		document.getElementById('friend-janken-history-draws').textContent = response2.draws;
		document.getElementById('friend-winrate-janken-display').textContent = response2.winrate;
		friendJankenHistory(response2.history, name);
	}
}

export async function friendPongHistory(history, friend_name) {

	var lang = window.client.lang;

	var div = document.getElementById('friend-pong-history-list');
	div.textContent = "";

	const limit = history.length > 10 ? history.length - 10 : 0;
	
	for (var i = history.length - 1; i >= limit; i--) {
		var p = document.createElement('p');
		var p2 = document.createElement('p');
		var p3 = document.createElement('p');
		var owner = friend_name;
		if (history[i].winner == history[i].owner)
			history[i].winner = owner;
		
		if (history[i].game_type == "remote") {
			history[i].opponent = await getNicknameWithUserId(history[i].opponent);
			if (history[i].winner != owner) {
				history[i].winner = history[i].opponent;
			}
		}

		if (lang == 'fr') {
			p.textContent = owner + " a joué ";
			p.textContent += "une partie de " + history[i].game_type + " contre ";
			p.textContent += history[i].opponent + ". ";
			p2.textContent += "Score: " + owner + ": " + history[i].player_score;
			p2.textContent += " et " + history[i].opponent + ": " + history[i].opponent_score + ". ";
			p2.textContent += "Gagnant: " + history[i].winner + ". ";
			p3.textContent += "La partie s'est terminée le " + history[i].end_day + " à " + history[i].end_time + ".";
		}
		else if (lang == 'es') {
			p.textContent = owner + " jugó ";
			p.textContent += "un partido de " + history[i].game_type + " contra ";
			p.textContent += history[i].opponent + ". ";
			p2.textContent += "Puntuación: " + owner + ": " + history[i].player_score;
			p2.textContent += " y " + history[i].opponent + ": " + history[i].opponent_score + ". ";
			p2.textContent += "Ganador: " + history[i].winner + ". ";
			p3.textContent += "El juego terminó el " + history[i].end_day + " a las " + history[i].end_time + ".";
		}
		else if (lang == 'en') {
			p.textContent = owner + " played ";
			p.textContent += "a " + history[i].game_type + " game against ";
			p.textContent += history[i].opponent + ". ";

			p2.textContent += "Score: " + owner + ": " + history[i].player_score;
			p2.textContent += " and " + history[i].opponent + ": " + history[i].opponent_score + ". ";
			p2.textContent += "Winner: " + history[i].winner + ". ";
			p3.textContent += "Game ended the " + history[i].end_day + " at " + history[i].end_time + ".";
		}
		if (history[i].result == "Victory") {
			p.style.backgroundColor = "#98fb98";
		}
		else {
			p.style.backgroundColor = "#ffb6c1";
		}
		div.appendChild(p);
		p.appendChild(p2);
		p.style.height = "150px";
		p.style.border = "1px solid #ccc";
		p.style.borderRadius = "30px";
		p.style.padding = "10px";
		p2.appendChild(p3);
	}
}

export async function friendJankenHistory(history, friend_name) {

	var lang = window.client.lang;
	var div = document.getElementById('friend-janken-history-list');
	div.textContent = "";

	const limit = history.length > 10 ? history.length - 10 : 0;
	for (var i = history.length - 1; i >= limit; i--) {
		var p = document.createElement('p');
		var p2 = document.createElement('p');
		var p3 = document.createElement('p');
		history[i].owner = await getNicknameWithUserId(history[i].owner);
		history[i].opponent = await getNicknameWithUserId(history[i].opponent);
		if (lang == 'fr') {
			p.textContent = history[i].owner + " a joué ";
			if (history[i].owner_choice == "paper")
				history[i].owner_choice = "papier";
			else if (history[i].owner_choice == "rock")
				history[i].owner_choice = "pierre";
			else if (history[i].owner_choice == "scissors")
				history[i].owner_choice = "ciseaux";
			p.textContent += history[i].owner_choice  + (history[i].owner_choice == "None" ? "(Forfait)" : "");
			p.textContent += " et " + history[i].opponent + " a joué ";
			if (history[i].opponent_choice == "paper")
				history[i].opponent_choice = "papier";
			else if (history[i].opponent_choice == "rock")
				history[i].opponent_choice = "pierre";
			else if (history[i].opponent_choice == "scissors")
				history[i].opponent_choice = "ciseaux";
			p.textContent += history[i].opponent_choice + (history[i].opponent_choice == "None" ? "(Forfait)" : "") + ".";
			p2.textContent += "Résultat: " + history[i].result + ". ";
			p3.textContent += "La partie s'est terminée le " + history[i].end_day + " à " + history[i].end_time + ".";
		}
		else if (lang == 'es') {
			p.textContent = history[i].owner + " jugó ";
			if (history[i].owner_choice == "paper")
				history[i].owner_choice = "papel";
			else if (history[i].owner_choice == "rock")
				history[i].owner_choice = "piedra";
			else if (history[i].owner_choice == "scissors")
				history[i].owner_choice = "tijeras";
			p.textContent += history[i].owner_choice  + (history[i].owner_choice == "None" ? "(Forfeit)" : "");
			p.textContent += " y " + history[i].opponent + " jugó ";
			if (history[i].opponent_choice == "paper")
				history[i].opponent_choice = "papel";
			else if (history[i].opponent_choice == "rock")
				history[i].opponent_choice = "piedra";
			else if (history[i].opponent_choice == "scissors")
				history[i].opponent_choice = "tijeras";
			p.textContent += history[i].opponent_choice + (history[i].opponent_choice == "None" ? "(Forfeit)" : "") + ".";
			p2.textContent += "Resultado: " + history[i].result + ". ";
			p3.textContent += "El juego terminó el " + history[i].end_day + " a las " + history[i].end_time + ".";
		}
		else if (lang == 'en') {
			p.textContent = history[i].owner + " played ";
			p.textContent += history[i].owner_choice  + (history[i].owner_choice == "None" ? "(Forfeit)" : "");
			p.textContent += " and " + history[i].opponent + " played ";
			p.textContent += history[i].opponent_choice + (history[i].opponent_choice == "None" ? "(Forfeit)" : "") + ".";
			p2.textContent += "Result: " + history[i].result + ". ";
			p3.textContent += "Game ended the " + history[i].end_day + " at " + history[i].end_time + ".";
		}

		if (history[i].result == "Victory") {
			p.style.backgroundColor = "#98fb98";
		}
		else if (history[i].result == "draw") {
			p.style.backgroundColor = "#fffacd";
		}
		else {
			p.style.backgroundColor = "#ffb6c1";
		}
		p.style.height = "150px";
		p.style.border = "1px solid #ccc";
		p.style.borderRadius = "30px";
		p.style.padding = "10px";
		div.appendChild(p);
		p.appendChild(p2);
		p2.appendChild(p3);
	}

}

export async function friendHistoryDisplay() {
	var div = document.getElementById('friend-profile-history-list');
	if (div.style.display == 'none') {
		div.style.display = 'flex';
	} else {
		div.style.display = 'none';
	}
}

export async function getUserIdWithNickname(nickname) {
	const url = '/auth/getUserIdWithNickname/';
	const data = {
		'nickname': nickname,
	};
	const response = await poster(url, data);
	if (response.error) {
		return null;
	}
	return (response.user_id);
}

export async function getNicknameWithUserId(user_id) {
	const url = '/auth/getNicknameWithUserId/'
	const data = {
		'user_id': user_id,
	};
	const response = await poster(url, data);
	if (response.error) {
		return 'deleted-user'
	}
	return (response.nickname);
}
