import game_app.pong.constants as g

class SoundEvent:
    def __init__(self, tick, sound) -> None:
        self.tick = tick
        self.sound = sound

class SoundManager:
    def __init__(self) -> None:
        self.sound_events = []

    def create_sound_events(self, tick, collision, score, victory):
        if collision:
            self.sound_events.append(SoundEvent(tick, g.SOUND_HIT))
        if score:
            self.sound_events.append(SoundEvent(tick, g.SOUND_SCORE))
        if victory:
            self.sound_events.append(SoundEvent(tick, g.SOUND_VICTORY))

        self.sound_events = [event for event in self.sound_events if tick - event.tick < 3]


    def serialize_sound_events(self):
        serialized_events = [(event.tick, event.sound) for event in self.sound_events]
        return serialized_events