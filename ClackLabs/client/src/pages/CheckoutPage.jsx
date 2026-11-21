import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/ProfileContext';
import styles from './CheckoutPage.module.css';

const EMPTY_ADDRESS = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

const money = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((Number(cents) || 0) / 100);

const imageUrl = (image) => {
  if (!image) return '/favicon.svg';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Checkout could not be completed.');
    error.payload = payload;
    throw error;
  }
  return payload;
}

function CheckoutPage({ onNavigate }) {
  const { profile, token } = useProfile();
  const { items, clearCart } = useCart();
  const [contactEmail, setContactEmail] = useState(profile?.email || '');
  const [shippingAddress, setShippingAddress] = useState({
    ...EMPTY_ADDRESS,
    name: profile?.name || '',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('demo-card');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const cartPayload = items.map((item) => ({ productId: item.id, qty: item.qty }));

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const accountResponse = await fetch(`${API_BASE_URL}/api/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (accountResponse.ok) {
          const account = await accountResponse.json();
          const defaultAddress = account.user?.addresses?.find(
            (address) => address.isDefault,
          );
          if (active && defaultAddress) {
            setShippingAddress((current) => ({
              ...current,
              ...defaultAddress,
              name: defaultAddress.name || current.name,
            }));
          }
        }
      } catch {
        // Checkout still works without a saved address.
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/checkout/summary`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shippingMethod, items: cartPayload }),
        });
        const payload = await readJson(response);
        if (!active) return;
        setSummary(payload);
        if (payload.warnings?.length) setError(payload.warnings[0].message);
      } catch (summaryError) {
        if (active) {
          setError(summaryError.message);
          setSummary(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, shippingMethod, items]);

  const updateAddress = (field, value) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setPlacing(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactEmail,
          shippingAddress,
          shippingMethod,
          paymentMethod,
          items: cartPayload,
        }),
      });
      const payload = await readJson(response);
      clearCart();
      onNavigate(`#/order/${payload.orderId}`);
    } catch (checkoutError) {
      setError(checkoutError.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!profile) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>Sign in to complete your order.</h1>
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

  if (items.length === 0 && !placing) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>Your cart is empty.</h1>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => onNavigate('#/products')}
        >
          Browse products
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <button className={styles.logo} type="button" onClick={() => onNavigate('#/')}>
          <b>CL</b>
          <span>Checkout</span>
        </button>
        <button
          className={styles.back}
          type="button"
          onClick={() => onNavigate('#/products')}
        >
          Continue shopping
        </button>
      </div>

      <form className={styles.shell} onSubmit={placeOrder}>
        <div className={styles.formColumn}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>01 — Contact</p>
            <h2>Where should we send your receipt?</h2>
            <label className={styles.field}>
              <span>Email</span>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                autoComplete="email"
              />
            </label>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>02 — Shipping</p>
            <h2>Delivery address</h2>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Full name</span>
                <input
                  required
                  value={shippingAddress.name}
                  onChange={(event) => updateAddress('name', event.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className={styles.field}>
                <span>Phone</span>
                <input
                  value={shippingAddress.phone}
                  onChange={(event) => updateAddress('phone', event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                <span>Street address</span>
                <input
                  required
                  value={shippingAddress.line1}
                  onChange={(event) => updateAddress('line1', event.target.value)}
                  autoComplete="address-line1"
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                <span>Apartment, suite, etc.</span>
                <input
                  value={shippingAddress.line2}
                  onChange={(event) => updateAddress('line2', event.target.value)}
                  autoComplete="address-line2"
                />
              </label>
              <label className={styles.field}>
                <span>City</span>
                <input
                  required
                  value={shippingAddress.city}
                  onChange={(event) => updateAddress('city', event.target.value)}
                  autoComplete="address-level2"
                />
              </label>
              <label className={styles.field}>
                <span>State / region</span>
                <input
                  value={shippingAddress.state}
                  onChange={(event) => updateAddress('state', event.target.value)}
                  autoComplete="address-level1"
                />
              </label>
              <label className={styles.field}>
                <span>Postal code</span>
                <input
                  required
                  value={shippingAddress.postalCode}
                  onChange={(event) => updateAddress('postalCode', event.target.value)}
                  autoComplete="postal-code"
                />
              </label>
              <label className={styles.field}>
                <span>Country</span>
                <input
                  required
                  value={shippingAddress.country}
                  onChange={(event) => updateAddress('country', event.target.value)}
                  autoComplete="country-name"
                />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>03 — Delivery</p>
            <h2>Shipping method</h2>
            <div className={styles.options}>
              <label>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={() => setShippingMethod('standard')}
                />
                <span>
                  <strong>Standard delivery</strong>
                  <small>3–5 business days</small>
                </span>
                <b>{summary?.totals?.shippingCents === 0 ? 'Free' : '$8.00'}</b>
              </label>
              <label>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={() => setShippingMethod('express')}
                />
                <span>
                  <strong>Express delivery</strong>
                  <small>1–2 business days</small>
                </span>
                <b>$18.00</b>
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>04 — Payment</p>
            <h2>Payment method</h2>
            <div className={styles.options}>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="demo-card"
                  checked={paymentMethod === 'demo-card'}
                  onChange={() => setPaymentMethod('demo-card')}
                />
                <span>
                  <strong>Test card</strong>
                  <small>Demo payment — order marked paid</small>
                </span>
                <b>Instant</b>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span>
                  <strong>Pay on delivery</strong>
                  <small>Order remains pending</small>
                </span>
                <b>Later</b>
              </label>
            </div>
            <p className={styles.paymentNote}>
              No live payment provider is connected yet. Test card marks the order paid
              without charging a card.
            </p>
          </section>
        </div>

        <aside className={styles.summary}>
          <p className={styles.eyebrow}>Order summary</p>
          <h2>Your setup</h2>

          {loading ? <p className={styles.muted}>Checking stock…</p> : null}
          {summary?.items?.length ? (
            <ul className={styles.items}>
              {summary.items.map((item) => (
                <li key={item.productId}>
                  <img src={imageUrl(item.image)} alt="" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>Qty {item.qty}</small>
                  </span>
                  <b>{money(item.priceCents * item.qty)}</b>
                </li>
              ))}
            </ul>
          ) : null}

          {summary?.totals ? (
            <div className={styles.totals}>
              <div>
                <span>Subtotal</span>
                <strong>{money(summary.totals.subtotalCents)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>
                  {summary.totals.shippingCents === 0
                    ? 'Free'
                    : money(summary.totals.shippingCents)}
                </strong>
              </div>
              <div>
                <span>Estimated tax (8%)</span>
                <strong>{money(summary.totals.taxCents)}</strong>
              </div>
              <div className={styles.total}>
                <span>Total</span>
                <strong>{money(summary.totals.totalCents)}</strong>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button
            className={styles.primaryButton}
            type="submit"
            disabled={placing || loading || !summary?.totals || Boolean(error)}
          >
            {placing ? 'Placing order…' : 'Place order'}
          </button>
          <p className={styles.finePrint}>
            Stock is checked again when the order is placed. By placing this order you
            confirm the delivery details above.
          </p>
        </aside>
      </form>
    </main>
  );
}

export default CheckoutPage;
