import { useState } from 'react'
import ProductCard from './components/ProductCard'
import {
  detailsFor,
  formatPrice,
  getProduct,
  productsInCategory,
} from './data/products'
import { useProducts } from './productsStore'
import styles from './ProductPage.module.css'

function ProductPage({ productId, onNavigate, onAdd }) {
  const [quantity, setQuantity] = useState(1)
  const { products, loading } = useProducts()
  const product = getProduct(products, productId)

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.meta}>Loading product…</p>
        </main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.meta}>Product not found.</p>
          <button
            className={styles.back}
            type="button"
            onClick={() => onNavigate('catalogue')}
          >
            ← Back to catalogue
          </button>
        </main>
      </div>
    )
  }

  const related = productsInCategory(products, product.category)
    .filter((item) => item.id !== product.id)
    .slice(0, 4)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <button
          className={styles.back}
          type="button"
          onClick={() => onNavigate('catalogue', product.category)}
        >
          ← {product.category}
        </button>

        <div className={styles.layout}>
          <div
            className={styles.thumb}
            style={{ backgroundColor: product.image }}
            aria-hidden="true"
          />

          <div className={styles.info}>
            <p className={styles.meta}>
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ''}
            </p>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.price}>{formatPrice(product.priceCents)}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.purchase}>
              <div className={styles.qty}>
                <span className={styles.qtyLabel}>Qty</span>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className={styles.add}
                type="button"
                onClick={() => onAdd(product, quantity)}
              >
                Add to cart · {formatPrice(product.priceCents * quantity)}
              </button>
            </div>

            <p className={styles.note}>
              Free shipping over ₱3,000 · 7-day returns · Ships in 2–3 days
            </p>

            <ul className={styles.details}>
              {(product.details ?? detailsFor(product)).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>

        {related.length > 0 ? (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>More in {product.category}</h2>
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <ProductCard
                  product={item}
                  key={item.id}
                  onSelect={() => onNavigate('product', null, '', item.id)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default ProductPage
