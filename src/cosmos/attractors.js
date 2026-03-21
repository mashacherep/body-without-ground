import * as THREE from 'three'

const LORENZ_TRAIL = 2000
const ROSSLER_TRAIL = 1500

const lorenz = {
  x: 0.1, y: 0, z: 0,
  sigma: 10, rho: 28, beta: 8 / 3,
  dt: 0.003,
}

const rossler = {
  x: 1, y: 1, z: 1,
  a: 0.2, b: 0.2, c: 5.7,
  dt: 0.008,
}

let lorenzLine, rosslerLine
let lorenzPositions, rosslerPositions
let lorenzIdx = 0, rosslerIdx = 0

export function initAttractors(scene) {
  // Lorenz trail
  const lorenzGeo = new THREE.BufferGeometry()
  lorenzPositions = new Float32Array(LORENZ_TRAIL * 3)
  lorenzGeo.setAttribute('position', new THREE.BufferAttribute(lorenzPositions, 3))

  for (let i = 0; i < LORENZ_TRAIL; i++) {
    stepLorenz()
    const scale = 1.2
    lorenzPositions[i * 3]     = lorenz.x * scale
    lorenzPositions[i * 3 + 1] = lorenz.z * scale - 30
    lorenzPositions[i * 3 + 2] = lorenz.y * scale
  }

  lorenzLine = new THREE.Line(
    lorenzGeo,
    new THREE.LineBasicMaterial({
      color: 0x4a80c0,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    })
  )
  scene.add(lorenzLine)

  // Rossler trail
  const rosslerGeo = new THREE.BufferGeometry()
  rosslerPositions = new Float32Array(ROSSLER_TRAIL * 3)
  rosslerGeo.setAttribute('position', new THREE.BufferAttribute(rosslerPositions, 3))

  for (let i = 0; i < ROSSLER_TRAIL; i++) {
    stepRossler()
    const scale = 1.8
    rosslerPositions[i * 3]     = rossler.x * scale - 40
    rosslerPositions[i * 3 + 1] = rossler.z * scale - 20
    rosslerPositions[i * 3 + 2] = rossler.y * scale
  }

  rosslerLine = new THREE.Line(
    rosslerGeo,
    new THREE.LineBasicMaterial({
      color: 0xc89650,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    })
  )
  scene.add(rosslerLine)
}

function stepLorenz() {
  const L = lorenz
  const dx = L.sigma * (L.y - L.x) * L.dt
  const dy = (L.x * (L.rho - L.z) - L.y) * L.dt
  const dz = (L.x * L.y - L.beta * L.z) * L.dt
  L.x += dx; L.y += dy; L.z += dz
}

function stepRossler() {
  const R = rossler
  const dx = (-R.y - R.z) * R.dt
  const dy = (R.x + R.a * R.y) * R.dt
  const dz = (R.b + R.z * (R.x - R.c)) * R.dt
  R.x += dx; R.y += dy; R.z += dz
}

export function updateAttractors(cpuPressure, batteryLevel) {
  lorenz.rho = 28 + cpuPressure * 8
  const batteryMod = 0.5 + batteryLevel * 0.5
  lorenz.dt = 0.003 * batteryMod
  rossler.dt = 0.008 * batteryMod

  for (let s = 0; s < 4; s++) {
    stepLorenz()
    stepRossler()
  }

  const li = (lorenzIdx % LORENZ_TRAIL)
  const scale = 1.2
  lorenzPositions[li * 3]     = lorenz.x * scale
  lorenzPositions[li * 3 + 1] = lorenz.z * scale - 30
  lorenzPositions[li * 3 + 2] = lorenz.y * scale
  lorenzIdx++
  lorenzLine.geometry.attributes.position.needsUpdate = true

  const ri = (rosslerIdx % ROSSLER_TRAIL)
  const rscale = 1.8
  rosslerPositions[ri * 3]     = rossler.x * rscale - 40
  rosslerPositions[ri * 3 + 1] = rossler.z * rscale - 20
  rosslerPositions[ri * 3 + 2] = rossler.y * rscale
  rosslerIdx++
  rosslerLine.geometry.attributes.position.needsUpdate = true
}

export function getLorenzState() { return lorenz }
export function getRosslerState() { return rossler }
