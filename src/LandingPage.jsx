import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon } from './components/Icons'
import { CATEGORIES, PRODUCTS } from './data/products'
import styles from './LandingPage.module.css'

const FEATURED = [
  {
    id: 'nova-75',
    label: 'Nova 75',
    name: 'ClackLabs Nova 75',
    description:
      'A 75% aluminum board with a gasket mount, hot-swap sockets and a rotary knob.',
    image: '#1d4ed8',
  },
  {
    id: 'atlas-tkl',
    label: 'Atlas TKL',
    name: 'ClackLabs Atlas TKL',
    description:
      'Tenkeyless steel plate and PBT caps for a firm, consistent typing feel.',
    image: '#2563eb',
  },
  {
    id: 'flux-60',
    label: 'Flux 60',
    name: 'ClackLabs Flux 60 HE',
    description:
      'Hall-effect switches with per-key actuation from 0.1mm and rapid trigger.',
    image: '#3b82f6',
  },
  {
    id: 'pulse-87',
    label: 'Pulse 87',
    name: 'ClackLabs Pulse 87 HE',
    description:
      'A TKL magnetic board with a configurable actuation curve and 4kHz polling.',
    image: '#60a5fa',
  },
  {
    id: 'linear-45g',
    label: 'Linear 45g',
    name: 'ClackLabs Linear 45g',
    description:
      'Smooth linear switches, 45g bottom-out, factory pre-lubed and ready to drop in.',
    image: '#1e40af',
  },
  {
    id: 'tactile-55g',
    label: 'Tactile 55g',
    name: 'ClackLabs Tactile 55g',
    description:
      'A round tactile bump with a short 3.6mm travel for confident, quiet typing.',
    image: '#1d4ed8',
  },
  {
    id: 'pbt-cherry',
    label: 'PBT Cherry',
    name: 'ClackLabs PBT Cherry Beige',
    description:
      'Double-shot PBT in Cherry profile with warm beige alphas and deep legends.',
    image: '#3b82f6',
  },
  {
    id: 'pbt-ocean',
    label: 'PBT Ocean',
    name: 'ClackLabs PBT OEM Blue Ocean',
    description:
      'An OEM profile set in a deep blue and cream colorway, built to last.',
    image: '#2563eb',
  },
]

const HERO_DELAY_MS = 5000

const SHOWCASE_CATEGORIES = CATEGORIES.slice(0, 4)

// Five hero images — flat colors until the real exports land.
const HERO_SLIDES = [
  { id: 'nova', color: '#1d4ed8' },
  { id: 'flux', color: '#2563eb' },
  { id: 'pulse', color: '#0b2a5b' },
  { id: 'pbt', color: '#1e40af' },
  { id: 'keycaps', color: '#3b82f6' },
]

function productIdForLabel(label) {
  const needle = label.toLowerCase()
  const direct = PRODUCTS.find((product) =>
    product.name.toLowerCase().includes(needle),
  )
  if (direct) return direct.id

  const lastWord = needle.split(' ').pop()
  return (
    PRODUCTS.find((product) => product.name.toLowerCase().includes(lastWord))
      ?.id ?? null
  )
}

function LandingPage({ onNavigate }) {
  const [active, setActive] = useState(0)
  const [heroIndex, setHeroIndex] = useState(0)

  const viewportRef = useRef(null)
  const cardRefs = useRef([])
  const barRef = useRef(null)

  // Hero carousel — 5s per slide, always advancing while the page is open.
  // No hover pause: the hero fills the viewport, so a pointer resting on it
  // would otherwise stall the carousel permanently.
  useEffect(() => {
    const start = performance.now()
    let raf = 0

    function tick(now) {
      const progress = Math.min(1, (now - start) / HERO_DELAY_MS)
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`
      }
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const timer = setTimeout(() => {
      setHeroIndex((current) => (current + 1) % HERO_SLIDES.length)
    }, HERO_DELAY_MS)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [heroIndex])

  // Track which card is closest to the middle of the carousel.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined

    let frame = 0

    function update() {
      frame = 0
      const center = viewport.scrollLeft + viewport.clientWidth / 2
      let nearest = 0
      let nearestDistance = Infinity

      cardRefs.current.forEach((card, index) => {
        if (!card) return
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - center)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = index
        }
      })

      setActive(nearest)
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  function goTo(index) {
    const viewport = viewportRef.current
    const card = cardRefs.current[index]
    if (!viewport || !card) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  function step(direction) {
    const next = Math.min(Math.max(active + direction, 0), FEATURED.length - 1)
    goTo(next)
  }

  function openCatalogue(category) {
    onNavigate?.('catalogue', category)
  }

  return (
    <div className={styles.landingPage}>
      <section
        className={styles.hero}
        aria-roledescription="carousel"
        aria-label="Featured images"
      >
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={
              index === heroIndex
                ? `${styles.heroSlide} ${styles.heroSlideActive}`
                : styles.heroSlide
            }
            style={{ backgroundColor: slide.color }}
            aria-hidden={index !== heroIndex}
          />
        ))}

        <div className={styles.heroDots}>
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              className={
                index === heroIndex
                  ? `${styles.heroDot} ${styles.heroDotActive}`
                  : styles.heroDot
              }
              type="button"
              onClick={() => setHeroIndex(index)}
              aria-label={`Show image ${index + 1} of ${HERO_SLIDES.length}`}
              aria-current={index === heroIndex ? 'true' : undefined}
            >
              <span className={styles.heroDotTrack}>
                {index === heroIndex ? (
                  <span
                    key={heroIndex}
                    ref={(node) => {
                      barRef.current = node
                    }}
                    className={styles.heroDotProgress}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.featuredProducts}>
        <div className={styles.frame}>
          <div className={styles.productName}>Featured Products</div>
        </div>

        <div className={styles.carouselStage}>
          <div
            className={styles.carouselViewport}
            ref={viewportRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured products"
            tabIndex={0}
          >
            <div className={styles.carousel}>
              {FEATURED.map((product, index) => (
                <article
                  className={[
                    styles.featuredCard,
                    index === 0 ? styles.featuredCardFirst : '',
                    index === FEATURED.length - 1
                      ? `${styles.featuredCardLast} ${styles.featuredCardReversed}`
                      : '',
                    index === active ? '' : styles.featuredCardMuted,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={product.id}
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  aria-current={index === active ? 'true' : undefined}
                >
                  <div
                    className={styles.featuredCardChild}
                    style={{ backgroundColor: product.image }}
                    aria-hidden="true"
                  />
                  <div className={styles.frameParent}>
                    <div className={styles.productNameWrapper}>
                      <div className={styles.productName}>{product.name}</div>
                    </div>
                    <div className={styles.productDescriptionWrapper}>
                      <div className={styles.productDescription}>
                        {product.description}
                      </div>
                    </div>
                    <div className={styles.frameWrapper}>
                      <button
                        className={styles.shopNowWrapper}
                        type="button"
                        onClick={() => {
                          const id = productIdForLabel(product.label)
                          if (id) {
                            onNavigate?.('product', null, '', id)
                          } else {
                            openCatalogue('Mechanical Keyboards')
                          }
                        }}
                      >
                        <span className={styles.productName}>Shop Now</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {/* Trailing room so the last card can sit against the right
                  gutter (a flex item's end margin does not extend the range) */}
              <span className={styles.carouselSpacer} aria-hidden="true" />
            </div>
          </div>

          <div
            className={
              active === FEATURED.length - 1
                ? `${styles.carouselArrows} ${styles.carouselArrowsEnd}`
                : styles.carouselArrows
            }
          >
            <button
              className={styles.carouselArrow}
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous product"
              disabled={active === 0}
            >
              <ArrowRightIcon className={styles.arrowLeft} />
            </button>
            <button
              className={styles.carouselArrow}
              type="button"
              onClick={() => step(1)}
              aria-label="Next product"
              disabled={active === FEATURED.length - 1}
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        <div className={styles.progressGroup}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressThumb}
              style={{
                width: `${100 / FEATURED.length}%`,
                left: `${(active * 100) / FEATURED.length}%`,
              }}
            />
          </div>

          <div className={styles.chips}>
            {FEATURED.map((product, index) => (
              <button
                className={
                  index === active
                    ? `${styles.chip} ${styles.chipActive}`
                    : styles.chip
                }
                type="button"
                key={product.id}
                onClick={() => goTo(index)}
                aria-pressed={index === active}
              >
                <span className={styles.chipDot} />
                {product.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featuredProducts3}>
        <div className={styles.frame2}>
          <div className={styles.shopByCategoryWrapper}>
            <div className={styles.productName}>Shop by Category</div>
          </div>

          <div className={styles.categoryGroupParent}>
            {SHOWCASE_CATEGORIES.map((category, index) => (
              <div
                className={
                  [
                    styles.categoryGroup,
                    styles.categoryGroup2,
                    styles.categoryGroup3,
                    styles.categoryGroup4,
                  ][index]
                }
                key={category}
              >
                <div className={styles.category}>
                  <div className={styles.frameParent2}>
                    <div className={styles.productNameWrapper}>
                      <div className={styles.productName}>{category}</div>
                    </div>
                    <div className={styles.productDescriptionWrapper}>
                      <div className={styles.productDescription}>
                        Category Description
                      </div>
                    </div>
                    <div className={styles.frameWrapper3}>
                      <button
                        className={styles.exploreParent}
                        type="button"
                        onClick={() => openCatalogue(category)}
                      >
                        <span className={styles.productName}>Explore</span>
                        <ArrowRightIcon className={styles.arrowRightIcon} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage
