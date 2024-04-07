import math

TICKRATE = 1.0 / 60.0
SENDRATE = 1.0 / 60.0

# BOARD
BOARD_WIDTH = 480
BOARD_HEIGHT = 650
BOARD_WALL = 16
BOARD_CORRIDOR = 2 * BOARD_WALL + 10

# INPUTS
INPUT_LEFT = 0
INPUT_RIGHT = 1
INPUT_SPACE = 2
INPUT_NEUTRAL = 3
INPUT_QUIT = 4

INPUTS = [INPUT_LEFT, INPUT_RIGHT, INPUT_SPACE, INPUT_NEUTRAL, INPUT_QUIT]

# SOUNDS
SOUND_VICTORY = 0
SOUND_HIT = 1
SOUND_SCORE = 2

# STATUSES
STATUS_READY = 0  # game is about to begin, press a key to start
STATUS_ACTIVE = 1  # game in progress
STATUS_ENDED = 2  # game over, ask for retry
STATUS_PAUSED = 3  # game is paused
STATUS_QUIT = 4  # game is over, retry did not happen
STATUS_WAITING = 5  # waiting for a second player

# PLAYERS' IDS
ID_PLAYER1 = 0
ID_PLAYER2 = 1

# BALL
BALL_SIDE = 16
BALL_SPEED_MIN = ((BOARD_HEIGHT / 2) - BOARD_WALL) * 1.25
BALL_SPEED_MAX = ((BOARD_HEIGHT / 2) - BOARD_WALL) * 2.75
BALL_MAX_ANGLE = math.pi / 6

# PADDLE
PADDLE_WIDTH = 64
PADDLE_SPEED = (BOARD_WIDTH - (2 * BOARD_CORRIDOR)) * 1.50

POINTS_TO_WIN = 10