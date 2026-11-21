import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import styles from './SearchDrawer.module.css';

const RECENT_KEY = 'clacklabs-recent-searches';

function readRecent() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

const imageUrl = (image) => {
  if (!image) return '/favicon.svg';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

const SearchDrawer = ({ open, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState(readRecent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    const term = query.trim();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ limit: '8' });
        if (term) {
          params.set('q', term);
          params.set('sort', 'relevance');
        } else {
          params.set('sort', 'featured');
        }
        const response = await fetch(`${API_BASE_URL}/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search is unavailable right now.');
        const payload = await response.json();
        setResults(Array.isArray(payload.items) ? payload.items : []);
        setTotal(payload.total || 0);
      } catch (searchError) {
        if (searchError.name === 'AbortError') return;
        setError(searchError.message);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, term ? 250 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  const rememberSearch = (term) => {
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const openResult = (product) => {
    if (query.trim()) rememberSearch(query.trim());
    onNavigate(`#/product/${product.id || product._id}`);
    onClose();
  };

  const showAllResults = () => {
    const term = query.trim();
    if (!term) return;
    rememberSearch(term);
    onNavigate(`#/search?q=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
      >
        <div className={styles.searchRow}>
          <span className={styles.searchMark} aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            value={query}
            placeholder="Search keyboards, keycaps, switches…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && query.trim()) {
                event.preventDefault();
                showAllResults();
              }
            }}
            aria-label="Search products"
          />
          <button className={styles.close} type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.meta}>
          <span>{query.trim() ? `${total} results` : 'Trending products'}</span>
          <span className={styles.hint}>Press Enter for all results</span>
        </div>

        {!query.trim() && recent.length > 0 ? (
          <div className={styles.recent}>
            <span>Recent</span>
            {recent.map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => {
                  setQuery(term);
                  inputRef.current?.focus();
                }}
              >
                {term}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className={styles.empty}>Searching…</p>
        ) : error ? (
          <p className={styles.empty}>{error}</p>
        ) : results.length === 0 ? (
          <p className={styles.empty}>
            {query.trim() ? `No products match “${query}”.` : 'No products available.'}
          </p>
        ) : (
          <ul className={styles.results}>
            {results.map((product) => (
              <li key={product.id || product._id}>
                <button
                  className={styles.result}
                  type="button"
                  onClick={() => openResult(product)}
                >
                  <span className={styles.resultImage}>
                    <img src={imageUrl(product.image)} alt="" loading="lazy" />
                  </span>
                  <span className={styles.resultText}>
                    <span className={styles.resultCategory}>{product.category}</span>
                    <strong>{product.name}</strong>
                    <span className={styles.resultPrice}>${product.price}.00</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && !loading ? (
          <button className={styles.viewAll} type="button" onClick={showAllResults}>
            View all results for “{query.trim()}” →
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SearchDrawer;
