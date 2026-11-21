import { useEffect, useRef, useState } from 'react';
import searchIcon from '../assets/icons/Search.svg';
import cartIcon from '../assets/icons/Shopping cart.svg';
import userIcon from '../assets/icons/User.svg';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useProfile } from '../context/ProfileContext';
import styles from './SiteHeader.module.css';

const TOP_OFFSET = 8;
const HIDE_OFFSET = 80;
const DIRECTION_THRESHOLD = 6;

const NAV_CATEGORIES = [
  { label: 'Keyboards', slug: 'keyboards' },
  { label: 'Switches', slug: 'switches' },
  { label: 'Keycaps', slug: 'keycaps' },
];

const categoryPath = (category) => {
  const match = NAV_CATEGORIES.find((item) => item.label === category);
  return match ? `#/products/${match.slug}` : '#/products';
};

const SiteHeader = ({
  onNavigate,
  onOpenSearch,
  onOpenCart,
  cartCount = 0,
}) => {
  const { products } = useProducts();
  const { profile, signOut } = useProfile();
  const { clearCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCategory, setMenuCategory] = useState('Keyboards');
  const [accountOpen, setAccountOpen] = useState(false);
  const [navIndicator, setNavIndicator] = useState(null);
  const frame = useRef(0);
  const accountRef = useRef(null);
  const navRef = useRef(null);

  const moveNavIndicator = (index) => {
    const button = navRef.current?.querySelectorAll('button')[index];
    if (!button) return;
    const navRect = navRef.current.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setNavIndicator({
      left: buttonRect.left - navRect.left,
      width: buttonRect.width,
    });
  };

  const navigate = (path) => {
    setMenuOpen(false);
    setAccountOpen(false);
    setNavIndicator(null);
    onNavigate(path);
  };

  useEffect(() => {
    if (!accountOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountOpen]);

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

  const featuredProducts = products
    .filter((product) => product.category === menuCategory)
    .slice(0, 4);

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
      onMouseLeave={() => {
        setMenuOpen(false);
        setNavIndicator(null);
      }}    >
      <button
        className={styles.logo}
        type="button"
        onClick={() => navigate('#/')}
        aria-label="ClackLabs home"
      >
        <span className={styles.clackLabs}>
          <b>CL</b>
        </span>
        <span className={styles.brandName}>ClackLabs</span>
      </button>

      <nav className={styles.navigation} aria-label="Primary" ref={navRef}>
        <span
          className={styles.navIndicator}
          aria-hidden="true"
          style={{
            left: navIndicator?.left || 0,
            width: navIndicator?.width || 0,
            opacity: menuOpen && navIndicator ? 1 : 0,
          }}
        />
        <button
          className={styles.navButton}
          type="button"
          onMouseEnter={() => {
            setMenuOpen(true);
            moveNavIndicator(0);
          }}
          onFocus={() => {
            setMenuOpen(true);
            moveNavIndicator(0);
          }}
          onClick={() => navigate('#/products')}
          aria-expanded={menuOpen}
          aria-controls="product-menu"
        >
          All Products
        </button>
        {NAV_CATEGORIES.map((item, index) => (
          <button
            className={styles.navButton}
            key={item.label}
            type="button"
            onMouseEnter={() => {
              setMenuOpen(true);
              setMenuCategory(item.label);
              moveNavIndicator(index + 1);
            }}
            onFocus={() => {
              setMenuOpen(true);
              setMenuCategory(item.label);
              moveNavIndicator(index + 1);
            }}
            onClick={() => {
              setMenuCategory(item.label);
              navigate(categoryPath(item.label));
            }}
            aria-expanded={menuOpen}
            aria-controls="product-menu"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.functions}>
        <button
          className={styles.iconButton}
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setAccountOpen(false);
            onOpenSearch?.();
          }}
          aria-label="Search"
        >
          <img className={styles.searchIcon} src={searchIcon} alt="" />
        </button>
        <div className={styles.accountWrap} ref={accountRef}>
          <button
            className={styles.iconButton}
            type="button"
            onClick={() => {
              setMenuOpen(false);
              if (profile) {
                setAccountOpen((current) => !current);
              } else {
                navigate('#/login');
              }
            }}
            aria-label={profile ? `Account for ${profile.name}` : 'Account'}
            aria-haspopup={profile ? 'menu' : undefined}
            aria-expanded={profile ? accountOpen : undefined}
          >
            {profile ? (
              <span className={styles.profileInitial} aria-hidden="true">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <img className={styles.searchIcon} src={userIcon} alt="" />
            )}
          </button>

          {profile && accountOpen ? (
            <div className={styles.accountMenu} role="menu">
              <div className={styles.accountMeta}>
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </div>
              {profile.role === 'admin' ? (
                <button
                  className={styles.accountAction}
                  type="button"
                  role="menuitem"
                  onClick={() => navigate('#/admin')}
                >
                  Admin dashboard
                </button>
              ) : null}
              <button
                className={styles.accountAction}
                type="button"
                role="menuitem"
                onClick={() => navigate('#/account')}
              >
                Account
              </button>
              <button
                className={styles.accountAction}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  clearCart();
                  signOut();
                  onNavigate('#/');
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
        <button
          className={styles.iconButton}
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setAccountOpen(false);
            onOpenCart?.();
          }}
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        >
          <img className={styles.searchIcon} src={cartIcon} alt="" />
          {cartCount > 0 ? (
            <span className={styles.cartBadge}>
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </button>
      </div>

      {menuOpen && (
        <div id="product-menu" className={styles.megaMenu}>
          <aside className={styles.categoryList} aria-label="Product categories">
            {NAV_CATEGORIES.map((item) => (
              <button
                className={
                  menuCategory === item.label ? styles.categoryActive : undefined
                }
                key={item.label}
                type="button"
                onMouseEnter={() => setMenuCategory(item.label)}
                onFocus={() => setMenuCategory(item.label)}
                onClick={() => navigate(categoryPath(item.label))}
              >
                {item.label}
              </button>
            ))}
          </aside>

          <section className={styles.featuredPanel} aria-label="Featured products">
            <div className={styles.featuredHeader}>
              <div>
                <span>Featured picks</span>
                <h2>{menuCategory}</h2>
              </div>
              <button
                className={styles.viewAll}
                type="button"
                onClick={() => navigate(categoryPath(menuCategory))}
              >
                View all <span>â†’</span>
              </button>
            </div>
            <div className={styles.productGrid}>
              {featuredProducts.map((product) => (
                <button
                  className={styles.productTile}
                  key={product.id}
                  type="button"
                  onClick={() => navigate(`#/product/${product.id}`)}
                >
                  <span className={styles.productImageWrap}>
                    <img src={product.image} alt="" />
                  </span>
                  <strong>{product.name.replace('Lofree ', '')}</strong>
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
