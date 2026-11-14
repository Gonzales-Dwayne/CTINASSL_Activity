import { useEffect } from 'react'
import { formatPrice, getProduct } from '../data/products'
import styles from './Drawers.module.css'

function CartDrawer({ items, onClose, onBrowse, onQty, onRemove }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const lines = items
    .map((line) => ({ ...line, product: getProduct(line.productId) }))
    .filter((line) => line.product)

  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.qty,
    0,
  )

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Cart</h2>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <div className={styles.cartEmpty}>
            <p className={styles.empty}>Your cart is empty.</p>
            <p className={styles.hint}>
              Add a product from the catalogue and it will show up here.
            </p>
          </div>
        ) : (
          <ul className={styles.cartList}>
            {lines.map((line) => (
              <li className={styles.cartItem} key={line.productId}>
                <span
                  className={styles.cartThumb}
                  style={{ backgroundColor: line.product.image }}
                  aria-hidden="true"
                />
                <span className={styles.cartInfo}>
                  <span className={styles.cartName}>{line.product.name}</span>
                  <span className={styles.cartMeta}>
                    {formatPrice(line.product.priceCents)}
                  </span>
                  <span className={styles.qtyRow}>
                    <button
                      type="button"
                      onClick={() => onQty(line.productId, -1)}
                      aria-label={`Decrease quantity of ${line.product.name}`}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => onQty(line.productId, 1)}
                      aria-label={`Increase quantity of ${line.product.name}`}
                    >
                      +
                    </button>
                    <button
                      className={styles.remove}
                      type="button"
                      onClick={() => onRemove(line.productId)}
                    >
                      Remove
                    </button>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.cartFooter}>
          <div className={styles.cartTotalRow}>
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <button
            className={styles.viewAll}
            type="button"
            disabled={lines.length === 0}
            onClick={onClose}
          >
            {lines.length === 0 ? 'Cart is empty' : 'Checkout'}
          </button>
          <button className={styles.linkButton} type="button" onClick={onBrowse}>
            Continue shopping
          </button>
        </div>
      </aside>
    </div>
  )
}

export default CartDrawer
