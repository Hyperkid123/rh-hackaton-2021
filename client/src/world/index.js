import * as Three from 'three';
import '../controls/OrbitControls';

const FOW = 60;
const ASPECT = 1920 / 1080;
const NEAR = 1.0;
const FAR = 1000.0

class World {
  constructor() {
    this.init()
  }

  init() {
    this.threejs = new Three.WebGL1Renderer();
    this.threejs.shadowMap.enabled = true;
    this.threejs.shadowMap.type = Three.PCFShadowMap;
    this.threejs.setPixelRatio(window.devicePixelRatio);
    this.threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.threejs.domElement)
    window.addEventListener('resize', () => {
      this.onResize()
    }, false)

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

    this.raf()
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threejs.setSize(window.innerWidth, window.innerHeight)
  }

  raf() {
    requestAnimationFrame(() => {
      this.threejs.render(this.scene, this.camera)
      this.raf()
    })
  }
}

export default World;
