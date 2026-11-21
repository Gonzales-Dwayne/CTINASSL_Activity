import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useProfile } from '../context/ProfileContext';
import styles from './AdminPage.module.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
];

const EMPTY_CATEGORY = {
  name: '',
  description: '',
  image: '',
  sortOrder: 0,
};

const EMPTY_FORM = {
  name: '',
  category: 'Keyboards',
  price: '',
  stock: '',
  image: '/images/Flow84.webp',
  description: '',
  featured: false,
  detailsText: '',
  specsText: '',
  sku: '',
  barcode: '',
  lowStockThreshold: '5',
  restockNote: '',
};

const ORDER_STATUSES = [
  'pending',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const imageUrl = (image) => {
  const value = image || '/images/Flow84.webp';
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim()));
}

function AdminPage({ onNavigate }) {
  const { profile, token, authLoading, signOut } = useProfile();
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [busy, setBusy] = useState('');
  const [passwordEditor, setPasswordEditor] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [categorySaving, setCategorySaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsResponse, productsResponse, ordersResponse, usersResponse, categoriesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/products`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/orders`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/categories`, { headers }),
        ]);

      const responses = [
        statsResponse,
        productsResponse,
        ordersResponse,
        usersResponse,
        categoriesResponse,
      ];
      if (responses.some((response) => !response.ok)) {
        const failed = responses.find((response) => !response.ok);
        const payload = await failed.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load the admin dashboard.');
      }

      const [statsData, productsData, ordersData, usersData, categoriesData] =
        await Promise.all(responses.map((response) => response.json()));

      setStats(statsData);
      setProducts(productsData);
      setOrders(ordersData);
      setCustomers(usersData);
      setCategories(categoriesData);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [token, loadData]);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [products, query]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?.name || 'Keyboards',
    });
    setEditor({ mode: 'create', product: null });
    setError('');
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || EMPTY_FORM.image,
      description: product.description || '',
      featured: Boolean(product.featured),
      detailsText: Array.isArray(product.details) ? product.details.join('\n') : '',
      specsText:
        product.specs && typeof product.specs === 'object'
          ? Object.entries(product.specs)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n')
          : '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      restockNote: product.restockNote || '',
    });
    setEditor({ mode: 'edit', product });
    setError('');
  };

  const closeEditor = () => {
    if (!saving) setEditor(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editor) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const editing = editor.mode === 'edit';
      const url = editing
        ? `${API_BASE_URL}/api/admin/products/${encodeURIComponent(editor.product.id || editor.product._id)}`
        : `${API_BASE_URL}/api/admin/products`;

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          stock: Number(form.stock),
          image: form.image,
          description: form.description,
          featured: form.featured,
          sku: form.sku,
          barcode: form.barcode,
          lowStockThreshold: Number(form.lowStockThreshold),
          restockNote: form.restockNote,
          details: form.detailsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          specs: Object.fromEntries(
            form.specsText
              .split('\n')
              .map((line) => {
                const separator = line.indexOf(':');
                if (separator === -1) return null;
                const key = line.slice(0, separator).trim();
                const value = line.slice(separator + 1).trim();
                return key && value ? [key, value] : null;
              })
              .filter(Boolean),
          ),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save the product.');
      }

      setEditor(null);
      setNotice(editing ? 'Product updated.' : 'Product created.');
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Archive “${product.name}”? It will be hidden from the storefront.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id || product._id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${encodeURIComponent(product.id || product._id)}/${product.archived ? 'restore' : 'archive'}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the product.');
      }
      setNotice(product.archived ? 'Product restored.' : 'Product archived.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  const duplicateProduct = async (product) => {
    setBusy(`duplicate-${product.id || product._id}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${encodeURIComponent(product.id || product._id)}/duplicate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to duplicate the product.');
      }
      setNotice('Product duplicated. Update the copy before publishing.');
      await loadData();
    } catch (duplicateError) {
      setError(duplicateError.message);
    } finally {
      setBusy('');
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to upload the image.');
      }
      setForm((current) => ({ ...current, image: payload.url }));
      setNotice('Image uploaded.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const openCategoryCreate = () => {
    setCategoryForm(EMPTY_CATEGORY);
    setCategoryEditor({ mode: 'create', category: null });
    setError('');
  };

  const openCategoryEdit = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sortOrder: category.sortOrder ?? 0,
    });
    setCategoryEditor({ mode: 'edit', category });
    setError('');
  };

  const closeCategoryEditor = () => {
    if (!categorySaving) setCategoryEditor(null);
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!categoryEditor) return;
    setCategorySaving(true);
    setError('');
    setNotice('');

    try {
      const editing = categoryEditor.mode === 'edit';
      const url = editing
        ? `${API_BASE_URL}/api/admin/categories/${encodeURIComponent(categoryEditor.category._id)}`
        : `${API_BASE_URL}/api/admin/categories`;
      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...categoryForm,
          sortOrder: Number(categoryForm.sortOrder),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save the category.');
      }
      setCategoryEditor(null);
      setNotice(editing ? 'Category updated.' : 'Category created.');
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    setBusy(`category-${category._id}`);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/categories/${encodeURIComponent(category._id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete the category.');
      }
      setNotice('Category deleted.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy('');
    }
  };

  const exportProductsCsv = () => {
    const columns = [
      'id',
      'name',
      'category',
      'price',
      'stock',
      'sku',
      'barcode',
      'featured',
      'archived',
      'lowStockThreshold',
      'restockNote',
      'description',
    ];
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      columns.join(','),
      ...products.map((product) =>
        columns.map((column) => escape(product[column])).join(','),
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clacklabs-products.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelected = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    setSelected((current) => {
      const allSelected =
        filteredProducts.length > 0 &&
        filteredProducts.every((product) => current.has(product.id || product._id));
      return allSelected
        ? new Set()
        : new Set(filteredProducts.map((product) => product.id || product._id));
    });
  };

  const bulkArchive = async (archived) => {
    if (selected.size === 0) return;
    setBusy('bulk');
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [...selected], archived }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the selected products.');
      }
      setSelected(new Set());
      setNotice(
        `${payload.updated} product${payload.updated === 1 ? '' : 's'} ${
          archived ? 'archived' : 'restored'
        }.`,
      );
      await loadData();
    } catch (bulkError) {
      setError(bulkError.message);
    } finally {
      setBusy('');
    }
  };

  const importProductsCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    setError('');
    setNotice('');
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The CSV file has no product rows.');
      const headers = rows[0].map((header) => header.trim());
      let imported = 0;
      const failures = [];

      for (const row of rows.slice(1)) {
        const record = Object.fromEntries(
          headers.map((header, index) => [header, row[index] ?? '']),
        );
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: record.name,
            category: record.category,
            price: Number(record.price),
            stock: Number(record.stock),
            description: record.description,
            image: record.image || '/images/Flow84.webp',
            sku: record.sku || '',
            barcode: record.barcode || '',
            featured: ['true', '1', 'yes'].includes(String(record.featured).toLowerCase()),
            lowStockThreshold: Number(record.lowStockThreshold || 5),
            restockNote: record.restockNote || '',
          }),
        });
        if (response.ok) imported += 1;
        else {
          const payload = await response.json().catch(() => ({}));
          failures.push(`${record.name}: ${payload.error || 'failed'}`);
        }
      }

      setNotice(
        `${imported} product${imported === 1 ? '' : 's'} imported${
          failures.length ? `; ${failures.length} failed` : ''
        }.`,
      );
      if (failures.length) setError(failures.slice(0, 3).join(' '));
      await loadData();
    } catch (importError) {
      setError(importError.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    onNavigate('#/login');
  };

  const updateOrderStatus = async (order, status) => {
    if (!status || status === order.status) return;
    setBusy(`order-${order._id}`);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(order._id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the order.');
      }
      setNotice('Order status updated.');
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy('');
    }
  };

  const deleteOrder = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber || order._id}?`)) return;
    setBusy(`order-${order._id}`);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(order._id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete the order.');
      }
      setNotice('Order deleted.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy('');
    }
  };

  const updateCustomerRole = async (customer, role) => {
    if (!role || role === customer.role) return;
    setBusy(`user-${customer.id}`);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(customer.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the customer.');
      }
      setNotice('Customer role updated.');
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy('');
    }
  };

  const deleteCustomer = async (customer) => {
    if (!window.confirm(`Delete ${customer.name} (${customer.email})?`)) return;
    setBusy(`user-${customer.id}`);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(customer.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete the customer.');
      }
      setNotice('Customer deleted.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy('');
    }
  };

  const openPasswordEditor = (customer) => {
    setPasswordEditor(customer);
    setPasswordForm({ password: '', confirm: '' });
    setPasswordError('');
  };

  const closePasswordEditor = () => {
    if (!passwordSaving) setPasswordEditor(null);
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (!passwordEditor) return;

    if (passwordForm.password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('The passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(passwordEditor.id)}/password`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: passwordForm.password }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the password.');
      }
      setPasswordEditor(null);
      setNotice(`Password updated for ${passwordEditor.name}.`);
    } catch (updateError) {
      setPasswordError(updateError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className={styles.gate}>
        <p>Checking your admin session…</p>
      </main>
    );
  }

  if (!profile || profile.role !== 'admin' || !token) {
    return (
      <main className={styles.gate}>
        <p className={styles.eyebrow}>Admin</p>
        <h1>Administrator access required.</h1>
        <p>
          {profile
            ? 'This account does not have administrator access.'
            : 'Sign in with an administrator account to manage the store.'}
        </p>
        <div className={styles.gateActions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => onNavigate('#/login')}
          >
            Go to sign in
          </button>
        </div>
      </main>
    );
  }

  const statCards = [
    { label: 'Products', value: stats?.products ?? '—' },
    { label: 'Orders', value: stats?.orders ?? '—' },
    { label: 'Customers', value: stats?.users ?? '—' },
    { label: 'Revenue', value: money((stats?.revenueCents || 0) / 100) },
    { label: 'Low stock', value: stats?.lowStock ?? '—' },
  ];

  const previewImage = form.image?.trim()
    ? imageUrl(form.image.trim())
    : imageUrl('/images/Flow84.webp');

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Admin sections">
        <div className={styles.brand}>
          <span>CL</span>
          <small>Admin</small>
        </div>

        <nav className={styles.nav}>
          <span
            className={styles.navIndicator}
            aria-hidden="true"
            style={{
              transform: `translateY(${
                Math.max(0, TABS.findIndex((item) => item.id === tab)) * 40
              }px)`,
            }}
          />
          {TABS.map((item) => (
            <button
              className={tab === item.id ? styles.tabActive : styles.tab}
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>{profile.email}</span>
          <button
            className={styles.signOut}
            type="button"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Admin workspace</p>
            <h1>{TABS.find((item) => item.id === tab)?.label}</h1>
          </div>
          <span className={styles.roleBadge}>Administrator</span>
        </header>

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
            <div className={styles.loading}>Loading dashboard…</div>
          ) : (
            <>
              {tab === 'overview' ? (
                <>
                  <div className={styles.statsGrid}>
                    {statCards.map((card) => (
                      <div className={styles.statCard} key={card.label}>
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className={styles.overviewColumns}>
                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <h2>Recent products</h2>
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => setTab('products')}
                        >
                          Manage products
                        </button>
                      </div>
                      <div className={styles.compactList}>
                        {products.slice(0, 5).map((product) => (
                          <div className={styles.compactRow} key={product.id || product._id}>
                            <img src={imageUrl(product.image)} alt="" />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{product.category}</small>
                            </span>
                            <span>{money(product.price)}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <h2>Recent orders</h2>
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => setTab('orders')}
                        >
                          View orders
                        </button>
                      </div>
                      <div className={styles.compactList}>
                        {orders.slice(0, 5).map((order) => (
                          <div className={styles.compactRow} key={order._id}>
                            <span>
                              <strong>{order.orderNumber || order._id.slice(-6)}</strong>
                              <small>{formatDate(order.placedAt)}</small>
                            </span>
                            <span className={styles.status}>{order.status || '—'}</span>
                            <span>{money((order.totalCents || 0) / 100)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              ) : null}

              {tab === 'products' ? (
                <>
                  <div className={styles.toolbar}>
                    <input
                      className={styles.search}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search products…"
                      aria-label="Search products"
                    />
                    <div className={styles.toolbarActions}>
                      {selected.size > 0 ? (
                        <>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={busy === 'bulk'}
                            onClick={() => bulkArchive(true)}
                          >
                            Archive selected ({selected.size})
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={busy === 'bulk'}
                            onClick={() => bulkArchive(false)}
                          >
                            Restore selected
                          </button>
                        </>
                      ) : null}
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={exportProductsCsv}
                      >
                        Export CSV
                      </button>
                      <label className={`${styles.secondaryButton} ${styles.fileButton}`}>
                        {importing ? 'Importing...' : 'Import CSV'}
                        <input
                          className={styles.fileInput}
                          type="file"
                          accept=".csv,text/csv"
                          onChange={importProductsCsv}
                          disabled={importing}
                        />
                      </label>
                      <button className={styles.primaryButton} type="button" onClick={openCreate}>
                        + New product
                      </button>
                    </div>
                  </div>

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.selectColumn}>
                            <input
                              type="checkbox"
                              checked={
                                filteredProducts.length > 0 &&
                                filteredProducts.every((product) =>
                                  selected.has(product.id || product._id),
                                )
                              }
                              onChange={toggleAllSelected}
                              aria-label="Select all products"
                            />
                          </th>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th>Featured</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id || product._id}>
                            <td className={styles.selectColumn}>
                              <input
                                type="checkbox"
                                checked={selected.has(product.id || product._id)}
                                onChange={() => toggleSelected(product.id || product._id)}
                                aria-label={`Select ${product.name}`}
                              />
                            </td>
                            <td>
                              <div className={styles.productCell}>
                                <img src={imageUrl(product.image)} alt="" />
                                <span>
                                  {product.name}
                                  {product.sku ? <small>SKU {product.sku}</small> : null}
                                </span>
                              </div>
                            </td>
                            <td>{product.category}</td>
                            <td>${product.price}</td>
                            <td>
                              <span
                                className={
                                  product.stock <= (product.lowStockThreshold ?? 5)
                                    ? styles.lowStock
                                    : undefined
                                }
                                title={product.restockNote || undefined}
                              >
                                {product.stock}
                              </span>
                            </td>
                            <td>
                              <span className={styles.status}>
                                {product.archived ? 'archived' : 'active'}
                              </span>
                            </td>
                            <td>{product.featured ? 'Yes' : '—'}</td>
                            <td>
                              <div className={styles.rowActions}>
                                <button
                                  className={styles.textButton}
                                  type="button"
                                  onClick={() => openEdit(product)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={styles.textButton}
                                  type="button"
                                  disabled={busy === `duplicate-${product.id || product._id}`}
                                  onClick={() => duplicateProduct(product)}
                                >
                                  Duplicate
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  type="button"
                                  disabled={deletingId === (product.id || product._id)}
                                  onClick={() => handleDelete(product)}
                                >
                                  {deletingId === (product.id || product._id)
                                    ? 'Saving…'
                                    : product.archived
                                      ? 'Restore'
                                      : 'Archive'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 ? (
                      <p className={styles.empty}>No products match your search.</p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {tab === 'categories' ? (
                <>
                  <div className={styles.toolbar}>
                    <p className={styles.toolbarNote}>
                      Categories power the storefront navigation and product filters.
                    </p>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={openCategoryCreate}
                    >
                      + New category
                    </button>
                  </div>

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Products</th>
                          <th>Order</th>
                          <th aria-label="Actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category._id}>
                            <td>
                              <div className={styles.productCell}>
                                {category.image ? (
                                  <img src={imageUrl(category.image)} alt="" />
                                ) : null}
                                <span>{category.name}</span>
                              </div>
                            </td>
                            <td>{category.description || '—'}</td>
                            <td>{category.productCount || 0}</td>
                            <td>{category.sortOrder ?? 0}</td>
                            <td>
                              <div className={styles.rowActions}>
                                <button
                                  className={styles.textButton}
                                  type="button"
                                  onClick={() => openCategoryEdit(category)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  type="button"
                                  disabled={
                                    category.productCount > 0 ||
                                    busy === `category-${category._id}`
                                  }
                                  title={
                                    category.productCount > 0
                                      ? 'Move products out of this category first.'
                                      : undefined
                                  }
                                  onClick={() => deleteCategory(category)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {tab === 'orders' ? (
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
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>{order.orderNumber || order._id.slice(-8)}</td>
                          <td className={styles.mono}>{order.userId || '—'}</td>
                          <td>{order.items?.length || 0}</td>
                          <td>{money((order.totalCents || 0) / 100)}</td>
                          <td>
                            <select
                              className={styles.statusSelect}
                              value={order.status || 'pending'}
                              disabled={busy === `order-${order._id}`}
                              onChange={(event) =>
                                updateOrderStatus(order, event.target.value)
                              }
                              aria-label={`Status for order ${order.orderNumber || order._id}`}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option value={status} key={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{formatDate(order.placedAt)}</td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                className={styles.deleteButton}
                                type="button"
                                disabled={busy === `order-${order._id}`}
                                onClick={() => deleteOrder(order)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 ? <p className={styles.empty}>No orders yet.</p> : null}
                </div>
              ) : null}

              {tab === 'customers' ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Cart</th>
                        <th>Wishlist</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => {
                        const isSelf = customer.id === profile.id;
                        return (
                          <tr key={customer.id || customer._id}>
                            <td>
                              {customer.name}
                              {isSelf ? <span className={styles.you}>You</span> : null}
                            </td>
                            <td>{customer.email}</td>
                            <td>
                              <select
                                className={styles.statusSelect}
                                value={customer.role}
                                disabled={isSelf || busy === `user-${customer.id}`}
                                onChange={(event) =>
                                  updateCustomerRole(customer, event.target.value)
                                }
                                aria-label={`Role for ${customer.name}`}
                              >
                                <option value="customer">customer</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                            <td>{customer.cartCount}</td>
                            <td>{customer.wishlistCount}</td>
                            <td>
                              <div className={styles.rowActions}>
                                <button
                                  className={styles.textButton}
                                  type="button"
                                  onClick={() => openPasswordEditor(customer)}
                                >
                                  Password
                                </button>
                                <button
                                  className={styles.deleteButton}
                                  type="button"
                                  disabled={isSelf || busy === `user-${customer.id}`}
                                  onClick={() => deleteCustomer(customer)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      {editor ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-editor-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>
                  {editor.mode === 'create' ? 'New product' : 'Edit product'}
                </p>
                <h2 id="product-editor-title">
                  {editor.mode === 'create' ? 'Add to catalogue' : form.name}
                </h2>
              </div>
              <button className={styles.close} type="button" onClick={closeEditor}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option value={category.name} key={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Price (USD)</span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Stock</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>SKU</span>
                  <input
                    value={form.sku}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, sku: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Barcode</span>
                  <input
                    value={form.barcode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, barcode: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Low-stock threshold</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.lowStockThreshold}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lowStockThreshold: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Image path or URL</span>
                <input
                  value={form.image}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, image: event.target.value }))
                  }
                  placeholder="/images/Flow84.webp"
                />
              </label>

              <label className={styles.field}>
                <span>Or upload an image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadImage}
                  disabled={uploading}
                />
              </label>

              <div className={styles.imagePreview}>
                <img src={previewImage} alt="Product preview" />
                <span>{uploading ? 'Uploading image...' : 'Image preview'}</span>
              </div>

              <label className={styles.field}>
                <span>Restock note</span>
                <input
                  value={form.restockNote}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      restockNote: event.target.value,
                    }))
                  }
                  placeholder="Optional internal note"
                />
              </label>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  required
                  rows="4"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Details (one per line)</span>
                <textarea
                  rows="4"
                  value={form.detailsText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      detailsText: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Specifications (Key: Value per line)</span>
                <textarea
                  rows="4"
                  value={form.specsText}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      specsText: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                />
                <span>Featured product</span>
              </label>

              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className={styles.primaryButton} type="submit" disabled={saving}>
                  {saving
                    ? 'Saving…'
                    : editor.mode === 'create'
                      ? 'Create product'
                      : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {categoryEditor ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCategoryEditor();
          }}
        >
          <div
            className={`${styles.modal} ${styles.categoryModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-editor-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>
                  {categoryEditor.mode === 'create' ? 'New category' : 'Edit category'}
                </p>
                <h2 id="category-editor-title">
                  {categoryEditor.mode === 'create'
                    ? 'Add category'
                    : categoryForm.name}
                </h2>
              </div>
              <button className={styles.close} type="button" onClick={closeCategoryEditor}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={saveCategory}>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows="3"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Image path or URL</span>
                <input
                  value={categoryForm.image}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      image: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Sort order</span>
                <input
                  type="number"
                  step="1"
                  value={categoryForm.sortOrder}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={closeCategoryEditor}
                  disabled={categorySaving}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  type="submit"
                  disabled={categorySaving}
                >
                  {categorySaving
                    ? 'Saving...'
                    : categoryEditor.mode === 'create'
                      ? 'Create category'
                      : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {passwordEditor ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePasswordEditor();
          }}
        >
          <div
            className={`${styles.modal} ${styles.passwordModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-editor-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>Account security</p>
                <h2 id="password-editor-title">Change password</h2>
              </div>
              <button className={styles.close} type="button" onClick={closePasswordEditor}>
                Close
              </button>
            </div>

            <p className={styles.passwordIntro}>
              Set a new password for <strong>{passwordEditor.name}</strong> (
              {passwordEditor.email}).
            </p>

            <form className={styles.form} onSubmit={handlePasswordSave}>
              <label className={styles.field}>
                <span>New password</span>
                <input
                  type="password"
                  required
                  minLength="8"
                  autoComplete="new-password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="At least 8 characters"
                />
              </label>

              <label className={styles.field}>
                <span>Confirm password</span>
                <input
                  type="password"
                  required
                  minLength="8"
                  autoComplete="new-password"
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirm: event.target.value,
                    }))
                  }
                  placeholder="Repeat the new password"
                />
              </label>

              {passwordError ? (
                <p className={styles.passwordError} role="alert">
                  {passwordError}
                </p>
              ) : null}

              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={closePasswordEditor}
                  disabled={passwordSaving}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  type="submit"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Updating...' : 'Set password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default AdminPage;
