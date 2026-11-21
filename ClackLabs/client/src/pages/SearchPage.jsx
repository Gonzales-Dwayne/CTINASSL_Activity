import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useProducts } from '../context/ProductsContext';
import productStyles from './AllProducts.module.css';
import styles from './SearchPage.module.css';

const imageUrl = (image) => {
  if (!image) return '/favicon.svg';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

function SearchPage({ route, onNavigate }) {
  const { products } = useProducts();
  const [queryInput, setQueryInput] = useState(route.query);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryOptions = [
    'All Products',
    ...new Set(products.map((product) => product.category)),
  ];

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        q: route.query,
        limit: '12',
        page: String(route.pageNumber || 1),
        sort: route.sort || 'relevance',
      });
      if (route.category) params.set('category', route.category);
      if (route.availability) params.set('availability', route.availability);
      if (route.minPrice) params.set('minPrice', route.minPrice);
      if (route.maxPrice) params.set('maxPrice', route.maxPrice);

      try {
        const response = await fetch(`${API_BASE_URL}/api/search?${params}`);
        if (!response.ok) throw new Error('Unable to load search results.');
        const payload = await response.json();
        if (!active) return;
        setResults(Array.isArray(payload.items) ? payload.items : []);
        setTotal(payload.total || 0);
        setPages(payload.pages || 1);
      } catch (searchError) {
        if (!active) return;
        setError(searchError.message);
        setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    route.query,
    route.category,
    route.availability,
    route.sort,
    route.pageNumber,
    route.minPrice,
    route.maxPrice,
  ]);

  const buildSearchHash = (overrides = {}) => {
    const next = {
      q: route.query,
      category: route.category,
      availability: route.availability,
      sort: route.sort || 'relevance',
      page: route.pageNumber || 1,
      minPrice: route.minPrice,
      maxPrice: route.maxPrice,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.category) params.set('category', next.category);
    if (next.availability) params.set('availability', next.availability);
    if (next.sort && next.sort !== 'relevance') params.set('sort', next.sort);
    if (next.page && next.page > 1) params.set('page', String(next.page));
    if (next.minPrice) params.set('minPrice', next.minPrice);
    if (next.maxPrice) params.set('maxPrice', next.maxPrice);
    return `#/search?${params.toString()}`;
  };

  const submitSearch = (event) => {
    event.preventDefault();
    onNavigate(buildSearchHash({ q: queryInput.trim(), page: 1 }));
  };

  return (
    <main className={productStyles.page}>
      <section className={productStyles.intro} aria-labelledby="search-title">
        <p className={productStyles.eyebrow}>Search the catalogue</p>
        <h1 id="search-title">{route.query ? `“${route.query}”` : 'Search'}</h1>
        <p className={productStyles.description}>
          Find keyboards, keycaps, and switches across the ClackLabs catalogue.
        </p>
      </section>

      <section className={productStyles.catalogue} aria-label="Search results">
        <form className={styles.searchForm} onSubmit={submitSearch}>
          <input
            className={styles.searchInput}
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by name, category, or description"
            aria-label="Search products"
          />
          <button className={styles.searchButton} type="submit">
            Search
          </button>
        </form>

        <div className={styles.filters}>
          <label>
            <span>Category</span>
            <select
              value={route.category || ''}
              onChange={(event) =>
                onNavigate(buildSearchHash({ category: event.target.value, page: 1 }))
              }
            >
              <option value="">All categories</option>
              {categoryOptions
                .filter((category) => category !== 'All Products')
                .map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Availability</span>
            <select
              value={route.availability || ''}
              onChange={(event) =>
                onNavigate(buildSearchHash({ availability: event.target.value, page: 1 }))
              }
            >
              <option value="">All availability</option>
              <option value="in-stock">In stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={route.sort || 'relevance'}
              onChange={(event) =>
                onNavigate(buildSearchHash({ sort: event.target.value, page: 1 }))
              }
            >
              <option value="relevance">Relevance</option>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <label className={styles.priceField}>
            <span>Min $</span>
            <input
              type="number"
              min="0"
              value={route.minPrice}
              onChange={(event) =>
                onNavigate(buildSearchHash({ minPrice: event.target.value, page: 1 }))
              }
            />
          </label>
          <label className={styles.priceField}>
            <span>Max $</span>
            <input
              type="number"
              min="0"
              value={route.maxPrice}
              onChange={(event) =>
                onNavigate(buildSearchHash({ maxPrice: event.target.value, page: 1 }))
              }
            />
          </label>
        </div>

        <p className={productStyles.resultCount}>
          {loading ? 'Searching…' : `${total} results`}
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && results.length === 0 ? (
          <p className={productStyles.emptyState}>
            No products match your search. Try a different term or filter.
          </p>
        ) : null}

        {!loading && results.length > 0 ? (
          <>
            <div className={productStyles.grid}>
              {results.map((product) => (
                <article className={productStyles.card} key={product.id || product._id}>
                  <a
                    className={productStyles.imageWrap}
                    href={`#/product/${product.id || product._id}`}
                    aria-label={`View ${product.name}`}
                  >
                    <img
                      src={imageUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                  <div className={productStyles.cardInfo}>
                    <div>
                      <p className={productStyles.category}>{product.category}</p>
                      <h2>
                        <a
                          className={productStyles.productLink}
                          href={`#/product/${product.id || product._id}`}
                        >
                          {product.name}
                        </a>
                      </h2>
                    </div>
                    <span>${product.price}.00</span>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.pagination}>
              <button
                type="button"
                disabled={(route.pageNumber || 1) <= 1}
                onClick={() =>
                  onNavigate(buildSearchHash({ page: (route.pageNumber || 1) - 1 }))
                }
              >
                Previous
              </button>
              <span>
                Page {route.pageNumber || 1} of {pages}
              </span>
              <button
                type="button"
                disabled={(route.pageNumber || 1) >= pages}
                onClick={() =>
                  onNavigate(buildSearchHash({ page: (route.pageNumber || 1) + 1 }))
                }
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

export default SearchPage;
