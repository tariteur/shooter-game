import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { scene, worldOctree, animate } from './main';

const loader = new GLTFLoader().setPath('./models/glb/');
loader.load('map.glb', (gltf) => {

	gltf.scene.scale.set(2, 2, 2);

	scene.add(gltf.scene);

	worldOctree.fromGraphNode(gltf.scene);

	gltf.scene.traverse(child => {

		if (child.isMesh) {

			child.castShadow = true;
			child.receiveShadow = true;

			if (child.material.map) {

				child.material.map.anisotropy = 4;

			}

		}

	});

	const helper = new OctreeHelper(worldOctree);
	helper.visible = false;
	scene.add(helper);

	const gui = new GUI({ width: 200 });
	gui.add({ debug: false }, 'debug')
		.onChange(function (value) {

			helper.visible = value;

		});

	animate();

});
