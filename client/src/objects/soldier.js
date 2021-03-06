import * as Three from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import makeLabelCanvas from '../helpers/make-label-canvas';
class Soldier {
  constructor(scene, x, z, isLeft, id, attributes, isLocalArmy, afterLoad, camera) {
    this.id = id;
    this.attributes = attributes;
    this.position = { x, z };
    this.isLeft = isLeft;
    this.scene = scene;
    this.object = null;
    this.loaded = -1;
    this.afterLoad = afterLoad;
    this.isLocalArmy = isLocalArmy;
    this.camera = camera;

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
      this.object = fbx;

      const anim = new FBXLoader();

      this.animations = {}
      this.mixers = {};

      anim.setPath('/build/assets/models/animations/')
      anim.load('breathing-idle.fbx', anim => {
        this.mixers = {
          ...this.mixers,
          idle: new Three.AnimationMixer(this.object)
        }
        this.animations.idle = this.mixers.idle.clipAction(anim.animations[0])
        this.animations.idle.play()

        this.loadElement();
      })
      anim.load('clown-walk.fbx', anim => {
        this.mixers = {
          ...this.mixers,
          walk: new Three.AnimationMixer(this.object)
        }
        this.animations.walk = this.mixers.walk.clipAction(anim.animations[0])

        this.loadElement();
      })
      anim.load('death.fbx', anim => {
        this.mixers = {
          ...this.mixers,
          death: new Three.AnimationMixer(this.object)
        }
        this.animations.death = this.mixers.death.clipAction(anim.animations[0]);
        this.animations.death.clampWhenFinished = true;
        this.animations.death.loop = Three.LoopOnce;
        this.loadElement();
      })

      this.object = fbx;
    })
    if(this.isLocalArmy) {
      this.createLocator()
    }
    this.loadFont()
  }

  loadFont() {
    const fotnLoader = new Three.FontLoader()
    fotnLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/gentilis_bold.typeface.json', font => {
      this.font = font
      this.createLabel()
    })
  }

  createLocator() {
    this.ringSelection = new Three.RingGeometry(2, 2.5, 25)
    this.selectionMaterial = new Three.MeshBasicMaterial(
      { color: 0x00fa9a, side: Three.DoubleSide }
    )
    this.ringMesh = new Three.Mesh(this.ringSelection, this.selectionMaterial)
    this.ringMesh.position.set(this.object?.position.x || this.position.x, 0.2, this.object?.position.z || this.position.z)
    this.ringMesh.scale.set(2,2,2)
    this.ringMesh.rotateX(Three.MathUtils.degToRad(90))
  }

  updateLocator(x, z) {
    if(this.isLocalArmy) {
      this.ringMesh.position.set(x, this.ringMesh.position.y, z)
    }
  }

  createLabel() {
    if(this.font) {
      const textGeometry = new Three.TextGeometry(`${this.id}\n${this.attributes.damage} dmg\n${this.attributes.health} hp`, {
        font: this.font,
        size: 80,
        height: 1,
        curveSegments: 12,
        bevelEnabled: true
      });
      const textMaterial = new Three.MeshStandardMaterial({color: 0xf5debd3})
      const textMesh = new Three.Mesh(textGeometry, textMaterial)
      textMesh.castShadow = false;
      textMesh.receiveShadow = false;
      textMesh.position.set(this.object?.position.x || this.position.x, 15, this.object?.position.z || this.position.z)
      textMesh.scale.set(0.02, 0.02, 0.02)
      textMesh.rotateY(Three.MathUtils.degToRad(90))

      textMesh.quaternion.copy(this.camera.quaternion);

      this.label = textMesh
    }
  }

  loadElement() {
    this.loaded = this.loaded + 1;
    if(this.loaded === 2) {
      this.afterLoad();
      this.scene.add(this.object);
      this.scene.add(this.label);
      if(this.isLocalArmy) {
        this.scene.add(this.ringMesh)
      }
    };
  }

  getMixer() {
    return this.mixers;
  }

  getObject() {
    return this.object;
  }

  getLabel() {
    return this.label;
  }

  receiveDamage(damage) {
    const hp = this.attributes.health - damage
    this.attributes.health = hp < 0 ? 0 : hp
    this.scene.remove(this.label)
    this.createLabel()
    this.scene.add(this.label)

    if(hp <= 0) {
      this.scene.remove(this.label);
      this.scene.remove(this.ringMesh);
    }
  }
}

export default Soldier;
