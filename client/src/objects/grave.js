import * as Three from 'three';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

class Grave {
  constructor(scene, x, z) {
    this.position = { x, z };
    this.scene = scene;
    this.object = null;

    this.init()
  }

  init() {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    mtlLoader.load('/build/assets/models/grave/grave.mtl', (mtl) => {
      mtl.preload();
      objLoader.setMaterials(mtl);
      objLoader.load('/build/assets/models/grave/grave.obj', (obj) => {
        obj.position.set(this.position.x, -6, this.position.z)
        obj.scale.set(1,1,1)
        obj.castShadow = true;
        obj.receiveShadow = true;

        obj.traverse( function ( child ) {
          if ( child instanceof Three.Mesh ) {
              child.castShadow = true;
          }
        } );

        this.object = obj;
        this.scene.add(this.object);
      })
    })
  }

  getObject() {
    return this.object;
  }
}

export default Grave;
