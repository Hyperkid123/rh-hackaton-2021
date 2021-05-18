import * as Three from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import '../controls/OrbitControls';
import RangeMesh from '../movement/calculate-ragne';

const updateUi = (attribute, value) => {
  document.getElementById(attribute).textContent = value;
}

const FOW = 60;
const ASPECT = 1920 / 1080;
const NEAR = 1.0;
const FAR = 1000.0

const mouse = new Three.Vector2(0, 0);

const soldiers = {};
class World {
  constructor({world, emitSelect}) {
    this.emitSelect = emitSelect
    this.ringSelection = new Three.RingGeometry(2, 2.5, 10)
    this.selectionMaterial = new Three.MeshBasicMaterial(
      { color: 0xffff00, side: Three.DoubleSide }
    )
    this.ringMesh = new Three.Mesh(this.ringSelection, this.selectionMaterial)
    this.ringMesh.position.set(0,0.25,0)
    this.ringMesh.scale.set(2,2,2)
    this.ringMesh.rotateX(Three.MathUtils.degToRad(90))
    this.ringMesh.visible = false;
    this.selectedMinionId = null;
    this.rangeMesh = new RangeMesh()

    this.init(({world}))
  }

  loadUser(user) {
    user.army.forEach(({position: {x, z}, attributes, id}) => {
      this.loadModel(x * 10 , z * 10, user.startingPosition === 'left', id, attributes)
    })
  }

  updateUsers(users) {
    users.forEach(({ army }) => army.forEach(({ isSelected, id, ...rest }) => {
      const model = soldiers[id];
      if(model) {
        if(isSelected) {
          const {position: {x, z} } = rest
          updateUi('selected-position', `${x}x ${z}z`)
          this.ringMesh.visible = true;
          this.ringMesh.position.set(x * 10, this.ringMesh.position.y, z * 10)
          this.rangeMesh.showRange(model.attributes.speed, { x, z })
        }
      }
    }))
  }

  loadModel(x, z, isLeft, id, attributes) {
    let mixer
    const loader = new FBXLoader();
    loader.load('/build/assets/models/dummy/xbot.fbx', (object) => {
      object.traverse((child) => {
        mixer = new Three.AnimationMixer(object)
        const action = mixer.clipAction(object.animations[0]);
        action.play()
        object.position.set(x, 0, z)
        object.scale.set(0.05,0.05,0.05)
        object.rotateY(isLeft ? 90 : 0)
        object.traverse((child) => {
          if(child.isMesch) {
            child.castShadow = true;
            child.receiveShadow = true
          }
        })
      })
      soldiers[id] = {
        attributes,
        object,
      }
      this.scene.add(object)
    })
  }

  onMouseMove( event ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  onClick() {
    if(!this.INTERSECTED) {
      return
    }
    const x = this.INTERSECTED.position.x / 10
    const y = this.INTERSECTED.position.z / 10
    this.emitSelect(x, y)
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
    document.body.addEventListener('click', this.onClick.bind(this))

    this.camera = new Three.PerspectiveCamera(FOW, ASPECT, NEAR, FAR);
    this.camera.position.set(100, 120, 100);

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

    this.controls = new Three.OrbitControls(
      this.camera,
      this.threejs.domElement
    )
    this.controls.target.set(50, 0, 100)
    /*
     * Forbid the camera to "go bellow the ground".
     * Math.PI/2 limits the camera angle exactly to the ground level.
     * We keep it at 2.5 which will leave the camera at a slight angle for better orientation
    */
    this.controls.maxPolarAngle = Math.PI/2.5
    this.controls.update();

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
        cube.userData.isDesk = true
        this.scene.add( cube );
      })
    })


    const grassTextureRepeat = new Three.TextureLoader().load( '/build/assets/textures/grass.jpeg' )
    grassTextureRepeat.wrapS = Three.RepeatWrapping;
    grassTextureRepeat.wrapT = Three.RepeatWrapping;
    grassTextureRepeat.repeat.x = 100;
    grassTextureRepeat.repeat.y = 100;

    const geometry = new Three.PlaneGeometry( 1000, 1000  );
    const material = new Three.MeshBasicMaterial( { map: grassTextureRepeat, side: Three.DoubleSide} );
    const plane = new Three.Mesh( geometry, material );
    plane.position.set(0, -0.1, 0);
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add( plane );

    this.scene.add(this.ringMesh)
    this.scene.add(this.rangeMesh.getMesh())
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
      const tile = intersects.find(({ object } = {}) => object?.userData?.isDesk === true)
      if ( this.INTERSECTED != tile?.object ) {
        if ( this.INTERSECTED  ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
        if(tile) {
          this.INTERSECTED = tile.object;  
          this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
          this.INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
      }
    } else {
      if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
      this.INTERSECTED = null;
    }

    this.threejs.render(this.scene, this.camera)
  }
}

export default World;
