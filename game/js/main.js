import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';


import { Octree } from 'three/addons/math/Octree.js';

import { Capsule } from 'three/addons/math/Capsule.js';

import { controls } from './controls';
import { teleportPlayerIfOob } from './teleportPlayerIfOob';
import { updateSpheres } from './updateSpheres';
import { updatePlayer } from './updatePlayer';

export const socket = io('http://localhost:3000');

const clock = new THREE.Clock();

export const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

export const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

const container = document.getElementById( 'container' );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

export const GRAVITY = 30;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.01;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );

export const spheres = [];
let sphereIdx = 0;

for ( let i = 0; i < NUM_SPHERES; i ++ ) {

	const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	scene.add( sphere );

	spheres.push( {
		mesh: sphere,
		collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
		velocity: new THREE.Vector3()
	} );

}

export const worldOctree = new Octree();

export const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

export const playerVelocity = new THREE.Vector3();
export const playerDirection = new THREE.Vector3();

export let playerOnFloor = false;
let mouseTime = 0;

export const keyStates = {};

export const vector1 = new THREE.Vector3();
export const vector2 = new THREE.Vector3();
export const vector3 = new THREE.Vector3();

document.addEventListener( 'keydown', ( event ) => {

	keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

	keyStates[ event.code ] = false;

} );

container.addEventListener( 'mousedown', () => {

	document.body.requestPointerLock();

	mouseTime = performance.now();

} );

document.addEventListener( 'mouseup', () => {

	if ( document.pointerLockElement !== null ) throwBall();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

	if ( document.pointerLockElement === document.body ) {

		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;

	}

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function throwBall() {

	const sphere = spheres[ sphereIdx ];

	camera.getWorldDirection( playerDirection );

	sphere.collider.center.copy( playerCollider.end ).addScaledVector( playerDirection, playerCollider.radius * 1.5 );

	// throw the ball with more force if we hold the button longer, and if we move forward

	const impulse = 15 + 30 * ( 1 - Math.exp( ( mouseTime - performance.now() ) * 0.001 ) );

	sphere.velocity.copy( playerDirection ).multiplyScalar( impulse );
	sphere.velocity.addScaledVector( playerVelocity, 2 );

	sphereIdx = ( sphereIdx + 1 ) % spheres.length;

}

socket.on('updatePlayerPosition', ({ playerId, position }) => {
  console.log(`Player ${playerId} position update: ${position}`);
});

export function animate() {

	const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

		controls( deltaTime );

		updatePlayer( deltaTime );

		updateSpheres( deltaTime );

		teleportPlayerIfOob();

	}

	renderer.render( scene, camera );

	stats.update();

	requestAnimationFrame( animate );

}