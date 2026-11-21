import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useProfile } from '../context/ProfileContext';
import styles from './ProductPage.module.css';

const CATEGORY_COPY = {
  Keyboards:
    'A considered mechanical keyboard built for daily typing, with a refined chassis and a smooth, responsive feel.',
  Keycaps:
    'A carefully finished keycap set designed to bring a distinct look and tactile character to your keyboard.',
  Switches:
    'A precision-made switch set tuned for consistent actuation, clean acoustics, and a satisfying typing feel.',
};

const CATEGORY_SPECS = {
  Keyboards: [
    ['Layout', 'Compact / low-profile'],
    ['Connectivity', 'Tri-mode wireless + USB-C'],
    ['Compatibility', 'macOS, Windows, iOS, Android'],
  ],
  Keycaps: [
    ['Profile', 'Low-profile'],
    ['Material', 'Durable PBT'],
    ['Compatibility', 'Lofree Flow series'],
  ],
  Switches: [
    ['Type', 'Linear'],
    ['Actuation', 'Factory tuned'],
    ['Compatibility', 'Hot-swap compatible'],
  ],
};

function ProductPage({ product, onNavigate, onProductSelect, onOpenCart }) {
  const { products } = useProducts();
  const { addItem } = useCart();
  const { profile, token } = useProfile();
  const [added, setAdded] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  useEffect(() => {
    if (!product || !token) return undefined;

    let active = true;
    fetch(`${API_BASE_URL}/api/account/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active && payload) {
          setSaved(payload.productIds?.includes(product.id) || false);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [product, token]);

  if (!product) {
    return (
      <main className={styles.page}>
        <div className={styles.missing}>
          <p className={styles.eyebrow}>Product not found</p>
          <h1>That keyboard wandered off.</h1>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => onNavigate('#/products')}
          >
            Back to all products
          </button>
        </div>
      </main>
    );
  }

  const stock = Number.isInteger(product.stock) ? product.stock : null;

  const toggleWishlist = async () => {
    if (!profile) {
      onNavigate('#/login');
      return;
    }

    setWishlistBusy(true);
    setWishlistError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/account/wishlist/${encodeURIComponent(product.id)}`,
        {
          method: saved ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to update your wishlist.');
      }
      setSaved((current) => !current);
    } catch (error) {
      setWishlistError(error.message);
    } finally {
      setWishlistBusy(false);
    }
  };

  const related = products.filter(
    (item) => item.category === product.category && item.id !== product.id,
  ).slice(0, 3);

  const labels = (CATEGORY_SPECS[product.category] || []).map(([label]) => label);
  const values =
    Array.isArray(product.details) && product.details.length > 0
      ? product.details
      : (CATEGORY_SPECS[product.category] || []).map(([, value]) => value);
  const fallbackSpecs = labels.map((label, index) => [
    label,
    values[index] || '-',
  ]);
  const specs =
    product.specs && Object.keys(product.specs).length > 0
      ? Object.entries(product.specs).map(([label, value]) => [
          label.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
          value,
        ])
      : fallbackSpecs;
  const description = product.description || CATEGORY_COPY[product.category];

  return (
    <main className={styles.page}>
      <div className={styles.breadcrumb}>
        <button type="button" onClick={() => onNavigate('#/')}>
          Home
        </button>
        <span>/</span>
        <button type="button" onClick={() => onNavigate('#/products')}>
          Shop
        </button>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className={styles.product}>
        <div className={styles.gallery}>
          <img src={product.image} alt={product.name} />
        </div>

        <div className={styles.details}>
          <p className={styles.eyebrow}>{product.category}</p>
          <h1>{product.name}</h1>
          <p className={styles.price}>${product.price}.00</p>
          {stock !== null ? (
            <p className={stock > 0 ? styles.stock : styles.outOfStock}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </p>
          ) : null}
          <p className={styles.description}>{description}</p>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={stock === 0}
              onClick={() => {
                const result = addItem(product.id);
                if (!result.ok) {
                  setCartMessage(result.message);
                  return;
                }
                setCartMessage('');
                setAdded(true);
              }}
            >
              {stock === 0 ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              className={styles.saveButton}
              type="button"
              onClick={toggleWishlist}
              disabled={wishlistBusy}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          {cartMessage ? (
            <p className={styles.errorMessage} role="alert">
              {cartMessage}
            </p>
          ) : null}
          {wishlistError ? (
            <p className={styles.errorMessage} role="alert">
              {wishlistError}
            </p>
          ) : null}
          {added ? (
            <>
              <p className={styles.feedback} role="status">
                Added to your cart — open the cart from the header to review it.
              </p>
              <button
                className={styles.feedbackLink}
                type="button"
                onClick={onOpenCart}
              >
                View cart
              </button>
            </>
          ) : null}

          <div className={styles.specs}>
            {specs.map(([label, value]) => (
              <div className={styles.specRow} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {product.sourceUrl ? (
            <a
              className={styles.sourceLink}
              href={product.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Product information sourced from Lofree ↗
            </a>
          ) : null}

          <div className={styles.notes}>
            <p>Free shipping on orders over $100.</p>
            <p>30-day returns and a one-year limited warranty.</p>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className={styles.related} aria-labelledby="related-title">
          <div className={styles.relatedHeader}>
            <h2 id="related-title">You may also like</h2>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => onNavigate('#/products')}
            >
              View all
            </button>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <button
                className={styles.relatedCard}
                key={item.id}
                type="button"
                onClick={() => onProductSelect(item.id)}
              >
                <span className={styles.relatedImage}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                </span>
                <span className={styles.relatedMeta}>
                  <strong>{item.name}</strong>
                  <span>${item.price}.00</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default ProductPage;
