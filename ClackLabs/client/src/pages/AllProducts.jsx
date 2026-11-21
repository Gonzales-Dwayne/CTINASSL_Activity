import { useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import { CATEGORIES } from '../data/products';
import styles from './AllProducts.module.css';

const AllProducts = ({
  category = 'All Products',
  onCategoryChange,
}) => {
  const { products } = useProducts();
  const [sort, setSort] = useState('Featured');
  const [availability, setAvailability] = useState('All availability');
  const [priceBand, setPriceBand] = useState('All prices');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    ready: false,
  });
  const filtersRef = useRef(null);
  const filterRefs = useRef([]);

  useEffect(() => {
    const container = filtersRef.current;
    if (!container) return undefined;

    const update = () => {
      const target = filterRefs.current[CATEGORIES.indexOf(hoveredCategory || category)];
      if (!target) return;

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setIndicator({
        left: targetRect.left - containerRect.left,
        top: targetRect.bottom - containerRect.top,
        width: targetRect.width,
        ready: true,
      });
    };

    let active = true;
    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(container);
    filterRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    document.fonts?.ready.then(() => {
      if (active) update();
    });

    window.addEventListener('resize', update);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [category, hoveredCategory, products.length]);

  const visibleProducts = useMemo(() => {
    const filtered =
      category === 'All Products'
        ? [...products]
        : products.filter((product) => product.category === category);

    const available = filtered.filter((product) => {
      const stock = Number.isInteger(product.stock) ? product.stock : 0;
      if (availability === 'In stock' && stock <= 0) return false;
      if (availability === 'Out of stock' && stock > 0) return false;
      if (priceBand === 'Under $100' && product.price >= 100) return false;
      if (
        priceBand === '$100–$200' &&
        (product.price < 100 || product.price > 200)
      ) {
        return false;
      }
      if (priceBand === 'Over $200' && product.price <= 200) return false;
      return true;
    });

    if (sort === 'Price: low to high') {
      return available.sort((a, b) => a.price - b.price);
    }
    if (sort === 'Price: high to low') {
      return available.sort((a, b) => b.price - a.price);
    }
    if (sort === 'Name A–Z') {
      return available.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === 'Newest') {
      return available.sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
      );
    }
    return available;
  }, [category, sort, availability, priceBand, products]);

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="all-products-title">
        <p className={styles.eyebrow}>The ClackLabs catalogue</p>
        <h1 id="all-products-title">
          {category === 'All Products' ? 'All Products' : category}
        </h1>
        <p className={styles.description}>
          Thoughtfully designed keyboards, keycaps, and switches for a better daily setup.
        </p>
      </section>

      <section className={styles.catalogue} aria-label="Product catalogue">
        <div className={styles.toolbar}>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter products"
            ref={filtersRef}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <span
              className={styles.filterIndicator}
              aria-hidden="true"
              style={{
                left: indicator.left,
                top: indicator.top,
                width: indicator.width,
                opacity: indicator.ready ? 1 : 0,
              }}
            />
            {CATEGORIES.map((item, index) => (
              <button
                className={item === category ? styles.filterActive : styles.filter}
                key={item}
                type="button"
                ref={(node) => {
                  filterRefs.current[index] = node;
                }}
                onMouseEnter={() => setHoveredCategory(item)}
                onFocus={() => setHoveredCategory(item)}
                onBlur={() => setHoveredCategory(null)}
                onClick={() => onCategoryChange?.(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className={styles.sortLabel}>
            <span>Availability</span>
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
            >
              <option>All availability</option>
              <option>In stock</option>
              <option>Out of stock</option>
            </select>
          </label>
          <label className={styles.sortLabel}>
            <span>Price</span>
            <select value={priceBand} onChange={(event) => setPriceBand(event.target.value)}>
              <option>All prices</option>
              <option>Under $100</option>
              <option>$100–$200</option>
              <option>Over $200</option>
            </select>
          </label>
          <label className={styles.sortLabel}>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option>Featured</option>
              <option>Newest</option>
              <option>Name A–Z</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </label>
        </div>

        <p className={styles.resultCount}>{visibleProducts.length} products</p>

        {visibleProducts.length === 0 ? (
          <p className={styles.emptyState}>No products in this category yet.</p>
        ) : (
          <div className={styles.grid}>
            {visibleProducts.map((product) => (
              <article className={styles.card} key={product.id}>
                <a
                  className={styles.imageWrap}
                  href={`#/product/${product.id}`}
                  aria-label={`View ${product.name}`}
                >
                  <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                </a>
                <div className={styles.cardInfo}>
                  <div>
                    <p className={styles.category}>{product.category}</p>
                    <h2>
                      <a
                        className={styles.productLink}
                        href={`#/product/${product.id}`}
                      >
                        {product.name}
                      </a>
                    </h2>
                  </div>
                  <p className={styles.price}>${product.price}</p>
                </div>
                <a
                  className={styles.shopButton}
                  href={`#/product/${product.id}`}
                >
                  View product
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AllProducts;
