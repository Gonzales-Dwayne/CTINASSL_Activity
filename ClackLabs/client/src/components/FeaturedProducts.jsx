import { useCallback, useEffect, useRef, useState } from 'react';
import arrowIcon from '../assets/icons/Arrow up.svg';
import styles from './FeaturedProducts.module.css';

const PRODUCTS = [
  {
    id: 'flow-84',
    name: 'Lofree Flow 84',
    chip: 'Flow 84',
    description:
      'A 75% low-profile keyboard with a gasket mount, hot-swappable switches, and a refined aluminum frame.',
    colors: {
      from: '#e3d9ca',
      to: '#cfc5b5',
      body: '#f2eee6',
      plate: '#dfd8cc',
      key: '#fbf9f4',
      accent: '#d58a4a',
    },
  },
  {
    id: 'flow-lite-84',
    name: 'Lofree Flow Lite 84',
    chip: 'Flow Lite 84',
    description:
      'A lightweight 75% board with a soft gasket feel, PBT keycaps, and tri-mode wireless connectivity.',
    colors: {
      from: '#e8d7d2',
      to: '#d8bfba',
      body: '#f6e4e0',
      plate: '#e4cec9',
      key: '#fff8f4',
      accent: '#c76b6b',
    },
  },
  {
    id: 'flow-100',
    name: 'Lofree Flow 100',
    chip: 'Flow 100',
    description:
      'A full-size low-profile keyboard with a spacious layout, aluminum body, and smooth, quiet switches.',
    colors: {
      from: '#d9dde0',
      to: '#c2c8cb',
      body: '#eef1f2',
      plate: '#d9dfe1',
      key: '#fbfcfc',
      accent: '#7e94a2',
    },
  },
  {
    id: 'flow-lite-100',
    name: 'Lofree Flow Lite 100',
    chip: 'Flow Lite 100',
    description:
      'A full-size wireless keyboard with a clean profile, comfortable typing feel, and long battery life.',
    colors: {
      from: '#dde2d7',
      to: '#c8d0bf',
      body: '#eff3e8',
      plate: '#dbe1d2',
      key: '#fbfcf7',
      accent: '#8e9b79',
    },
  },
  {
    id: 'edge',
    name: 'Lofree EDGE',
    chip: 'Edge',
    description:
      'A compact wireless keyboard with a distinctive split layout and a premium, minimalist finish.',
    colors: {
      from: '#d2cec7',
      to: '#b9b3aa',
      body: '#34322f',
      plate: '#262522',
      key: '#4c4944',
      accent: '#e39a55',
    },
  },
  {
    id: 'block',
    name: 'Lofree Block',
    chip: 'Block',
    description:
      'A bold, blocky mechanical keyboard with customizable controls and a solid aluminum chassis.',
    colors: {
      from: '#d7dde6',
      to: '#bcc7d4',
      body: '#35516c',
      plate: '#29405a',
      key: '#e6edf5',
      accent: '#f0b05a',
    },
  },
];

function ProductArt({ colors }) {
  return (
    <svg className={styles.productArt} viewBox="0 0 500 425" aria-hidden="true">
      <ellipse cx="250" cy="330" rx="184" ry="23" fill="#241f1a" opacity=".16" />
      <g transform="translate(26 118) rotate(-7 224 100)">
        <rect x="5" y="52" width="438" height="176" rx="18" fill={colors.body} />
        <rect x="20" y="66" width="408" height="148" rx="10" fill={colors.plate} />
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 14 }, (_, column) => {
            const accent =
              (row === 0 && column === 0) || (row === 2 && column === 12);
            return (
              <rect
                key={`${row}-${column}`}
                x={30 + column * 28}
                y={78 + row * 27}
                width="23"
                height="20"
                rx="3"
                fill={accent ? colors.accent : colors.key}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
}

const FeaturedProducts = () => {
  const [active, setActive] = useState(0);
  const viewportRef = useRef(null);
  const cardRefs = useRef([]);
  const frame = useRef(0);

  const updateActive = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearest = 0;
    let nearestDistance = Infinity;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    setActive(nearest);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const handleScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        updateActive();
      });
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    updateActive();

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [updateActive]);

  const goTo = (index) => {
    const viewport = viewportRef.current;
    const card = cardRefs.current[index];
    if (!viewport || !card) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const step = (direction) => {
    const next = Math.min(Math.max(active + direction, 0), PRODUCTS.length - 1);
    goTo(next);
  };

  return (
    <section
      className={styles.featuredProducts}
      aria-labelledby="featured-products-title"
    >
      <div className={styles.headingWrap}>
        <h2 className={styles.heading} id="featured-products-title">
          Featured Products
        </h2>
      </div>

      <div className={styles.carousel}>
        <div className={styles.viewport} ref={viewportRef}>
          <div className={styles.track}>
            {PRODUCTS.map((product, index) => (
              <article
                className={
                  index === active
                    ? `${styles.card} ${styles.cardActive}`
                    : styles.card
                }
                key={product.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                inert={index !== active ? true : undefined}
                aria-roledescription="slide"
                aria-label={`${product.name}, ${index + 1} of ${PRODUCTS.length}`}
              >
                <div
                  className={styles.media}
                  style={{
                    background: `linear-gradient(140deg, ${product.colors.from}, ${product.colors.to})`,
                  }}
                >
                  <ProductArt colors={product.colors} />
                </div>
                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{product.name}</h3>
                  <p className={styles.cardCopy}>{product.description}</p>
                  <button className={styles.shopButton} type="button">
                    Shop Now
                  </button>
                </div>
              </article>
            ))}
            <span className={styles.trackEnd} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.arrows}>
          <button
            className={styles.arrowButton}
            type="button"
            onClick={() => step(-1)}
            disabled={active === 0}
            aria-label="Previous product"
          >
            <img
              className={styles.arrowIcon}
              src={arrowIcon}
              alt=""
              style={{ transform: 'rotate(180deg)' }}
            />
          </button>
          <button
            className={styles.arrowButton}
            type="button"
            onClick={() => step(1)}
            disabled={active === PRODUCTS.length - 1}
            aria-label="Next product"
          >
            <img className={styles.arrowIcon} src={arrowIcon} alt="" />
          </button>
        </div>
      </div>

      <div className={styles.progressArea}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressThumb}
            style={{
              width: `${100 / PRODUCTS.length}%`,
              transform: `translateX(${active * 100}%)`,
            }}
          />
        </div>

        <div className={styles.chips}>
          {PRODUCTS.map((product, index) => (
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
              <span className={styles.chipDot} aria-hidden="true" />
              {product.chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
