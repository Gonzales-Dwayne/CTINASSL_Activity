import { useEffect, useState } from 'react';
import blockImage from '../assets/images/carousel/block.webp';
import flow84Image from '../assets/images/carousel/flow-84.webp';
import flowLite84Image from '../assets/images/carousel/flow-lite-84.webp';
import tofu68Image from '../assets/images/carousel/tofu-68.webp';
import styles from './HeroCarousel.module.css';

const SLIDES = [
  {
    id: 'flow-84',
    src: flow84Image,
    alt: 'Lofree Flow 84 keyboard',
    background: '#f3e7d9',
  },
  {
    id: 'flow-lite-84',
    src: flowLite84Image,
    alt: 'Lofree Flow Lite 84 keyboard',
    background: '#f4e0da',
  },
  {
    id: 'tofu-68',
    src: tofu68Image,
    alt: 'Lofree Tofu 68 keyboard',
    background: '#f1e8d5',
  },
  {
    id: 'block',
    src: blockImage,
    alt: 'Lofree Block keyboard',
    background: '#e6ebe1',
  },
];

const HeroCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={styles.heroCarousel}
      style={{ backgroundColor: SLIDES[activeSlide].background }}
    >
      <div className={styles.images}>
        {SLIDES.map((slide, index) => (
          <img
            key={slide.id}
            className={
              index === activeSlide
                ? `${styles.frameImage} ${styles.frameImageActive}`
                : styles.frameImage
            }
            src={slide.src}
            alt={index === activeSlide ? slide.alt : ''}
            aria-hidden={index !== activeSlide}
          />
        ))}
      </div>

      <nav className={styles.progressNav} aria-label="Choose featured keyboard">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            className={styles.progressButton}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Show ${slide.alt}`}
            aria-current={index === activeSlide ? 'true' : undefined}
          >
            <span
              className={`${styles.progressTrack} ${
                index === activeSlide ? styles.progressActive : ''
              } ${index < activeSlide ? styles.progressComplete : ''}`}
            >
              <span className={styles.progressFill} />
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
};

export default HeroCarousel;
