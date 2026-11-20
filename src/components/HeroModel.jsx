import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import styles from './HeroModel.module.css'

/**
 * Renders the tessellated keyboard case over the hero slides.
 * Model: Keychron B1 Pro bottom case, converted from the public Keychron
 * hardware-design STEP file and used here for educational, non-commercial
 * purposes under the Keychron Source-Available License.
 */
function HeroModel() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 1.25, 2.35)
    camera.lookAt(0, 0, 0)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    host.appendChild(renderer.domElement)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
    keyLight.position.set(2.4, 3.2, 2.8)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xbfd4fa, 1.1)
    fillLight.position.set(-2.6, 1.2, 1.6)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x93b4f7, 1.6)
    rimLight.position.set(-1.4, -1.8, -2.2)
    scene.add(rimLight)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1d4ed8, 0.8))

    const group = new THREE.Group()
    scene.add(group)

    let disposed = false
    let frame = 0

    const loader = new GLTFLoader()
    loader.load(
      '/models/b1-pro-bottom-case.glb',
      (gltf) => {
        if (disposed) return

        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        model.position.sub(center)
        const largest = Math.max(size.x, size.y, size.z) || 1
        model.scale.setScalar(1.9 / largest)

        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#e2e9ff'),
              metalness: 0.55,
              roughness: 0.32,
            })
          }
        })

        group.add(model)
      },
      undefined,
      () => {
        // Silently fall back to the colour slides.
      },
    )

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

    const animate = () => {
      if (disposed) return
      const elapsed = clock.getElapsedTime()

      if (!reduceMotion) {
        group.rotation.y = elapsed * 0.22
        group.rotation.x = -0.05 + Math.sin(elapsed * 0.5) * 0.03
        group.position.y = Math.sin(elapsed * 0.8) * 0.02
      } else {
        group.rotation.x = -0.05
        group.rotation.y = -0.5
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()

      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material]
          materials.forEach((material) => material?.dispose())
        }
      })

      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={hostRef} className={styles.canvas} aria-hidden="true" />
}

export default HeroModel
