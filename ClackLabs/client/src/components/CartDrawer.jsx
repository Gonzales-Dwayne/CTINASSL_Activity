import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import styles from './CartDrawer.module.css';

const CartDrawer = ({ open, onClose, onNavigate }) => {
  const { items, setQuantity, removeItem, clearCart, count, cartError, clearCartError } =
    useCart();
  const { products } = useProducts();
  const [stockMessage, setStockMessage] = useState('');

  useEffect(() => {
    if (!open) return undefined;
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

  if (!open) return null;

  const lines = items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  const subtotal = lines.reduce(
    (total, line) => total + line.product.price * line.qty,
    0,
  );

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Your selection</p>
            <h2>Cart <span>{count}</span></h2>
          </div>
          <button className={styles.close} type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {cartError || stockMessage ? (
          <div className={styles.cartError} role="alert">
            <span>{stockMessage || cartError}</span>
            <button
              type="button"
              onClick={() => {
                setStockMessage('');
                clearCartError();
              }}
              aria-label="Dismiss cart message"
            >
              ×
            </button>
          </div>
        ) : null}

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <span>Find something that clicks.</span>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                onClose();
                onNavigate('#/products');
              }}
            >
              Browse all products
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.items}>
              {lines.map(({ product, qty }) => (
                <li className={styles.item} key={product.id}>
                  <button
                    className={styles.itemImage}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(`#/product/${product.id}`);
                    }}
                    aria-label={`View ${product.name}`}
                  >
                    <img src={product.image} alt="" />
                  </button>
                  <div className={styles.itemBody}>
                    <p className={styles.itemCategory}>{product.category}</p>
                    <strong>{product.name}</strong>
                    <span className={styles.itemPrice}>${product.price}.00</span>
                    {Number.isInteger(product.stock) ? (
                      <span className={styles.itemStock}>
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : 'Out of stock'}
                      </span>
                    ) : null}
                    <div className={styles.itemControls}>
                      <div className={styles.quantity}>
                        <button
                          type="button"
                          onClick={() => {
                            setStockMessage('');
                            setQuantity(product.id, qty - 1);
                          }}
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const result = setQuantity(product.id, qty + 1);
                            setStockMessage(result.ok ? '' : result.message);
                          }}
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className={styles.remove}
                        type="button"
                        onClick={() => removeItem(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <p>Shipping and taxes calculated at checkout.</p>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('#/checkout');
                }}
              >
                Checkout
              </button>
              <button className={styles.clear} type="button" onClick={clearCart}>
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
