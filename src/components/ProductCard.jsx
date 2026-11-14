import { formatPrice } from '../data/products'
import styles from './ProductCard.module.css'

function ProductCard({ product, onSelect }) {
  const meta = product.subcategory
    ? `${product.category} · ${product.subcategory}`
    : product.category

  return (
    <button
      className={styles.card}
      type="button"
      onClick={() => onSelect?.(product)}
    >
      <span
        className={styles.thumb}
        style={{ backgroundColor: product.image }}
        aria-hidden="true"
      />
      <span className={styles.info}>
        <span className={styles.category}>{meta}</span>
        <span className={styles.name}>{product.name}</span>
        <span className={styles.price}>{formatPrice(product.priceCents)}</span>
      </span>
    </button>
  )
}

export default ProductCard
