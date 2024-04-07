export const canvas = document.getElementById("game-canvas");
export const ctx = canvas.getContext("2d");

export const TIMESTEP = 1.0 / 60.0;
export const SERVER_SENDRATE = 1.0 / 60.0;
export const REMOTE_SEND_RATE = 2;

/* BOARD */
export const BOARD_WIDTH = canvas.width;
export const BOARD_HEIGHT = canvas.height;
export const BOARD_WALL = 16;
export const BOARD_CORRIDOR = 2 * BOARD_WALL + 10;

/* INPUTS */
export const INPUT_LEFT = 0;
export const INPUT_RIGHT = 1;
export const INPUT_SPACE = 2;
export const INPUT_NEUTRAL = 3;
export const INPUT_QUIT = 4;

/* SOUNDS */
export const SOUND_VICTORY = 0;
export const SOUND_HIT = 1;
export const SOUND_SCORE = 2;

/* STATUSES */
export const STATUS_ACTIVE = 1; /* game in progress */
export const STATUS_ENDED = 2; /* game over, ask for retry */
export const STATUS_PAUSED = 3; /* game is paused */
export const STATUS_QUIT = 4; /* game is over, retry did not happen */
export const STATUS_WAITING = 5; /* waiting for a second player */

/* GAME TYPES */
export const TYPE_REMOTE = 0;
export const TYPE_LOCAL = 1;
export const TYPE_AI = 2;
export const TYPE_TOURNY = 3;

/* PLAYERS' IDS */
export const ID_PLAYER1 = 0;
export const ID_PLAYER2 = 1;

/* BALL */
export const BALL_SIDE = 16;
export const BALL_SPEED_MIN = ((BOARD_HEIGHT / 2) - BOARD_WALL) * 1.25;
export const BALL_SPEED_MAX = ((BOARD_HEIGHT / 2) - BOARD_WALL) * 2.50;
export const BALL_MAX_ANGLE = Math.PI / 6;

/* PADDLE */
export const PADDLE_WIDTH = 64;
export const PADDLE_SPEED = (BOARD_WIDTH - (2 * BOARD_CORRIDOR)) * 1.90;

export const POINTS_TO_WIN = 10;
