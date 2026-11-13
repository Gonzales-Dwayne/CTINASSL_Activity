import { useEffect, useState } from 'react'
import './Carousel.css'

const SLIDES = [
  {
    id: 'mechanical',
    color: '#1d4ed8',
    eyebrow: 'Mechanical',
    title: 'Keyboards built to be typed on',
    copy: 'Aluminum cases, hot-swap sockets and gasket mounts.',
    cta: 'Shop mechanical',
  },
  {
    id: 'magnetic',
    color: '#2563eb',
    eyebrow: 'Magnetic',
    title: 'Hall-effect switches, adjustable feel',
    copy: 'Tune actuation per key and never miss a press.',
    cta: 'Shop magnetic',
  },
  {
    id: 'keycaps',
    color: '#3b82f6',
    eyebrow: 'Keycaps & switches',
    title: 'Every profile, every colorway',
    copy: 'PBT sets and pre-lubed switch packs in stock.',
    cta: 'Shop accessories',
  },
]

const AUTOPLAY_MS = 6000

function Carousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = SLIDES.length

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, index, count])

  function goTo(next) {
    setIndex(((next % count) + count) % count)
  }

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel__viewport">
        <div
          className="carousel__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <article
              key={slide.id}
              className="slide"
              style={{ backgroundColor: slide.color }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i === index ? undefined : true}
              inert={i === index ? undefined : true}
            >
              <div className="slide__content">
                <p className="slide__eyebrow">{slide.eyebrow}</p>
                <h2 className="slide__title">{slide.title}</h2>
                <p className="slide__copy">{slide.copy}</p>
                <a className="slide__cta" href="#top">
                  {slide.cta}
                </a>
              </div>

              <div className="slide__art" aria-hidden="true">
                <span className="slide__art-label">Image placeholder</span>
                <div className="slide__art-board">
                  {[0, 1, 2].map((row) => (
                    <div className="slide__art-row" key={row}>
                      {Array.from({ length: 10 }, (_, col) => (
                        <span
                          className="slide__art-key"
                          key={`${row}-${col}`}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="slide__art-row slide__art-row--space">
                    <span className="slide__art-key" />
                    <span className="slide__art-key slide__art-key--wide" />
                    <span className="slide__art-key" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <button
        className="carousel__arrow carousel__arrow--prev"
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>
      <button
        className="carousel__arrow carousel__arrow--next"
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>

      <div className="carousel__dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            className="carousel__dot"
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  )
}

export default Carousel
