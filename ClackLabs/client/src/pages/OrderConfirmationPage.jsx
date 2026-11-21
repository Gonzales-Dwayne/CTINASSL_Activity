import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useProfile } from '../context/ProfileContext';
import styles from './OrderConfirmationPage.module.css';

const money = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((Number(cents) || 0) / 100);

function OrderConfirmationPage({ orderId, onNavigate }) {
  const { profile, token } = useProfile();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !orderId) return undefined;

    let active = true;
    fetch(`${API_BASE_URL}/api/account/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Order not found.');
        if (active) setOrder(payload);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, orderId]);

  if (!profile) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Order</p>
        <h1>Sign in to view this order.</h1>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => onNavigate('#/login')}
        >
          Sign in
        </button>
      </main>
    );
  }

  if (loading) {
    return <main className={styles.gate}>Loading your order…</main>;
  }

  if (error || !order) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Order</p>
        <h1>{error || 'Order not found.'}</h1>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => onNavigate('#/account')}
        >
          Go to account
        </button>
      </main>
    );
  }

  const paid = order.status === 'paid';

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Order confirmed</p>
        <h1>{paid ? 'Payment received.' : 'Order received.'}</h1>
        <p className={styles.lead}>
          Thank you, {order.shippingAddress?.name || profile.name}. Your order{' '}
          <strong>{order.orderNumber}</strong> is in.
        </p>
        {order.contactEmail ? (
          <p className={styles.lead}>
            A confirmation was prepared for {order.contactEmail}. Email delivery is not
            connected yet.
          </p>
        ) : null}
      </div>

      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Items</h2>
            <span className={styles.status}>{order.status}</span>
          </div>
          <ul className={styles.items}>
            {(order.items || []).map((item, index) => (
              <li key={`${item.productId || index}-${index}`}>
                <span>
                  <strong>{item.name}</strong>
                  <small>Qty {item.qty}</small>
                </span>
                <b>{money(item.unitPriceCents * item.qty)}</b>
              </li>
            ))}
          </ul>
          <div className={styles.totals}>
            <div>
              <span>Subtotal</span>
              <strong>
                {money(
                  order.subtotalCents ??
                    (order.totalCents || 0) -
                      (order.shippingCents || 0) -
                      (order.taxCents || 0),
                )}
              </strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>
                {order.shippingCents === 0 ? 'Free' : money(order.shippingCents)}
              </strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>{money(order.taxCents)}</strong>
            </div>
            <div className={styles.total}>
              <span>Total</span>
              <strong>{money(order.totalCents)}</strong>
            </div>
          </div>
        </section>

        <aside className={styles.side}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Delivery</p>
            <h2>{order.shippingAddress?.name}</h2>
            <p>
              {order.shippingAddress?.line1}
              {order.shippingAddress?.line2 ? (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              ) : null}
              <br />
              {order.shippingAddress?.city}
              {order.shippingAddress?.state
                ? `, ${order.shippingAddress.state}`
                : ''}{' '}
              {order.shippingAddress?.postalCode}
              <br />
              {order.shippingAddress?.country}
            </p>
            <p className={styles.meta}>
              {order.shippingMethod || 'Standard delivery'}
              <br />
              {order.paymentMethod === 'demo-card'
                ? 'Test card payment'
                : 'Pay on delivery'}
            </p>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>What happens next</p>
            <p className={styles.next}>
              {paid
                ? 'We’ll prepare your order and send a dispatch update when it leaves the studio.'
                : 'Your order is pending. Payment will be collected on delivery.'}
            </p>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => onNavigate('#/account')}
            >
              View order history
            </button>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => onNavigate('#/products')}
            >
              Continue shopping
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default OrderConfirmationPage;
