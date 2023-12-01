import { spheres, vector1, vector2, vector3, worldOctree, GRAVITY, playerSphereCollision } from './main';

function spheresCollisions() {

	for (let i = 0, length = spheres.length; i < length; i++) {

		const s1 = spheres[i];

		for (let j = i + 1; j < length; j++) {

			const s2 = spheres[j];

			const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if (d2 < r2) {

				const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
				const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
				const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);

				const d = (r - Math.sqrt(d2)) / 2;

				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, -d);

			}

		}

	}

}
export function updateSpheres(deltaTime) {

	spheres.forEach(sphere => {

		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

		const result = worldOctree.sphereIntersect(sphere.collider);

		if (result) {

			sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));

		} else {

			sphere.velocity.y -= GRAVITY * deltaTime;

		}

		const damping = Math.exp(-1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);

		playerSphereCollision(sphere);

	});

	spheresCollisions();

	for (const sphere of spheres) {

		sphere.mesh.position.copy(sphere.collider.center);

	}

}
