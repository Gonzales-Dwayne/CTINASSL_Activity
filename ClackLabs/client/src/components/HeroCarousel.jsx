import { useState } from 'react';
import arrowIcon from '../assets/icons/Arrow up.svg';
import styles from './HeroCarousel.module.css';

const SLIDES = [
  { id: 'flow-white', color: '#c9d6e8' },
  { id: 'flow-black', color: '#d9d9d9' },
  { id: 'flow-pink', color: '#e6c9cf' },
  { id: 'flow-sage', color: '#d8ddc9' },
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
    <div className={styles.heroCarousel}>
      <div className={styles.frameParent}>
        <div
          className={styles.frameChild}
          style={{ backgroundColor: SLIDES[activeSlide].color }}
          aria-hidden="true"
        />
        <div className={styles.arrowParent}>
          <button
            className={styles.arrowButton}
            type="button"
            onClick={showPrevious}
            aria-label="Previous image"
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
            aria-label="Next image"
          >
            <img className={styles.arrowIcon2} src={arrowIcon} alt="" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
