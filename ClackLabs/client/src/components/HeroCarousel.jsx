import { useState } from 'react';
import arrowIcon from '../assets/icons/Arrow up.svg';
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

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  };

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % SLIDES.length);
  };

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

      <div className={styles.arrowParent}>
        <button
          className={styles.arrowButton}
          type="button"
          onClick={showPrevious}
          aria-label="Previous keyboard"
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
          onClick={showNext}
          aria-label="Next keyboard"
        >
          <img className={styles.arrowIcon2} src={arrowIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
