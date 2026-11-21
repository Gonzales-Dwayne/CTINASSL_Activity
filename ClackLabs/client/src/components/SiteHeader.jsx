import { useEffect, useRef, useState } from 'react';
import searchIcon from '../assets/icons/Search.svg';
import cartIcon from '../assets/icons/Shopping cart.svg';
import userIcon from '../assets/icons/User.svg';
import blockImage from '../assets/images/carousel/block.webp';
import flow84Image from '../assets/images/carousel/flow-84.webp';
import flowLite84Image from '../assets/images/carousel/flow-lite-84.webp';
import tofu68Image from '../assets/images/carousel/tofu-68.webp';
import styles from './SiteHeader.module.css';

const TOP_OFFSET = 8;
const HIDE_OFFSET = 80;
const DIRECTION_THRESHOLD = 6;

const FEATURED_PRODUCTS = [
  { name: 'Flow 84', image: flow84Image },
  { name: 'Flow Lite 84', image: flowLite84Image },
  { name: 'Tofu 68', image: tofu68Image },
  { name: 'Block 101', image: blockImage },
];

const SiteHeader = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const frame = useRef(0);

  const navigate = (view) => {
    setMenuOpen(false);
    onNavigate(view);
  };

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

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={[
        styles.header,
        scrolled ? styles.scrolled : '',
        menuOpen ? styles.menuOpen : '',
        hidden ? styles.hidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <button
        className={styles.logo}
        type="button"
        onClick={() => navigate('home')}
        aria-label="ClackLabs home"
      >
        <span className={styles.clackLabs}>
          <b>CL</b>
        </span>
      </button>

      <nav className={styles.navigation} aria-label="Primary">
        <button
          className={`${styles.navButton} ${menuOpen ? styles.navButtonActive : ''}`}
          type="button"
          onMouseEnter={() => setMenuOpen(true)}
          onFocus={() => setMenuOpen(true)}
          onClick={() => navigate('products')}
          aria-expanded={menuOpen}
          aria-controls="product-menu"
        >
          All Products
        </button>
        {['Keyboards', 'Switches', 'Keycaps'].map((item) => (
          <button
            className={styles.navButton}
            key={item}
            type="button"
            onMouseEnter={() => setMenuOpen(true)}
            onFocus={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="product-menu"
          >
            {item}
          </button>
        ))}
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

      {menuOpen && (
        <div
          id="product-menu"
          className={styles.megaMenu}
        >
          <aside className={styles.categoryList} aria-label="Product categories">
            <button className={styles.categoryActive} type="button">Keyboards</button>
            <button type="button">Switches</button>
            <button type="button">Keycaps</button>
            <button type="button">Accessories</button>
            <button type="button">Gift Cards</button>
          </aside>

          <section className={styles.featuredPanel} aria-label="Featured products">
            <div className={styles.featuredHeader}>
              <div>
                <span>Featured picks</span>
                <h2>Keyboards</h2>
              </div>
              <button
                className={styles.viewAll}
                type="button"
                onClick={() => navigate('products')}
              >
                View all <span>→</span>
              </button>
            </div>
            <div className={styles.productGrid}>
              {FEATURED_PRODUCTS.map((product) => (
                <button
                  className={styles.productTile}
                  key={product.name}
                  type="button"
                  onClick={() => navigate('products')}
                >
                  <span className={styles.productImageWrap}>
                    <img src={product.image} alt="" />
                  </span>
                  <strong>{product.name}</strong>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
