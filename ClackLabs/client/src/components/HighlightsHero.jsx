import { useEffect, useMemo, useRef, useState } from 'react';
import blockImage from '../assets/images/carousel/block.webp';
import flow84Image from '../assets/images/carousel/flow-84.webp';
import flowLite84Image from '../assets/images/carousel/flow-lite-84.webp';
import tofu68Image from '../assets/images/carousel/tofu-68.webp';
import { useProducts } from '../context/ProductsContext';
import styles from './HighlightsHero.module.css';

const AUTOPLAY_MS = 7000;

const HIGHLIGHTS = [
  {
    id: 'flow-84',
    productId: 'ClackLabs-flow-84-white',
    image: flow84Image,
    alt: 'ClackLabs Flow 84 low-profile mechanical keyboard in white',
    name: 'ClackLabs Flow 84',
    kicker: 'New arrival',
    title: ['Low profile.', 'High contrast.'],
    copy: 'A 75% keyboard with a gasket mount, hot-swappable switches and an aluminium frame that stays cool through long sessions.',
    specs: ['75% layout', 'Gasket mount', 'Tri-mode wireless'],
    tint: '#f3e6d5',
    accent: '#b8792f',
    accentRgb: '184, 121, 47',
  },
  {
    id: 'flow-lite-84',
    productId: 'ClackLabs-flow-lite-2-84-white',
    image: flowLite84Image,
    alt: 'ClackLabs Flow Lite 2 84 keyboard in white',
    name: 'ClackLabs Flow Lite 2 84',
    kicker: 'Lightweight series',
    title: ['Lighter, softer,', 'still sharp.'],
    copy: 'The same crisp 75% feel in a lighter body, with PBT keycaps and wireless that switches between three devices.',
    specs: ['PBT keycaps', 'Soft gasket feel', 'Three devices'],
    tint: '#f6e1db',
    accent: '#bd6250',
    accentRgb: '189, 98, 80',
  },
  {
    id: 'tofu-68',
    productId: 'ClackLabs-tofu-68',
    image: tofu68Image,
    alt: 'ClackLabs Tofu 68 compact keyboard',
    name: 'ClackLabs Tofu 68',
    kicker: 'Cult favourite',
    title: ['Retro silhouette,', 'modern feel.'],
    copy: 'A compact 68-key board with a warm, rounded frame and a smooth, tactile typing feel that settles into a desk instantly.',
    specs: ['68 keys', 'Tactile feel', 'Compact footprint'],
    tint: '#f1e9d2',
    accent: '#a3873a',
    accentRgb: '163, 135, 58',
  },
  {
    id: 'block-101',
    productId: 'ClackLabs-block-101',
    image: blockImage,
    alt: 'ClackLabs Block 101 keyboard',
    name: 'ClackLabs Block 101',
    kicker: 'Statement piece',
    title: ['Built like', 'a block.'],
    copy: 'A full-size keyboard with a solid aluminium chassis, customizable controls and the kind of weight that keeps it planted.',
    specs: ['Full size', 'Aluminium body', 'Custom controls'],
    tint: '#e5ebdf',
    accent: '#5c7a4f',
    accentRgb: '92, 122, 79',
  },
];

const pad = (value) => String(value).padStart(2, '0');

const HighlightsHero = () => {
  const { products } = useProducts();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pointerInside, setPointerInside] = useState(false);
  const [userPaused, setUserPaused] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [pageHidden, setPageHidden] = useState(false);
  const touchStart = useRef(null);
  const activeRef = useRef(active);

  const slides = useMemo(
    () =>
      HIGHLIGHTS.map((highlight) => {
        const product = products.find((item) => item.id === highlight.productId);
        return {
          ...highlight,
          name: product?.name ?? highlight.name,
          category: product?.category ?? 'Keyboards',
          price: product?.price ?? null,
        };
      }),
    [products],
  );

  const count = slides.length;
  const slide = slides[active];
  const nextSlide = slides[(active + 1) % count];
  const isPaused = userPaused || pointerInside || pageHidden;

  const goTo = (index) => {
    const target = (index + count) % count;
    const current = activeRef.current;
    if (target === current) return;
    setDirection(target > current ? 1 : -1);
    activeRef.current = target;
    setActive(target);
  };

  const step = useMemo(() => (delta) => {
    setDirection(delta >= 0 ? 1 : -1);
    const target = (activeRef.current + delta + count) % count;
    activeRef.current = target;
    setActive(target);
  }, [count]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const handleVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // A timer keeps autoplay working when reduced motion disables CSS animations.
  // CSS still owns the visible progress indicator when motion is allowed.
  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = window.setTimeout(() => step(1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, isPaused, step]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(count - 1);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
      step(deltaX < 0 ? 1 : -1);
    }
  };

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="ClackLabs highlights"
      data-direction={direction > 0 ? 'next' : 'prev'}
      data-paused={isPaused ? 'true' : 'false'}
      style={{
        '--tint': slide.tint,
        '--accent': slide.accent,
        '--accent-rgb': slide.accentRgb,
        '--autoplay': `${AUTOPLAY_MS}ms`,
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setPointerInside(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setPointerInside(false);
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.wash} aria-hidden="true">
        {slides.map((item, index) => (
          <span
            key={item.id}
            className={
              index === active
                ? `${styles.washLayer} ${styles.washLayerActive}`
                : styles.washLayer
            }
            style={{ background: item.tint }}
          />
        ))}
        <span className={styles.washGlow} />
        <span className={styles.washOrb} />
      </div>

      <div className={styles.body}>
        <div className={styles.intro} key={`intro-${active}`}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {slide.kicker}
            <span className={styles.eyebrowIndex}>
              {pad(active + 1)} / {pad(count)}
            </span>
          </p>

          <h1 className={styles.title}>
            {slide.title.map((line) => (
              <span className={styles.titleLine} key={line}>
                {line}
              </span>
            ))}
          </h1>

          <p className={styles.lead}>{slide.name}</p>
        </div>

        <div className={styles.detail} key={`detail-${active}`}>
          <p className={styles.text}>{slide.copy}</p>

          <ul className={styles.specs}>
            {slide.specs.map((spec) => (
              <li className={styles.spec} key={spec}>
                {spec}
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <a
              className={styles.primary}
              href={`#/product/${slide.productId}`}
            >
              Shop {slide.name.replace(/^ClackLabs\s/, '')}
              {slide.price ? ` · $${slide.price}` : ''}
              <span className={styles.primaryArrow} aria-hidden="true">
                →
              </span>
            </a>
            <a className={styles.secondary} href="#/products/keyboards">
              Browse all keyboards
            </a>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.stepper}>
            <button
              className={styles.stepButton}
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous highlight"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              className={styles.stepButton}
              type="button"
              onClick={() => step(1)}
              aria-label="Next highlight"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <p className={styles.counter}>
            <span className={styles.counterCurrent}>{pad(active + 1)}</span>
            <span className={styles.counterRule} aria-hidden="true" />
            <span>{pad(count)}</span>
          </p>

          <button
            className={styles.pauseButton}
            type="button"
            onClick={() => {
              const nextPaused = !userPaused;
              setUserPaused(nextPaused);
              if (!nextPaused) setPointerInside(false);
            }}
            aria-pressed={userPaused}
          >
            {userPaused ? 'Play slideshow' : 'Pause slideshow'}
          </button>
        </div>

        <div className={styles.stage}>
          <span className={styles.stageGlow} aria-hidden="true" />

          <div className={styles.frame}>
            <span className={styles.watermark} aria-hidden="true">
              {pad(active + 1)}
            </span>

            <button
              className={styles.peek}
              type="button"
              onClick={() => step(1)}
              aria-label={`Show next highlight: ${nextSlide.name}`}
            >
              <span className={styles.peekThumb}>
                <img src={nextSlide.image} alt="" />
              </span>
              <span className={styles.peekText}>
                <span className={styles.peekLabel}>Up next</span>
                <span className={styles.peekName}>{nextSlide.name}</span>
              </span>
            </button>

            <div className={styles.imageStack}>
              {slides.map((item, index) => (
                <figure
                  key={item.id}
                  className={`${styles.frameImage} ${
                    index === active
                      ? styles.frameImageActive
                      : index < active
                        ? styles.frameImageBefore
                        : styles.frameImageAfter
                  }`}
                  aria-hidden={index !== active}
                >
                  <img
                    src={item.image}
                    alt={index === active ? item.alt : ''}
                    draggable="false"
                  />
                </figure>
              ))}
            </div>

            <div className={styles.frameFooter}>
              <span className={styles.frameMeta}>
                <span className={styles.frameName}>{slide.name}</span>
                <span className={styles.frameCategory}>{slide.category}</span>
              </span>
              <a
                className={styles.frameLink}
                href={`#/product/${slide.productId}`}
              >
                View product
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rail}>
        {slides.map((item, index) => (
          <button
            key={item.id}
            className={
              index === active
                ? `${styles.tab} ${styles.tabActive}`
                : styles.tab
            }
            type="button"
            onClick={() => goTo(index)}
            aria-current={index === active ? 'true' : undefined}
            aria-label={`Show highlight ${index + 1}: ${item.name}`}
          >
            <span className={styles.tabIndex}>{pad(index + 1)}</span>
            <span className={styles.tabBody}>
              <span className={styles.tabName}>{item.name}</span>
              <span className={styles.tabMeta}>{item.kicker}</span>
            </span>
            <span className={styles.tabTrack} aria-hidden="true">
              {index === active ? (
                <span
                  key={active}
                  className={styles.tabFill}
                />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HighlightsHero;
