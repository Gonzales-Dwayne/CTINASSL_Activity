import { useEffect, useState } from 'react'
import { formatPrice, slugify } from './data/products'
import { apiRequest } from './api'
import { useProducts } from './productsStore'
import styles from './AdminPage.module.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
]

const EMPTY_DRAFT = {
  name: '',
  category: '',
  subcategory: '',
  price: '',
  stock: '',
  description: '',
  image: '#2563eb',
}

function draftFromProduct(product) {
  return {
    name: product.name,
    category: product.category,
    subcategory: product.subcategory ?? '',
    price: (product.priceCents / 100).toFixed(2),
    stock: String(product.stock),
    description: product.description,
    image: product.image,
  }
}

function stockStatus(stock) {
  if (stock === 0) return { label: 'Out of stock', tone: 'danger' }
  if (stock <= 10) return { label: 'Low stock', tone: 'warn' }
  return { label: 'In stock', tone: 'ok' }
}

function AdminPage({ user, onNavigate, onLogout }) {
  const { products, categories, createProduct, updateProduct, deleteProduct } =
    useProducts()
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [ordersResponse, customersResponse, statsResponse] =
          await Promise.all([
            apiRequest('/orders', { auth: true }),
            apiRequest('/customers', { auth: true }),
            apiRequest('/stats', { auth: true }),
          ])

        if (cancelled) return
        setOrders(ordersResponse.orders)
        setCustomers(customersResponse.customers)
        setStats(statsResponse.stats)
      } catch (error) {
        if (!cancelled) setAdminError(error.message)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const revenue = stats?.revenueCents ?? 0
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const lowStock = [...products]
    .filter((product) => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  const needle = search.trim().toLowerCase()
  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const matchesSearch =
      !needle ||
      `${product.name} ${product.category} ${product.subcategory ?? ''}`
        .toLowerCase()
        .includes(needle)
    return matchesCategory && matchesSearch
  })

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  function saveProduct(draft) {
    const priceCents = Math.round(Number(draft.price) * 100)
    const subcategory = draft.subcategory || null

    if (editing === 'new') {
      createProduct({
        id: slugify(`${draft.category}-${draft.name}`) || `product-${Date.now()}`,
        name: draft.name.trim(),
        category: draft.category,
        subcategory,
        priceCents,
        stock: Number(draft.stock) || 0,
        description: draft.description.trim(),
        image: draft.image,
      })
    } else if (editing) {
      updateProduct(editing.id, {
        name: draft.name.trim(),
        category: draft.category,
        subcategory,
        priceCents,
        stock: Number(draft.stock) || 0,
        description: draft.description.trim(),
        image: draft.image,
      })
    }

    setEditing(null)
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandMark}>L</span>
          <span className={styles.brandName}>ClackLabs</span>
        </div>
        <p className={styles.brandTag}>Admin dashboard</p>

        <nav className={styles.nav} aria-label="Admin sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={
                tab === item.id ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.storeLink}
            type="button"
            onClick={() => onNavigate('catalogue')}
          >
            View storefront ↗
          </button>

          <div className={styles.userChip}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.userText}>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </div>

          <button className={styles.signOut} type="button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>
              {TABS.find((item) => item.id === tab)?.label}
            </h1>
          </div>

          {tab === 'products' ? (
            <div className={styles.topActions}>
              <input
                className={styles.search}
                type="search"
                placeholder="Search products…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className={styles.primary}
                type="button"
                onClick={() => setEditing('new')}
              >
                + New product
              </button>
            </div>
          ) : null}
        </header>

        {adminError ? (
          <p className={styles.tableFoot} role="alert">
            {adminError}
          </p>
        ) : null}

        {tab === 'overview' ? (
          <>
            <section className={styles.stats}>
              <article className={styles.statCard}>
                <p className={styles.statLabel}>Revenue</p>
                <p className={styles.statValue}>{formatPrice(revenue)}</p>
                <p className={styles.statHint}>Excludes cancelled orders</p>
              </article>
              <article className={styles.statCard}>
                <p className={styles.statLabel}>Orders</p>
                <p className={styles.statValue}>{stats?.orders ?? 0}</p>
                <p className={styles.statHint}>Last 7 days</p>
              </article>
              <article className={styles.statCard}>
                <p className={styles.statLabel}>Products</p>
                <p className={styles.statValue}>{products.length}</p>
                <p className={styles.statHint}>Across {categories.length} categories</p>
              </article>
              <article className={styles.statCard}>
                <p className={styles.statLabel}>Units in stock</p>
                <p className={styles.statValue}>{totalStock}</p>
                <p className={styles.statHint}>
                  {stats?.lowStock ?? lowStock.length} lines running low
                </p>
              </article>
            </section>

            <div className={styles.columns}>
              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Recent orders</h2>
                  <button
                    className={styles.panelLink}
                    type="button"
                    onClick={() => setTab('orders')}
                  >
                    View all
                  </button>
                </div>
                <OrdersTable orders={orders.slice(0, 5)} />
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Low stock</h2>
                </div>
                <ul className={styles.lowStock}>
                  {lowStock.map((product) => (
                    <li key={product.id}>
                      <span
                        className={styles.swatch}
                        style={{ backgroundColor: product.image }}
                        aria-hidden="true"
                      />
                      <span className={styles.lowName}>{product.name}</span>
                      <span className={styles.lowCount}>{product.stock} left</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : null}

        {tab === 'products' ? (
          <section className={styles.panel}>
            <div className={styles.filters}>
              <button
                className={
                  category === 'All' ? `${styles.chip} ${styles.chipActive}` : styles.chip
                }
                type="button"
                onClick={() => setCategory('All')}
              >
                All
              </button>
              {categories.map((entry) => (
                <button
                  key={entry.name}
                  className={
                    category === entry.name
                      ? `${styles.chip} ${styles.chipActive}`
                      : styles.chip
                  }
                  type="button"
                  onClick={() => setCategory(entry.name)}
                >
                  {entry.name}
                </button>
              ))}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const status = stockStatus(product.stock)
                    return (
                      <tr key={product.id}>
                        <td>
                          <span className={styles.cellProduct}>
                            <span
                              className={styles.swatch}
                              style={{ backgroundColor: product.image }}
                              aria-hidden="true"
                            />
                            {product.name}
                          </span>
                        </td>
                        <td className={styles.muted}>
                          {product.category}
                          {product.subcategory ? ` · ${product.subcategory}` : ''}
                        </td>
                        <td>{formatPrice(product.priceCents)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className={`${styles.pill} ${styles[status.tone]}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          {confirmId === product.id ? (
                            <span className={styles.confirmRow}>
                              <button
                                className={styles.dangerButton}
                                type="button"
                                onClick={() => {
                                  deleteProduct(product.id)
                                  setConfirmId(null)
                                }}
                              >
                                Delete
                              </button>
                              <button
                                className={styles.rowButton}
                                type="button"
                                onClick={() => setConfirmId(null)}
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <span className={styles.confirmRow}>
                              <button
                                className={styles.rowButton}
                                type="button"
                                onClick={() => setEditing(product)}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.rowButton}
                                type="button"
                                onClick={() => setConfirmId(product.id)}
                              >
                                Delete
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className={styles.tableFoot}>
              {visibleProducts.length} of {products.length} products
            </p>
          </section>
        ) : null}

        {tab === 'orders' ? (
          <section className={styles.panel}>
            <OrdersTable orders={orders} />
          </section>
        ) : null}

        {tab === 'customers' ? (
          <section className={styles.panel}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.email}>
                      <td>{customer.name}</td>
                      <td className={styles.muted}>{customer.email}</td>
                      <td>
                        <span className={`${styles.pill} ${styles.neutral}`}>
                          {customer.role}
                        </span>
                      </td>
                      <td>{customer.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>

      {editing ? (
        <ProductForm
          categories={categories}
          initial={
            editing === 'new'
              ? { ...EMPTY_DRAFT, category: categories[0]?.name ?? '' }
              : draftFromProduct(editing)
          }
          mode={editing === 'new' ? 'create' : 'edit'}
          onCancel={() => setEditing(null)}
          onSave={saveProduct}
        />
      ) : null}
    </div>
  )
}

function OrdersTable({ orders }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className={styles.mono}>{order.id}</td>
              <td>
                {order.customer}
                <span className={styles.subtle}>{order.email}</span>
              </td>
              <td>{order.items}</td>
              <td>{formatPrice(order.totalCents)}</td>
              <td>
                <span className={`${styles.pill} ${styles[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className={styles.muted}>{order.placedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductForm({ initial, mode, categories, onCancel, onSave }) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')

  const subcategoryOptions =
    categories.find((entry) => entry.name === draft.category)?.subcategories ?? []

  function set(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!draft.name.trim()) {
      setError('Product name is required.')
      return
    }
    if (!(Number(draft.price) > 0)) {
      setError('Price must be greater than zero.')
      return
    }
    if (Number(draft.stock) < 0 || Number.isNaN(Number(draft.stock))) {
      setError('Stock must be zero or more.')
      return
    }

    onSave(draft)
  }

  return (
    <div className={styles.modalOverlay} role="presentation">
      <form
        className={styles.modal}
        onSubmit={handleSubmit}
        aria-label={mode === 'create' ? 'New product' : 'Edit product'}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>
            {mode === 'create' ? 'New product' : 'Edit product'}
          </h2>
          <button
            className={styles.modalClose}
            type="button"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="ClackLabs Nova 75"
          />
        </label>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              value={draft.category}
              onChange={(event) => {
                set('category', event.target.value)
                set('subcategory', '')
              }}
            >
              {categories.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Subcategory</span>
            <select
              value={draft.subcategory}
              onChange={(event) => set('subcategory', event.target.value)}
              disabled={subcategoryOptions.length === 0}
            >
              <option value="">—</option>
              {subcategoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span className={styles.label}>Price (PHP)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => set('price', event.target.value)}
              placeholder="5990"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Stock</span>
            <input
              type="number"
              min="0"
              step="1"
              value={draft.stock}
              onChange={(event) => set('stock', event.target.value)}
              placeholder="24"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Swatch</span>
            <input
              className={styles.color}
              type="color"
              value={draft.image}
              onChange={(event) => set('image', event.target.value)}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea
            rows="3"
            value={draft.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="75% aluminum board with gasket mount."
          />
        </label>

        {error ? (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.modalActions}>
          <button className={styles.secondary} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.primary} type="submit">
            {mode === 'create' ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminPage
