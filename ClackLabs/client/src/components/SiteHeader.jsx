import { useEffect, useRef, useState } from 'react';
import searchIcon from '../assets/icons/Search.svg';
import cartIcon from '../assets/icons/Shopping cart.svg';
import userIcon from '../assets/icons/User.svg';
import styles from './SiteHeader.module.css';

const TOP_OFFSET = 8;
const HIDE_OFFSET = 80;
const DIRECTION_THRESHOLD = 6;

const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    let lastY = window.scrollY;

    const update = () => {
      frame.current = 0;
      const y = Math.max(window.scrollY, 0);

      if (y <= TOP_OFFSET) {
        setScrolled(false);
        setHidden(false);
        lastY = y;
        return;
      }

      setScrolled(true);

      const delta = y - lastY;
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

      if (delta > 0 && y > HIDE_OFFSET) {
        setHidden(true);
      } else if (delta < 0) {
        setHidden(false);
      }

      lastY = y;
    };

    const handleScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <header
      className={[
        styles.header,
        scrolled ? styles.scrolled : '',
        hidden ? styles.hidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.logo}>
        <div className={styles.clackLabs}>
          <b>C</b>
          <span className={styles.lack}>{`lack `}</span>
          <b>L</b>
          <span className={styles.lack}>abs</span>
        </div>
      </div>

      <nav className={styles.navigation} aria-label="Primary">
        <div className={styles.allProducts}>
          <div className={styles.allProducts2}>All Products</div>
        </div>
        <div className={styles.allProducts}>
          <div className={styles.allProducts2}>Keyboards</div>
        </div>
        <div className={styles.allProducts}>
          <div className={styles.allProducts2}>Switches</div>
        </div>
        <div className={styles.allProducts}>
          <div className={styles.allProducts2}>Keycaps</div>
        </div>
      </nav>

      <div className={styles.functions}>
        <div className={styles.allProducts}>
          <img className={styles.searchIcon} src={searchIcon} alt="" />
        </div>
        <div className={styles.allProducts}>
          <img className={styles.searchIcon} src={userIcon} alt="" />
        </div>
        <div className={styles.allProducts}>
          <img className={styles.searchIcon} src={cartIcon} alt="" />
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
