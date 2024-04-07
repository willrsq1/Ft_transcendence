export class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

export class Rectangle {
	constructor(px, py, sx, sy, vx, vy) {
		this.size = new Vector(sx, sy);
		this.position = new Vector(px, py);
		this.velocity = new Vector(vx, vy);
	}
}

export class Collision {
	constructor(t, x, y, nx, ny) {
		this.time = t;
		this.point = new Vector(x, y);
		this.normal = new Vector(nx, ny);
	}
}

export class Particle {
	constructor(px, py, sx, sy, speed, lifetime) {
		this.life = lifetime;
		this.speed = speed;
		this.active = false;
		this.rectangle = new Rectangle(px, py, sx, sy, (Math.random() - 0.5) * speed, (Math.random() - 0.5) * speed);
	}
}

export class ParticlePool {
	constructor(size) {
		this.size = size;
		this.particle_lifetime = 1.5;
		this.pool = Array.from({ length: size }, () => new Particle(0, 0, 4, 4, 100, this.particle_lifetime));
	}

	get() {
		return this.pool.filter(particle => particle.active)
	}

	get_n_actives() {
		let actives = 0;
		for (let particle of this.pool) {
			if (particle.active)
				actives++;
		}
		return actives;
	}

	reset(x, y) {
		for (let particle of this.pool) {
			particle.active = true;
			particle.life = this.particle_lifetime;
			particle.rectangle.position.x = x;
			particle.rectangle.position.y = y;
			particle.rectangle.velocity.x = (Math.random() - 0.5) * particle.speed;
			particle.rectangle.velocity.y = (Math.random() - 0.5) * particle.speed;
		}
	}

	update(dt) {
		for (let particle of this.pool) {
			if (particle.active) {
				particle.rectangle.position.x += particle.rectangle.velocity.x * dt;
				particle.rectangle.position.y += particle.rectangle.velocity.y * dt;
				particle.life -= dt;
				if (particle.life <= 0)
					particle.active = false;
			}
		}
	}
}

function aabb_collision_test(r1, r2) {
	return r1.position.x + r1.size.x >= r2.position.x &&
		r1.position.x <= r2.position.x + r2.size.x &&
		r1.position.y + r1.size.y >= r2.position.y &&
		r1.position.y <= r2.position.y + r2.size.y;
}

function aabb_collision_resolve(r1, r2) {
	const buffer = 1;
	const overlap_x = Math.min(r1.position.x + r1.size.x - r2.position.x, r2.position.x + r2.size.x - r1.position.x);
	const overlap_y = Math.min(r1.position.y + r1.size.y - r2.position.y, r2.position.y + r2.size.y - r1.position.y);

	if (overlap_x < overlap_y) {
		if (r1.position.x < r2.position.x) {
			r1.position.x -= overlap_x + buffer;
		} else {
			r1.position.x += overlap_x + buffer;
		}
	} else {
		if (r1.position.y < r2.position.y) {
			r1.position.y -= overlap_y + buffer;
		} else {
			r1.position.y += overlap_y + buffer;
		}
	}
}


/**
 * Checks if a ray intersects with a rectangle.
 *
 * @param {Vector} origin - The origin of the ray.
 * @param {Vector} direction - The direction of the ray.
 * @param {Rectangle} target - The rectangle to test against
 * @returns {Collision} - A Collision object containing all the
 * informations about the collision. If no collision what detected, the 't'
 * parameter of the object is set to -1.
 */
export function ray_rectangle_collision(origin, direction, target) {
	let t_near = new Vector(
		direction.x === 0 ? (target.position.x - origin.x) > 0 ? Infinity : -Infinity : (target.position.x - origin.x) / direction.x,
		direction.y === 0 ? (target.position.y - origin.y) > 0 ? Infinity : -Infinity : (target.position.y - origin.y) / direction.y
	);
	let t_far = new Vector(
		direction.x === 0 ? (target.position.x + target.size.x - origin.x) > 0 ? Infinity : -Infinity : (target.position.x + target.size.x - origin.x) / direction.x,
		direction.y === 0 ? (target.position.y + target.size.y - origin.y) > 0 ? Infinity : -Infinity : (target.position.y + target.size.y - origin.y) / direction.y
	);

	if (t_near.x > t_far.x) [t_near.x, t_far.x] = [t_far.x, t_near.x];
	if (t_near.y > t_far.y) [t_near.y, t_far.y] = [t_far.y, t_near.y];

	let collision = new Collision(-1, 0, 0, 0, 0);

	if (t_near.x > t_far.y || t_near.y > t_far.x) return collision;

	let t_hit_near = Math.max(t_near.x, t_near.y);
	let t_hit_far = Math.min(t_far.x, t_far.y);

	if (t_hit_far < 0) return collision;

	collision.time = t_hit_near;
	collision.point.x = origin.x + t_hit_near * direction.x;
	collision.point.y = origin.y + t_hit_near * direction.y;

	if (t_near.x > t_near.y) {
		if (direction.x < 0) { collision.normal.x = 1; collision.normal.y = 0; }
		else { collision.normal.x = -1; collision.normal.y = 0; }
	} else if (t_near.x < t_near.y) {
		if (direction.y < 0) { collision.normal.x = 0; collision.normal.y = 1; }
		else { collision.normal.x = 0; collision.normal.y = -1; }
	}
	return collision;
}

/**
 * Update the velocity of r1 to bring it in contact with the object the ray
 * collided with.
 *
 * @param {Rectangle} r1 - The moving rectangle.
 * @param {Collision} collision - An object containing the collision time and normal.
 */
export function aabb_continuous_resolve(r1, collision) {
	return new Vector(
		r1.velocity.x + collision.normal.x * Math.abs(r1.velocity.x) * (1 - collision.time),
		r1.velocity.y + collision.normal.y * Math.abs(r1.velocity.y) * (1 - collision.time)
	);
}

/**
 * Test one moving rectangle against one static rectangle for collision.
 *
 * @param {Rectangle} r1 - The moving rectangle to test for collision.
 * @param {Rectangle} r2 - The static rectangle to test against.
 * @param {float} dt
 * @returns {Collision} - A Collision object containing all the
 * informations about the collision. If no collision what detected, the 't'
 * parameter of the object is set to -1.
 */
export function aabb_continuous_detection(r1, r2, dt) {

	if (aabb_collision_test(r1, r2)) {
		aabb_collision_resolve(r1, r2);
	}

	/* If r1 is not moving, a collision cannot occur */
	if (r1.velocity.x == 0 && r1.velocity.y == 0)
		return new Collision(-1, 0, 0, 0, 0);

	/* Create an expanded target to check against so that we can detect and resolve the collision properly */
	let r2_expanded = new Rectangle(
		r2.position.x - r1.size.x / 2,
		r2.position.y - r1.size.y / 2,
		r2.size.x + r1.size.x,
		r2.size.y + r1.size.y,
		0, 0
	);
	let collision = ray_rectangle_collision(
		new Vector(r1.position.x + r1.size.x / 2, r1.position.y + r1.size.y / 2),
		new Vector(r1.velocity.x * dt, r1.velocity.y * dt),
		r2_expanded
	);

	return collision;
}
