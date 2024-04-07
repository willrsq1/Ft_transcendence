import * as g from './global.js';

class SoundEvent {
	constructor(tick, sound) {
		this.tick = tick;
		this.sound = sound;
		this.played = false;
	}
}

export class SoundManager {
	constructor() {
		this.events = [];
		this.music = new Audio(window.ASSETS_URL + "glitchstairs.ogg");
		this.victory = new Audio(window.ASSETS_URL + "victory.wav");
		this.hit_sound = new Audio(window.ASSETS_URL + "hit.wav");
		this.score_sound = new Audio(window.ASSETS_URL + "explosion.wav");
	}

	create_sound_events(arr, len) {
		for (let i = 0; i < len; i++) {
			this.events.push(new SoundEvent(arr[i][0], arr[i][1]));
		}
	}

	process_sound_events(tick) {
		this.events = this.events.filter(event => event.played === false);

		for (let i = 0; i < this.events.length; i++) {
			if (tick >= this.events[i].tick) {

				switch (this.events[i].sound) {
					case g.SOUND_HIT:
						this.play_hit_sound();
						break;
					case g.SOUND_SCORE:
						this.play_score_sound();
						break;
					case g.SOUND_VICTORY:
						this.play_victory_sound();
						break;
				}
				this.events[i].played = true;
			}
		}
	}

	play_hit_sound() {
		this.hit_sound.play().catch(error => {
			console.warn("Audio play failed:", error);
		});
	}

	play_score_sound() {
		this.score_sound.play().catch(error => {
			console.warn("Audio play failed:", error);
		});
	}

	play_victory_sound() {
		this.victory.play().catch(error => {
			console.warn("Audio play failed:", error);
		});
	}

	play_music() {
		this.music.loop = true;
		this.music.play().catch(error => {
			console.warn("Audio play failed:", error);
		});
	}

	stop_music() {
		this.music.pause();
		this.music.currentTime = 0;
	}
}
