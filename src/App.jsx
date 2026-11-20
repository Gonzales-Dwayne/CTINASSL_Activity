import { useEffect, useState } from 'react'
import AdminPage from './AdminPage'
import CataloguePage from './CataloguePage'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import ProductPage from './ProductPage'
import SearchResultsPage from './SearchResultsPage'
import SiteHeader from './components/SiteHeader'
import { apiRequest } from './api'
import { logout, readSession } from './auth'

function App() {
  const [view, setView] = useState('home')
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [query, setQuery] = useState('')
  const [productId, setProductId] = useState(null)
  const [cart, setCart] = useState([])
  const [cartReady, setCartReady] = useState(false)
  const [user, setUser] = useState(() => readSession())

  // Pull the saved cart when someone signs in, merging anything already local.
  useEffect(() => {
    if (!user) return undefined

    let cancelled = false

    apiRequest('/cart', { auth: true })
      .then(({ items }) => {
        if (cancelled) return
        setCart((current) => {
          const merged = new Map(
            items.map((item) => [item.product.id, item.qty]),
          )
          for (const line of current) {
            merged.set(
              line.productId,
              (merged.get(line.productId) ?? 0) + line.qty,
            )
          }
          return [...merged.entries()].map(([productId, qty]) => ({
            productId,
            qty,
          }))
        })
        setCartReady(true)
      })
      .catch(() => {
        if (!cancelled) setCartReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // Write the cart back to the database shortly after every change.
  useEffect(() => {
    if (!user || !cartReady) return undefined

    const timer = setTimeout(() => {
      apiRequest('/cart', {
        method: 'PUT',
        auth: true,
        body: { items: cart },
      }).catch(() => {})
    }, 400)

    return () => clearTimeout(timer)
  }, [cart, user, cartReady])

  function navigate(
    nextView,
    nextCategory = null,
    nextQuery = '',
    nextProductId = null,
  ) {
    setView(nextView)
    setCategory(nextCategory)
    setSubcategory(null)
    setQuery(nextQuery)
    setProductId(nextProductId)
    window.scrollTo({ top: 0 })
  }

  function handleLogin(nextUser) {
    setUser(nextUser)
    navigate(nextUser.role === 'admin' ? 'admin' : 'home')
  }

  function handleLogout() {
    logout()
    setUser(null)
    setCartReady(false)
    navigate('home')
  }

  async function handleCheckout() {
    const { order } = await apiRequest('/orders', {
      method: 'POST',
      auth: true,
      body: {},
    })

    setCart([])
    return order
  }

  function addToCart(product, qty) {
    setCart((lines) => {
      const existing = lines.find((line) => line.productId === product.id)
      if (existing) {
        return lines.map((line) =>
          line.productId === product.id
            ? { ...line, qty: line.qty + qty }
            : line,
        )
      }
      return [...lines, { productId: product.id, qty }]
    })
  }

  function changeQty(id, delta) {
    setCart((lines) =>
      lines.map((line) =>
        line.productId === id
          ? { ...line, qty: Math.max(1, line.qty + delta) }
          : line,
      ),
    )
  }

  function removeLine(id) {
    setCart((lines) => lines.filter((line) => line.productId !== id))
  }

  function selectCategory(nextCategory) {
    setCategory(nextCategory)
    setSubcategory(null)
  }

  const isAdmin = user?.role === 'admin'

  if (view === 'login') {
    return <LoginPage onNavigate={navigate} onLogin={handleLogin} />
  }

  if (view === 'admin') {
    if (!isAdmin) {
      return <LoginPage onNavigate={navigate} onLogin={handleLogin} />
    }

    return (
      <AdminPage user={user} onNavigate={navigate} onLogout={handleLogout} />
    )
  }

  return (
    <>
      <SiteHeader
        solid={view !== 'home'}
        onNavigate={navigate}
        cart={cart}
        onQty={changeQty}
        onRemove={removeLine}
        onCheckout={handleCheckout}
        user={user}
        onLogin={() => navigate('login')}
        onLogout={handleLogout}
        onDashboard={() => navigate('admin')}
      />

      {view === 'search' ? (
        <SearchResultsPage query={query} onNavigate={navigate} />
      ) : null}

      {view === 'catalogue' ? (
        <CataloguePage
          category={category}
          subcategory={subcategory}
          onCategory={selectCategory}
          onSubcategory={setSubcategory}
          onNavigate={navigate}
        />
      ) : null}

      {view === 'product' ? (
        <ProductPage
          key={productId}
          productId={productId}
          onNavigate={navigate}
          onAdd={addToCart}
        />
      ) : null}

      {view === 'home' ? <LandingPage onNavigate={navigate} /> : null}
    </>
  )
}

export default App
