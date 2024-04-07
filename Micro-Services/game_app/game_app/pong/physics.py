import random

class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y


class Rectangle:
    def __init__(self, px: float, py: float, sx: float, sy: float, vx: float, vy: float):
        self.size = Vector(sx, sy)
        self.position = Vector(px, py)
        self.velocity = Vector(vx, vy)

class Collision:
    def __init__(self, t: float, x: float, y: float, nx: float, ny: float):
        self.time = t
        self.point = Vector(x, y)
        self.normal = Vector(nx, ny)


class Particle:
    def __init__(self, px, py, sx, sy, speed, lifetime):
        self.life = lifetime
        self.speed = speed
        self.active = False
        self.rectangle = Rectangle(px, py, sx, sy, (random.random() - 0.5) * speed, (random.random() - 0.5) * speed)


class ParticlePool:
    def __init__(self, size):
        self.size = size
        self.particle_lifetime = 1.5
        self.pool = [Particle(0, 0, 4, 4, 100, self.particle_lifetime) for _ in range(size)]

    def get(self):
        active_particles = [particle for particle in self.pool if particle.active]
        return active_particles

    def get_n_actives(self):
        return sum(1 for particle in self.pool if particle.active)

    def reset(self, x, y):
        for particle in self.pool:
            particle.active = True
            particle.life = self.particle_lifetime
            particle.rectangle.position.x = x
            particle.rectangle.position.y = y
            particle.rectangle.velocity.x = (random.random() - 0.5) * particle.speed
            particle.rectangle.velocity.y = (random.random() - 0.5) * particle.speed

    def update(self, dt):
        for particle in self.pool:
            if particle.active:
                particle.rectangle.position.x += particle.rectangle.velocity.x * dt
                particle.rectangle.position.y += particle.rectangle.velocity.y * dt
                particle.life -= dt
                if particle.life <= 0:
                    particle.active = False


def ray_rectangle_collision(origin: Vector, direction: Vector, target: Rectangle) -> Collision:
    t_near = Vector(
        (
            (target.position.x - origin.x) / direction.x
            if direction.x != 0
            else (float("inf") if (target.position.x - origin.x) > 0 else float("-inf"))
        ),
        (
            (target.position.y - origin.y) / direction.y
            if direction.y != 0
            else (float("inf") if (target.position.y - origin.y) > 0 else float("-inf"))
        ),
    )
    t_far = Vector(
        (
            (target.position.x + target.size.x - origin.x) / direction.x
            if direction.x != 0
            else (float("inf") if (target.position.x + target.size.x - origin.x) > 0 else float("-inf"))
        ),
        (
            (target.position.y + target.size.y - origin.y) / direction.y
            if direction.y != 0
            else (float("inf") if (target.position.y + target.size.y - origin.y) > 0 else float("-inf"))
        ),
    )

    if t_near.x > t_far.x:
        t_near.x, t_far.x = t_far.x, t_near.x
    if t_near.y > t_far.y:
        t_near.y, t_far.y = t_far.y, t_near.y

    collision = Collision(-1, 0, 0, 0, 0)

    if t_near.x > t_far.y or t_near.y > t_far.x:
        return collision

    t_hit_near = max(t_near.x, t_near.y)
    t_hit_far = min(t_far.x, t_far.y)

    if t_hit_far < 0:
        return collision

    collision.time = t_hit_near
    collision.point.x = origin.x + t_hit_near * direction.x
    collision.point.y = origin.y + t_hit_near * direction.y

    if t_near.x > t_near.y:
        if direction.x < 0:
            collision.normal.x = 1
            collision.normal.y = 0
        else:
            collision.normal.x = -1
            collision.normal.y = 0
    elif t_near.x < t_near.y:
        if direction.y < 0:
            collision.normal.x = 0
            collision.normal.y = 1
        else:
            collision.normal.x = 0
            collision.normal.y = -1

    return collision


def aabb_collision_test(r1, r2):
    return (r1.position.x + r1.size.x >= r2.position.x and
            r1.position.x <= r2.position.x + r2.size.x and
            r1.position.y + r1.size.y >= r2.position.y and
            r1.position.y <= r2.position.y + r2.size.y)

def aabb_collision_resolve(r1, r2):
    buffer = 1
    overlap_x = min(r1.position.x + r1.size.x - r2.position.x,
                    r2.position.x + r2.size.x - r1.position.x)
    overlap_y = min(r1.position.y + r1.size.y - r2.position.y,
                    r2.position.y + r2.size.y - r1.position.y)

    if overlap_x < overlap_y:
        if r1.position.x < r2.position.x:
            r1.position.x -= overlap_x + buffer
        else:
            r1.position.x += overlap_x + buffer
    else:
        if r1.position.y < r2.position.y:
            r1.position.y -= overlap_y + buffer
        else:
            r1.position.y += overlap_y + buffer

def aabb_continuous_resolve(r1: Rectangle, collision: Collision) -> None:
    return Vector(
        r1.velocity.x + collision.normal.x * abs(r1.velocity.x) * (1 - collision.time),
        r1.velocity.y + collision.normal.y * abs(r1.velocity.y) * (1 - collision.time),
    )


def aabb_continuous_detection(r1: Rectangle, r2: Rectangle, dt: float) -> Collision:

    if aabb_collision_test(r1, r2):
        aabb_collision_resolve(r1, r2)

    if r1.velocity.x == 0 and r1.velocity.y == 0:
        return Collision(-1, 0, 0, 0, 0)

    r2_expanded = Rectangle(
        r2.position.x - r1.size.x / 2,
        r2.position.y - r1.size.y / 2,
        r2.size.x + r1.size.x,
        r2.size.y + r1.size.y,
        0,
        0,
    )
    collision = ray_rectangle_collision(
        Vector(r1.position.x + r1.size.x / 2, r1.position.y + r1.size.y / 2),
        Vector(r1.velocity.x * dt, r1.velocity.y * dt),
        r2_expanded,
    )

    return collision
