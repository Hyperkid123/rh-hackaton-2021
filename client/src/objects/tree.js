import * as Three from 'three';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class Tree {
  constructor(scene, x, z, loader, mtlLoader) {
    this.position = { x, z };
    this.scene = scene;
    this.object = null;
    this.loader = loader;
    this.mtlLoader = mtlLoader;

    this.init()
  }

  init() {
    this.mtlLoader.load('/build/assets/models/tree/lowpolytree.mtl', (mtl) => {
      mtl.preload();
      this.loader.setMaterials(mtl);
      this.loader.load('/build/assets/models/tree/lowpolytree.obj', (obj) => {
        obj.position.set(this.position.x + getRandomInt(-5, 5) , 10, this.position.z + getRandomInt(-5, 5) )
        obj.scale.set(5,5,5)
        obj.castShadow = true;
        obj.receiveShadow = true;

        obj.traverse( function ( child ) {
          if ( child instanceof Three.Mesh ) {
              child.castShadow = true;
          }
        } );

        obj.rotateY(getRandomInt(0, 360) * Math.PI / 180 );

        this.object = obj;
        this.scene.add(this.object);
      })
    })
  }

  getObject() {
    return this.object;
  }
}

export default Tree;
