import * as THREE from 'three'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050508)

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(0, 0, 200)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const geo = new THREE.SphereGeometry(5, 32, 32)
const mat = new THREE.MeshBasicMaterial({ color: 0xc8c3b4 })
const mesh = new THREE.Mesh(geo, mat)
scene.add(mesh)

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
