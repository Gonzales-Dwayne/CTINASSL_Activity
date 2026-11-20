import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from './Icons'
import { formatPrice, searchProducts } from '../data/products'
import { useProducts } from '../productsStore'
import styles from './Drawers.module.css'

const MAX_PREVIEW = 5

function SearchDrawer({ onClose, onViewAll, onSelectProduct }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const { products } = useProducts()
  const results = searchProducts(products, query)
  const trimmed = query.trim()

  useEffect(() => {
    inputRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Search</h2>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <label className={styles.field}>
          <SearchIcon size={18} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search products…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results.length > 0) {
                onViewAll(query)
              }
            }}
          />
        </label>

        {trimmed === '' ? (
          <p className={styles.hint}>
            Start typing to search {products.length} products.
          </p>
        ) : results.length === 0 ? (
          <p className={styles.empty}>No products match “{trimmed}”.</p>
        ) : (
          <ul className={styles.results}>
            {results.slice(0, MAX_PREVIEW).map((product) => (
              <li key={product.id}>
                <button
                  className={styles.result}
                  type="button"
                  onClick={() => onSelectProduct?.(product)}
                >
                  <span
                    className={styles.resultThumb}
                    style={{ backgroundColor: product.image }}
                    aria-hidden="true"
                  />
                  <span className={styles.resultInfo}>
                    <span className={styles.resultName}>{product.name}</span>
                    <span className={styles.resultMeta}>
                      {product.category} · {formatPrice(product.priceCents)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className={styles.viewAll}
          type="button"
          disabled={results.length === 0}
          onClick={() => onViewAll(query)}
        >
          {results.length > 0
            ? `View all results (${results.length})`
            : 'View all results'}
        </button>
      </aside>
    </div>
  )
}

export default SearchDrawer
