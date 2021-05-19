import * as Three from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import makeLabelCanvas from '../helpers/make-label-canvas';
class Soldier {
  constructor(scene, x, z, isLeft, id, attributes, afterLoad) {
    this.id = id;
    this.attributes = attributes;
    this.position = { x, z };
    this.isLeft = isLeft;
    this.scene = scene;
    this.object = null;
    this.loaded = 0;
    this.afterLoad = afterLoad;

    this.init(afterLoad)
  }

  init() {
    const loader = new FBXLoader();
    loader.load('/build/assets/models/abe/abe-t-pose.fbx', (fbx) => {
      fbx.position.set(this.position.x, 0, this.position.z)
      fbx.scale.set(0.05,0.05,0.05)
      fbx.rotateY(this.isLeft ? Three.MathUtils.degToRad(180) : 0)
      fbx.traverse((child) => {
        child.castShadow = true;
        child.receiveShadow = true;
      })

      const anim = new FBXLoader();

      this.animations = {}
      this.mixers = {};

      anim.setPath('/build/assets/models/animations/')
      anim.load('breathing-idle.fbx', anim => {
        this.mixers = {
          ...this.mixers,
          idle: new Three.AnimationMixer(fbx)
        }
        this.animations.idle = this.mixers.idle.clipAction(anim.animations[0])
        this.animations.idle.play()

        this.loadElement();
      })
      anim.load('clown-walk.fbx', anim => {
        this.mixers = {
          ...this.mixers,
          walk: new Three.AnimationMixer(fbx)
        }
        this.animations.walk = this.mixers.walk.clipAction(anim.animations[0])

        this.loadElement();
      })

      const canvas = makeLabelCanvas(this.id)
      const labelTexture = new Three.CanvasTexture(canvas)

      labelTexture.minFilter = Three.LinearFilter;
      labelTexture.wrapS = Three.ClampToEdgeWrapping;
      labelTexture.wrapT = Three.ClampToEdgeWrapping;

      const labelMaterial = new Three.SpriteMaterial({
        map: labelTexture,
        transparent: false,
      });
      const label = new Three.Sprite(labelMaterial);

      label.position.x = this.position.x
      label.position.y = 15;
      label.position.z = this.position.z;

      const labelBaseScale = 0.01;
      label.scale.x = canvas.width  * labelBaseScale;
      label.scale.y = canvas.height * labelBaseScale;
      this.label = label

      this.object = fbx;
    })
  }

  loadElement() {
    this.loaded = this.loaded + 1;
    if(this.loaded === 2) {
      this.afterLoad();
      this.scene.add(this.object);
      this.scene.add(this.label);
    };
  }

  getMixer() {
    return this.mixers;
  }

  getObject() {
    return this.object;
  }
}

export default Soldier;
