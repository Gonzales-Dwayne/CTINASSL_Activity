import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/ProfileContext';
import styles from './AccountPage.module.css';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'wishlist', label: 'Wishlist' },
];

const TAB_HEIGHT = 40;

const EMPTY_ADDRESS = {
  label: 'Home',
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
};

const money = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((Number(cents) || 0) / 100);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const imageUrl = (image) => {
  if (!image) return '/favicon.svg';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong.');
  }
  return payload;
}

function AccountPage({ onNavigate }) {
  const { profile, token, signOut, updateProfile } = useProfile();
  const { clearCart } = useCart();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [accountUser, setAccountUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [accountResponse, ordersResponse, wishlistResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/account`, { headers }),
          fetch(`${API_BASE_URL}/api/account/orders`, { headers }),
          fetch(`${API_BASE_URL}/api/account/wishlist`, { headers }),
        ]);

        const account = await readJson(accountResponse);
        const orderData = await readJson(ordersResponse);
        const wishlistData = await readJson(wishlistResponse);

        if (!active) return;
        setAccountUser(account.user);
        setAddresses(
          Array.isArray(account.user?.addresses) ? account.user.addresses : [],
        );
        setOrders(Array.isArray(orderData) ? orderData : []);
        setWishlist(Array.isArray(wishlistData.products) ? wishlistData.products : []);
        setProfileForm({
          name: account.user?.name || profile?.name || '',
          email: account.user?.email || profile?.email || '',
        });
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [token, profile]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/account`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });
      const payload = await readJson(response);
      updateProfile(payload.user);
      setAccountUser(payload.user);
      setProfileForm({
        name: payload.user.name,
        email: payload.user.email,
      });
      setNotice('Profile updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/password`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      await readJson(response);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice('Password updated. Signing you out...');
      window.setTimeout(() => {
        clearCart();
        signOut();
        onNavigate('#/login');
      }, 1000);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const addAddress = async (event) => {
    event.preventDefault();
    setAddressSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/account/addresses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      });
      const payload = await readJson(response);
      setAddresses(payload);
      setAddressForm(EMPTY_ADDRESS);
      setShowAddressForm(false);
      setNotice('Address saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setAddressSaving(false);
    }
  };

  const setDefaultAddress = async (address) => {
    setBusy(`address-${address.id}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/account/addresses/${encodeURIComponent(address.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isDefault: true }),
        },
      );
      const payload = await readJson(response);
      setAddresses(payload);
      setNotice('Default address updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy('');
    }
  };

  const deleteAddress = async (address) => {
    if (!window.confirm('Delete this address?')) return;
    setBusy(`address-${address.id}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/account/addresses/${encodeURIComponent(address.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await readJson(response);
      setAddresses(payload);
      setNotice('Address deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy('');
    }
  };

  const removeWishlist = async (product) => {
    setBusy(`wishlist-${product.id}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/account/wishlist/${encodeURIComponent(product.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await readJson(response);
      setWishlist((current) => current.filter((item) => item.id !== product.id));
      setNotice('Removed from wishlist.');
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusy('');
    }
  };

  if (!profile) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Account</p>
        <h1>Sign in to view your account.</h1>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => onNavigate('#/login')}
        >
          Go to sign in
        </button>
      </main>
    );
  }

  const defaultAddress = addresses.find((address) => address.isDefault);
  const displayUser = accountUser || profile;
  const activeTabIndex = Math.max(
    0,
    TABS.findIndex((item) => item.id === tab),
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <p className={styles.eyebrow}>My account</p>
          <h1>{displayUser.name}</h1>
          <p className={styles.email}>{displayUser.email}</p>

          <nav className={styles.navigation} aria-label="Account sections">
            <span
              className={styles.navIndicator}
              aria-hidden="true"
              style={{ transform: `translateY(${activeTabIndex * TAB_HEIGHT}px)` }}
            />
            {TABS.map((item) => (
              <button
                className={tab === item.id ? styles.tabActive : styles.tab}
                type="button"
                key={item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {item.id === 'orders' && orders.length > 0 ? (
                  <span>{orders.length}</span>
                ) : null}
                {item.id === 'wishlist' && wishlist.length > 0 ? (
                  <span>{wishlist.length}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <button
            className={styles.signOut}
            type="button"
            onClick={() => {
              clearCart();
              signOut();
              onNavigate('#/');
            }}
          >
            Sign out
          </button>
        </aside>

        <section className={styles.content}>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
              <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
                ×
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className={styles.notice} role="status">
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className={styles.loading}>Loading your account...</div>
          ) : null}

          {!loading && tab === 'profile' ? (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Personal details</p>
                    <h2>Profile</h2>
                  </div>
                </div>
                <form className={styles.form} onSubmit={saveProfile}>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input
                        required
                        value={profileForm.name}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Email</span>
                      <input
                        required
                        type="email"
                        value={profileForm.email}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Saving...' : 'Save profile'}
                  </button>
                </form>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Account security</p>
                    <h2>Change password</h2>
                  </div>
                </div>
                <form className={styles.form} onSubmit={savePassword}>
                  <label className={styles.field}>
                    <span>Current password</span>
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>New password</span>
                      <input
                        required
                        minLength="8"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Confirm new password</span>
                      <input
                        required
                        minLength="8"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </section>
            </>
          ) : null}

          {!loading && tab === 'orders' ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Purchase history</p>
                  <h2>Orders</h2>
                </div>
              </div>
              {orders.length === 0 ? (
                <p className={styles.empty}>
                  No orders yet.{' '}
                  <button type="button" onClick={() => onNavigate('#/products')}>
                    Browse the catalogue
                  </button>
                </p>
              ) : (
                <div className={styles.orders}>
                  {orders.map((order) => (
                    <details className={styles.order} key={order._id}>
                      <summary>
                        <span>
                          <strong>{order.orderNumber || order._id.slice(-8)}</strong>
                          <small>{formatDate(order.placedAt)}</small>
                        </span>
                        <span className={styles.orderMeta}>
                          <span className={styles.status}>{order.status}</span>
                          <strong>{money(order.totalCents)}</strong>
                        </span>
                      </summary>
                      <ul className={styles.orderItems}>
                        {(order.items || []).map((item, index) => (
                          <li key={`${item.productId || index}-${index}`}>
                            <span>{item.name}</span>
                            <span>
                              {item.qty} × {money(item.unitPriceCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {!loading && tab === 'addresses' ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Delivery</p>
                  <h2>Addresses</h2>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setShowAddressForm((current) => !current)}
                >
                  {showAddressForm ? 'Cancel' : 'Add address'}
                </button>
              </div>

              {showAddressForm ? (
                <form className={`${styles.form} ${styles.addressForm}`} onSubmit={addAddress}>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Label</span>
                      <input
                        value={addressForm.label}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Full name</span>
                      <input
                        required
                        value={addressForm.name}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>Street address</span>
                    <input
                      required
                      value={addressForm.line1}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          line1: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Apartment, suite, etc.</span>
                    <input
                      value={addressForm.line2}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          line2: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>City</span>
                      <input
                        required
                        value={addressForm.city}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>State / region</span>
                      <input
                        value={addressForm.state}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            state: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Postal code</span>
                      <input
                        required
                        value={addressForm.postalCode}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            postalCode: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Country</span>
                      <input
                        required
                        value={addressForm.country}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            country: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className={styles.field}>
                    <span>Phone</span>
                    <input
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) =>
                        setAddressForm((current) => ({
                          ...current,
                          isDefault: event.target.checked,
                        }))
                      }
                    />
                    <span>Make this my default address</span>
                  </label>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={addressSaving}
                  >
                    {addressSaving ? 'Saving...' : 'Save address'}
                  </button>
                </form>
              ) : null}

              {addresses.length === 0 ? (
                <p className={styles.empty}>No saved addresses.</p>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map((address) => (
                    <article className={styles.address} key={address.id}>
                      <div className={styles.addressHeading}>
                        <strong>{address.label || 'Address'}</strong>
                        {address.isDefault ? (
                          <span className={styles.defaultBadge}>Default</span>
                        ) : null}
                      </div>
                      <p>{address.name}</p>
                      <p>{address.line1}</p>
                      {address.line2 ? <p>{address.line2}</p> : null}
                      <p>
                        {address.city}
                        {address.state ? `, ${address.state}` : ''} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone ? <p>{address.phone}</p> : null}
                      <div className={styles.addressActions}>
                        {!address.isDefault ? (
                          <button
                            className={styles.textButton}
                            type="button"
                            disabled={busy === `address-${address.id}`}
                            onClick={() => setDefaultAddress(address)}
                          >
                            Make default
                          </button>
                        ) : null}
                        <button
                          className={styles.deleteButton}
                          type="button"
                          disabled={busy === `address-${address.id}`}
                          onClick={() => deleteAddress(address)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {defaultAddress ? (
                <p className={styles.addressNote}>
                  Default delivery address: {defaultAddress.line1}, {defaultAddress.city}
                </p>
              ) : null}
            </section>
          ) : null}

          {!loading && tab === 'wishlist' ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Saved gear</p>
                  <h2>Wishlist</h2>
                </div>
              </div>
              {wishlist.length === 0 ? (
                <p className={styles.empty}>
                  Nothing saved yet.{' '}
                  <button type="button" onClick={() => onNavigate('#/products')}>
                    Browse products
                  </button>
                </p>
              ) : (
                <div className={styles.wishlistGrid}>
                  {wishlist.map((product) => (
                    <article className={styles.wishlistCard} key={product.id}>
                      <button
                        className={styles.wishlistImage}
                        type="button"
                        onClick={() => onNavigate(`#/product/${product.id}`)}
                      >
                        <img src={imageUrl(product.image)} alt={product.name} />
                      </button>
                      <p>{product.category}</p>
                      <h3>{product.name}</h3>
                      <div className={styles.wishlistFooter}>
                        <span>${product.price}.00</span>
                        <button
                          className={styles.deleteButton}
                          type="button"
                          disabled={busy === `wishlist-${product.id}`}
                          onClick={() => removeWishlist(product)}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default AccountPage;
