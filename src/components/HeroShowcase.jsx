import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import styles from './HeroShowcase.module.css'

// The four colourways straight from src/lofree_flow_lineup.
import flow84 from '../lofree_flow_lineup/glb/flow84_black.glb?url'
import flow100 from '../lofree_flow_lineup/glb/flow100_white.glb?url'
import flowLite84 from '../lofree_flow_lineup/glb/flow_lite84_flamingo.glb?url'
import flow2 from '../lofree_flow_lineup/glb/flow2_84_space_gray.glb?url'

const MODELS = [flow84, flow100, flowLite84, flow2]

// Pick the model that matches the product name on the current slide.
function modelIndexForName(name = '') {
  const value = name.toLowerCase()
  if (value.includes('lite')) return 2
  if (value.includes('100')) return 1
  if (value.includes('84')) return 0
  return 3
}

function createShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(128, 128, 6, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.28)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

function HeroShowcase({ activeName = '' }) {
  const hostRef = useRef(null)
  const activeRef = useRef(modelIndexForName(activeName))

  useEffect(() => {
    activeRef.current = modelIndexForName(activeName)
  }, [activeName])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
    camera.position.set(0.45, 0.95, 2.85)
    camera.lookAt(0, -0.08, 0)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = new RoomEnvironment()
    const envTexture = pmrem.fromScene(environment, 0.04).texture
    scene.environment = envTexture
    // Reflections only: low IBL keeps the key light's falloff readable.
    scene.environmentIntensity = 0.32

    // Soft overhead key — the "shine down" — angled slightly forward so the
    // top faces catch light and the front edge stays legible.
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.85)
    keyLight.position.set(0.6, 4.4, 1.5)
    scene.add(keyLight)

    // Faint cool bounce from the front so the underside is not crushed.
    const bounceLight = new THREE.DirectionalLight(0xbcd2ff, 0.46)
    bounceLight.position.set(0.4, -1.6, 2.4)
    scene.add(bounceLight)

    // Narrow rim from behind to separate the board from the dark stage.
    const rimLight = new THREE.DirectionalLight(0x9dbcff, 0.9)
    rimLight.position.set(-2.6, 1.6, -2.6)
    scene.add(rimLight)

    scene.add(new THREE.AmbientLight(0xffffff, 0.12))

    const shadowTexture = createShadowTexture()
    shadowTexture.colorSpace = THREE.SRGBColorSpace
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.7),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -0.33
    scene.add(shadow)

    const groups = MODELS.map(() => {
      const group = new THREE.Group()
      group.visible = false
      scene.add(group)
      return group
    })
    const progress = MODELS.map(() => 0)
    const timers = []
    const loader = new GLTFLoader()
    let disposed = false

    MODELS.forEach((file, index) => {
      timers.push(
        setTimeout(() => {
          if (disposed) return

          loader.load(
            file,
            (gltf) => {
              if (disposed) return

              const model = gltf.scene
              // The lineup is modelled Z-up; glTF viewers expect Y-up.
              model.rotation.x = -Math.PI / 2
              model.updateMatrixWorld(true)

              const firstBox = new THREE.Box3().setFromObject(model)
              const firstSize = firstBox.getSize(new THREE.Vector3())
              const width = Math.max(firstSize.x, firstSize.z) || 1
              model.scale.setScalar(1.45 / width)
              model.updateMatrixWorld(true)

              const box = new THREE.Box3().setFromObject(model)
              const center = box.getCenter(new THREE.Vector3())
              model.position.sub(center)

              model.traverse((child) => {
                if (child.isMesh) {
                  child.material = child.material.clone()
                  child.material.transparent = true
                  child.material.opacity = 0
                }
              })

              groups[index].add(model)
            },
            undefined,
            () => {
              // Missing model: the colour slide stays behind the canvas.
            },
          )
        }, index * 320),
      )
    })

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const clock = new THREE.Clock()
    let frame = 0

    const animate = () => {
      if (disposed) return

      const elapsed = clock.getElapsedTime()
      const target = activeRef.current

      groups.forEach((group, index) => {
        const goal = index === target ? 1 : 0
        // Fade the outgoing model faster than the incoming one.
        const speed = goal > progress[index] ? 0.12 : 0.34
        progress[index] += (goal - progress[index]) * speed

        const amount = progress[index]
        group.visible = amount > 0.02
        if (!group.visible) return

        group.scale.setScalar(0.96 + 0.04 * amount)
        group.position.y = -0.12 * (1 - amount)
        // Slow, unhurried sway (≈22 s per sweep) so the board feels premium.
        group.rotation.y = reduceMotion
          ? -0.45
          : -0.45 + Math.sin(elapsed * 0.14) * 0.26
        group.rotation.x = 0.1

        group.traverse((child) => {
          if (child.isMesh) child.material.opacity = amount
        })
      })

      shadow.material.opacity = 0.34 * progress[target]
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      timers.forEach(clearTimeout)
      observer.disconnect()

      groups.forEach((group) => {
        group.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose()
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material]
            materials.forEach((material) => material?.dispose())
          }
        })
      })

      shadowTexture.dispose()
      shadow.geometry.dispose()
      shadow.material.dispose()
      envTexture.dispose()
      pmrem.dispose()
      environment.dispose?.()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={hostRef} className={styles.showcase} aria-hidden="true" />
}

export default HeroShowcase
