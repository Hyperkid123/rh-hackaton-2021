import * as Three from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import '../controls/OrbitControls';

const FOW = 60;
const ASPECT = 1920 / 1080;
const NEAR = 1.0;
const FAR = 1000.0

const mouse = new Three.Vector2(0, 0);

class World {
  constructor({world}) {
    this.init(({world}))
  }

  loadModel() {
    let mixer
    const loader = new FBXLoader();
    loader.load('/build/assets/models/dummy/xbot.fbx', (object) => {
      object.traverse((child) => {
        mixer = new Three.AnimationMixer(object)
        const action = mixer.clipAction(object.animations[0]);
        action.play()
        object.position.set(Math.random() * 25, 0, Math.random() * 25)
        object.scale.set(0.05,0.05,0.05)
        object.traverse((child) => {
          if(child.isMesch) {
            child.castShadow = true;
            child.receiveShadow = true
          }
        })
      })
      this.scene.add(object)
    })
  }

  onMouseMove( event ) {
    console.log(event.clientX, event.clientY, mouse)
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  init({world}) {
    this.threejs = new Three.WebGL1Renderer();
    this.threejs.shadowMap.enabled = true;
    this.threejs.shadowMap.type = Three.PCFShadowMap;
    this.threejs.setPixelRatio(window.devicePixelRatio);
    this.threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.threejs.domElement)
    window.addEventListener('resize', () => {
      this.onResize()
    }, false)

    document.body.addEventListener( 'mousemove', this.onMouseMove);

    this.camera = new Three.PerspectiveCamera(FOW, ASPECT, NEAR, FAR);
    this.camera.position.set(75, 20, 0);

    this.scene = new Three.Scene();

    let light = new Three.DirectionalLight(0xFFFFFF);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = NEAR;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = 200;
    light.shadow.camera.right = -200;
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    this.scene.add(light);

    light = new Three.AmbientLight(0x404040);
    this.scene.add(light)


    const controls = new Three.OrbitControls(
      this.camera,
      this.threejs.domElement
    )
    controls.target.set(0, 0, 0);
    controls.update();

    this.raycaster = new Three.Raycaster();

    const loader = new Three.CubeTextureLoader();
    const texture = loader.load([
      '/build/assets/skybox/bluecloud_bk.jpg',
      '/build/assets/skybox/bluecloud_ft.jpg',
      '/build/assets/skybox/bluecloud_up.jpg',
      '/build/assets/skybox/bluecloud_dn.jpg',
      '/build/assets/skybox/bluecloud_lf.jpg',
      '/build/assets/skybox/bluecloud_rt.jpg',
    ]);
    this.scene.background = texture;

    const sandTexture = new Three.TextureLoader().load( '/build/assets/textures/sand.jpeg' )
    const grassTexture = new Three.TextureLoader().load( '/build/assets/textures/grass.jpeg' )

    const textureMapper = {
      grass: grassTexture,
      sand: sandTexture
    }

    world.forEach((row, x) => {
      row.forEach((tile, y) => {
        const geometry = new Three.BoxGeometry( 10, 0, 10 );
        const material = new Three.MeshStandardMaterial( { map: textureMapper[tile.type]} );
        const cube = new Three.Mesh( geometry, material );
        cube.position.set(x * 10, 0, y * 10)
        cube.castShadow = false;
        cube.receiveShadow = true;
        this.scene.add( cube );
      })
    })

    /*const plane = new Three.Mesh(
      new Three.PlaneGeometry(100, 100, 1, 1),
      new Three.MeshStandardMaterial({
        color: 0xFFFFFF
      })
    )
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2
    this.scene.add(plane)*/

    this.raf()
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threejs.setSize(window.innerWidth, window.innerHeight)
  }

  raf() {
    requestAnimationFrame(() => {
      this.render();
      this.raf()
    })
  }

  render() {
    this.raycaster.setFromCamera( mouse, this.camera );

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects( this.scene.children );

    if ( intersects.length > 0 ) {
      if ( this.INTERSECTED != intersects[ 0 ].object ) {
        if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
        this.INTERSECTED = intersects[ 0 ].object;

        console.log(this.INTERSECTED)

        this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
        this.INTERSECTED.material.emissive.setHex( 0xff0000 );
      }
    } else {
      if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
      this.INTERSECTED = null;
    }

    this.threejs.render(this.scene, this.camera)
  }
}

export default World;
