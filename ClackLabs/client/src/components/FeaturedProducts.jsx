import { useCallback, useEffect, useRef, useState } from 'react';
import arrowIcon from '../assets/icons/Arrow up.svg';
import { useProducts } from '../context/ProductsContext';
import styles from './FeaturedProducts.module.css';

const FEATURED_META = [
  {
    id: 'ClackLabs-flow-84-white',
    chip: 'Flow 84',
    description:
      'A 75% low-profile keyboard with a gasket mount, hot-swappable switches, and a refined aluminum frame.',
  },
  {
    id: 'ClackLabs-flow-lite-2-84-white',
    chip: 'Flow Lite 2 84',
    description:
      'A lightweight 75% board with a soft gasket feel, PBT keycaps, and tri-mode wireless connectivity.',
  },
  {
    id: 'ClackLabs-tofu-68',
    chip: 'Tofu 68',
    description:
      'A compact 68-key keyboard with a warm retro silhouette and a smooth, tactile typing feel.',
  },
  {
    id: 'ClackLabs-block-101',
    chip: 'Block 101',
    description:
      'A bold, blocky mechanical keyboard with customizable controls and a solid aluminum chassis.',
  },
  {
    id: 'ClackLabs-edge-grey',
    chip: 'Edge Grey',
    description:
      'A compact wireless keyboard with a distinctive split layout and a premium, minimalist finish.',
  },
  {
    id: 'ClackLabs-hyzen-silver',
    chip: 'Hyzen Silver',
    description:
      'A clean, silver-finished keyboard built for focused work with a crisp, responsive feel.',
  },
];

const FeaturedProducts = () => {
  const { products } = useProducts();
  const featured = FEATURED_META.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? { ...item, ...product } : null;
  }).filter(Boolean);
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
    const next = Math.min(Math.max(active + direction, 0), featured.length - 1);
    goTo(next);
  };

  if (featured.length === 0) return null;

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
            {featured.map((product, index) => (
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
                aria-roledescription="slide"
                aria-label={`${product.name}, ${index + 1} of ${featured.length}`}
              >
                <div className={styles.media}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>
                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{product.name}</h3>
                  <p className={styles.cardCopy}>{product.description}</p>
                  <a
                    className={styles.shopButton}
                    href={`#/product/${product.id}`}
                  >
                    Shop Now
                  </a>
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
            disabled={active === featured.length - 1}
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
              width: `${100 / featured.length}%`,
              transform: `translateX(${active * 100}%)`,
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
