import * as Three from 'three';
import * as TWEEN from 'tween';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import '../controls/OrbitControls';
import RangeMesh from '../movement/calculate-ragne';

import Soldier from '../objects/soldier';
import Tree from '../objects/tree';

const updateUi = (attribute, value) => {
  document.getElementById(attribute).textContent = value;
}

const setAttribute = (id, attribute, value) => {
  document.getElementById(id)[attribute] = value;
}

const FOW = 60;
const ASPECT = 1920 / 1080;
const NEAR = 1.0;
const FAR = 1000.0

const mouse = new Three.Vector2(0, 0);

const originalColor = new Three.Color("rgb(255, 255, 255)");

const soldiers = {};
class World {
  constructor({world, emitSelect, isPlayer}) {
    this.emitSelect = emitSelect
    this.isPlayer = isPlayer
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
    this.rangeMesh = new RangeMesh();
    this.isActive = false;
    this.mixers = {}

    this.init(({world}))
  }

  onAttack({x, z}) {
    var audio = new Audio('/build/assets/sounds/spell.wav');
    audio.play();

    const explosion = new Three.Mesh(
      new Three.SphereGeometry(5, 11, 11),
      new Three.MeshBasicMaterial({color: 0xFF0000, transparent: true, opacity: 1})
    )

    explosion.position.set(x * 10, 5, z * 10);
    explosion.scale.set(1,1,1);

    let opacity = {opacity: 1};
    const animation = new TWEEN.Tween(opacity).to({opacity: 0}, 1500);
    animation.onUpdate(() => {
      explosion.material.setValues(opacity)
    })
    animation.start();

    this.scene.add(explosion);
  }

  setActive(active) {
    this.isActive = active
  }

  loadUser(user) {
    user.army.forEach(({position: {x, z}, attributes, id}) => {
      this.loadModel(x * 10 , z * 10, user.startingPosition === 'left', id, attributes)
    })
  }

  updateUsers(users) {
    let selected;

    users.forEach((user) => {
      const found = !selected && user.army.find(({isSelected}) => isSelected);
      selected = found || selected;
    });

    if(selected) {
      const { id, ...rest } = selected;
      const {position: {x, z} } = rest

      const model = soldiers[id];
      this.ringMesh.position.set(x * 10, this.ringMesh.position.y, z * 10)
      this.selectedMinionId = id;
      this.ringMesh.visible = true;
      this.rangeMesh.showRange(selected.attributes.remainingSpeed, { x, z });
    } else {
      this.ringMesh.visible = false;
      this.rangeMesh.showRange(0, { x: 0, z: 0 });
    }
  }

  moveMinion({old, new: newPosition, id, dist}) {
    const position = { ...soldiers[id].object.position };
    const animation = new TWEEN.Tween(position).to({x: newPosition.x * 10, z: newPosition.z * 10}, dist * 600);
    animation.onUpdate(() => {
      soldiers[id].object.position.set(position.x, 0, position.z)
      soldiers[id].label.position.x = position.x
      soldiers[id].label.position.z = position.z
    })
    animation.onComplete(() => {
      soldiers[id].animations?.idle.play()
      soldiers[id].animations?.walk.stop()
    })
    animation.onStart(() => {
      soldiers[id].animations?.idle.stop()
      soldiers[id].animations?.walk.play()
    })
    animation.start();
  }

  loadModel(x, z, isLeft, id, attributes) {
    const soldier = new Soldier(this.scene, x, z, isLeft, id, attributes, () => {
      this.mixers[id] = soldier.getMixer();
      soldiers[id] = soldier;
    });
  };

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
    if(this.isActive) {
      this.emitSelect(x, y)
    }
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

    let light = new Three.DirectionalLight(0xFFFFFF, 0.8);
    light.position.set(100, 500, -500);
    light.target.position.set(100, 0, -300);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = NEAR;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = 1000;
    light.shadow.camera.right = -1000;
    light.shadow.camera.top = 1000;
    light.shadow.camera.bottom = -1000;
    this.scene.add(light);

    light = new Three.AmbientLight(0xFFFFFF, 0.8);
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
    this.controls.maxDistance = 500
    this.controls.minDistance = 10
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
        const geometry = new Three.PlaneGeometry( 10, 10 );
        const material = new Three.MeshStandardMaterial( { map: textureMapper[tile.type]} );
        const cube = new Three.Mesh( geometry, material );
        cube.position.set(x * 10, 0, y * 10)
        cube.castShadow = false;
        cube.receiveShadow = true;
        cube.rotation.x = -Math.PI / 2;
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
    const material = new Three.MeshStandardMaterial( { map: grassTextureRepeat, side: Three.DoubleSide} );
    const plane = new Three.Mesh( geometry, material );
    plane.position.set(0, -0.1, 0);
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add( plane );

    this.scene.add(this.ringMesh)
    this.scene.add(this.rangeMesh.getMesh())


    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    let initialX = -300;
    let initialY = -300;

    while(initialY <= 500) {
      while(initialX <= 500) {
        if(!(initialY < 210 && initialY > -10 && initialX > -10 && initialX < 110)) {
          new Tree(this.scene, initialX, initialY, objLoader, mtlLoader)
        }
        initialX += 25;
      }

      initialY += 25;
      initialX = -300;
    }

    const near = 150;
    const far = 900;
    const color = 'lightblue';
    this.scene.fog = new Three.Fog(color, near, far);

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

  step() {
    /**
     * slow down the animation
     */
    Object.values(this.mixers).forEach((mixer) => {
      mixer.idle?.update(0.01)
      mixer.walk?.update(1.02)
    })
  }

  render(t) {
    this.raycaster.setFromCamera( mouse, this.camera );

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects( this.scene.children );

    if ( intersects.length > 0 ) {
      const tile = intersects.find(({ object } = {}) => object?.userData?.isDesk === true)
      if ( this.INTERSECTED != tile?.object ) {
        if ( this.INTERSECTED  ) {          
          this.INTERSECTED.material.setValues( {color: originalColor} );
          this.INTERSECTED = null
        }
        if(tile) {
          this.INTERSECTED = tile.object;
          this.INTERSECTED.material.setValues( { color: 0xFF0000 } );
        }
      }
    } else {
      if ( this.INTERSECTED ) this.INTERSECTED.material.setValues( {color: originalColor} );
      this.INTERSECTED = null;
    }

    TWEEN.update();
    this.step()
    this.threejs.render(this.scene, this.camera)
  }
}

export default World;
