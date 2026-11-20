import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
const HeroModel = lazy(() => import('./components/HeroModel'))
const HeroShowcase = lazy(() => import('./components/HeroShowcase'))
import { ArrowRightIcon } from './components/Icons'
import { formatPrice, productsInCategory } from './data/products'
import { useProducts } from './productsStore'
import styles from './LandingPage.module.css'

const HERO_DELAY_MS = 5000

// Pinned: the 3D hero is built but switched off for now. Flip to true (and
// keep public/models/b1-pro-bottom-case.glb present) to bring it back.
const HERO_MODEL_ENABLED = false

// Cinematic dark stage per slide: base colour, light tint and glow.
const HERO_PALETTE = [
  { background: '#05070f', accent: '#3b82f6', glow: 'rgba(59, 130, 246, 0.32)' },
  { background: '#0d0710', accent: '#f472b6', glow: 'rgba(244, 114, 182, 0.26)' },
  { background: '#08090f', accent: '#93c5fd', glow: 'rgba(147, 197, 253, 0.24)' },
  { background: '#06090f', accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.26)' },
]

// Hero palette (design colours, not product data).
const HERO_SLIDES = [
  { id: 'nova', color: '#1d4ed8' },
  { id: 'flux', color: '#2563eb' },
  { id: 'pulse', color: '#0b2a5b' },
  { id: 'pbt', color: '#1e40af' },
  { id: 'keycaps', color: '#3b82f6' },
]

function LandingPage({ onNavigate }) {
  const { products, categories } = useProducts()
  const [active, setActive] = useState(0)
  const [heroIndex, setHeroIndex] = useState(0)
  const viewportRef = useRef(null)
  const cardRefs = useRef([])
  const barRef = useRef(null)

  // One pick per category, topped up from the catalogue if needed.
  const featured = useMemo(() => {
    if (products.length === 0) return []

    const picks = []
    const used = new Set()

    for (const entry of categories) {
      const match = products.find(
        (product) => product.category === entry.name && !used.has(product.id),
      )
      if (match) {
        picks.push(match)
        used.add(match.id)
      }
      if (picks.length === 5) break
    }

    for (const product of products) {
      if (picks.length === 5) break
      if (!used.has(product.id)) {
        picks.push(product)
        used.add(product.id)
      }
    }

    return picks.slice(0, 5)
  }, [products, categories])

  const showcaseCategories = categories.slice(0, 4)
  const featuredCount = featured.length || HERO_SLIDES.length

  // The hero shows the Lofree keyboards from the database (up to 4), falling
  // back to the design palette when none are present.
  const heroSlides = useMemo(() => {
    const lofree = products.filter(
      (product) =>
        /lofree/i.test(product.name) && /keyboard/i.test(product.category),
    )

    if (lofree.length > 0) {
      return lofree.slice(0, 4).map((product, index) => ({
        id: product.id,
        color: product.image,
        name: product.name,
        priceCents: product.priceCents,
        eyebrow: 'Lofree collection',
        ...HERO_PALETTE[index % HERO_PALETTE.length],
      }))
    }

    return HERO_SLIDES.map((slide) => ({
      id: slide.id,
      color: slide.color,
      name: null,
    }))
  }, [products])

  const heroCount = heroSlides.length
  const heroPosition = heroIndex % heroCount

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
      setHeroIndex((current) => (current + 1) % heroCount)
    }, HERO_DELAY_MS)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [heroIndex, heroCount])

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
    const next = Math.min(Math.max(active + direction, 0), featured.length - 1)
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
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={
              index === heroPosition
                ? `${styles.heroSlide} ${styles.heroSlideActive}`
                : styles.heroSlide
            }
            style={{
              backgroundColor: slide.background ?? slide.color,
              '--hero-glow': slide.glow,
              '--hero-accent': slide.accent,
            }}
            aria-hidden={index !== heroPosition}
            inert={index !== heroPosition}
          >
            {slide.name ? (
              <div className={styles.heroContent}>
                <p className={styles.heroEyebrow}>{slide.eyebrow}</p>
                <h1 className={styles.heroTitle}>{slide.name}</h1>
                <p className={styles.heroPrice}>
                  {formatPrice(slide.priceCents)}
                </p>
                <button
                  className={styles.heroCta}
                  type="button"
                  onClick={() => onNavigate?.('product', null, '', slide.id)}
                >
                  Shop now
                </button>
              </div>
            ) : null}
          </div>
        ))}

        <Suspense fallback={null}>
          <HeroShowcase activeName={heroSlides[heroPosition]?.name ?? ''} />
        </Suspense>

        <div className={styles.heroVignette} aria-hidden="true" />

        <div className={styles.heroGrain} aria-hidden="true" />

        {HERO_MODEL_ENABLED ? (
          <Suspense fallback={null}>
            <HeroModel />
          </Suspense>
        ) : null}

        {HERO_MODEL_ENABLED ? (
          <a
            className={styles.heroCredit}
            href="https://github.com/Keychron/Keychron-Keyboards-Hardware-Design"
            target="_blank"
            rel="noreferrer"
          >
            3D model: Keychron B1 Pro — educational use
          </a>
        ) : null}

        <div className={styles.heroDots}>
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              className={
                index === heroPosition
                  ? `${styles.heroDot} ${styles.heroDotActive}`
                  : styles.heroDot
              }
              type="button"
              onClick={() => setHeroIndex(index)}
              aria-label={`Show image ${index + 1} of ${heroSlides.length}`}
              aria-current={index === heroPosition ? 'true' : undefined}
            >
              <span className={styles.heroDotTrack}>
                {index === heroIndex ? (
                  <span
                    key={heroPosition}
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
              {featured.map((product, index) => (
                <article
                  className={[
                    styles.featuredCard,
                    index === 0 ? styles.featuredCardFirst : '',
                    index === featured.length - 1
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
                          onNavigate?.('product', null, '', product.id)
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
              active === featured.length - 1
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
              disabled={active === featured.length - 1}
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
                width: `${100 / featuredCount}%`,
                left: `${(active * 100) / featuredCount}%`,
              }}
            />
          </div>

          <div className={styles.chips}>
            {featured.map((product, index) => (
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
                {product.name}
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
            {showcaseCategories.map((entry, index) => (
              <div
                className={
                  [
                    styles.categoryGroup,
                    styles.categoryGroup2,
                    styles.categoryGroup3,
                    styles.categoryGroup4,
                  ][index]
                }
                key={entry.name}
              >
                <div className={styles.category}>
                  <div className={styles.frameParent2}>
                    <div className={styles.productNameWrapper}>
                      <div className={styles.productName}>{entry.name}</div>
                    </div>
                    <div className={styles.productDescriptionWrapper}>
                      <div className={styles.productDescription}>
                        {productsInCategory(products, entry.name).length} products
                      </div>
                    </div>
                    <div className={styles.frameWrapper3}>
                      <button
                        className={styles.exploreParent}
                        type="button"
                        onClick={() => openCatalogue(entry.name)}
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
