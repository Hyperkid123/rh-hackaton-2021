import * as Three from 'three';

class RangeMesh {
  constructor() {
    this.geometry = new Three.RingGeometry(0, 1.55, 4);
    this.rangeMaterial = new Three.MeshStandardMaterial({
      opacity: 0.5,
      transparent: true,
      color: 0xffffff,
      side: Three.DoubleSide
    })
    this.rangeMesh = new Three.Mesh(this.geometry, this.rangeMaterial)
    this.rangeMesh.position.set(0,0.25,0)
    this.rangeMesh.scale.set(1,1,1)
    this.rangeMesh.rotateX(Three.MathUtils.degToRad(90))
    this.rangeMesh.rotateZ(Three.MathUtils.degToRad(45))
  }

  getMesh() {
    return this.rangeMesh
  }

  showRange(speed, { x, z }) {
    this.rangeMesh.scale.set(speed * 10, speed * 10, speed * 10)
    this.rangeMesh.position.set(x * 10, this.rangeMesh.position.y, z * 10)
  }
}

export default RangeMesh;
