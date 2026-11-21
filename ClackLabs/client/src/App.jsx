import { useEffect, useState } from 'react'
import CartDrawer from './components/CartDrawer'
import FeaturedProducts from './components/FeaturedProducts'
import HeroCarousel from './components/HeroCarousel'
import SearchDrawer from './components/SearchDrawer'
import ShopCollections from './components/ShopCollections'
import SiteHeader from './components/SiteHeader'
import { useCart } from './context/CartContext'
import { useProducts } from './context/ProductsContext'
import AllProducts from './pages/AllProducts'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import ProductPage from './pages/ProductPage'
import SearchPage from './pages/SearchPage'

const CATEGORY_SLUGS = {
  Keyboards: 'keyboards',
  Keycaps: 'keycaps',
  Switches: 'switches',
}

const SLUG_CATEGORIES = {
  keyboards: 'Keyboards',
  keycaps: 'Keycaps',
  switches: 'Switches',
}

function readRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [pathPart, queryPart = ''] = raw.split('?')
  const [section, param] = pathPart.split('/')
  const params = new URLSearchParams(queryPart)

  if (section === 'search') {
    return {
      page: 'search',
      query: params.get('q') || '',
      category: params.get('category') || '',
      availability: params.get('availability') || '',
      sort: params.get('sort') || 'relevance',
      pageNumber: Number(params.get('page')) || 1,
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
    }
  }

  if (section === 'products') {
    return {
      page: 'products',
      category: SLUG_CATEGORIES[param] || 'All Products',
    }
  }

  if (section === 'product' && param) {
    return { page: 'product', id: decodeURIComponent(param) }
  }

  if (section === 'login') {
    return { page: 'login' }
  }

  if (section === 'account') {
    return { page: 'account' }
  }

  if (section === 'checkout') {
    return { page: 'checkout' }
  }

  if (section === 'order' && param) {
    return { page: 'order', id: decodeURIComponent(param) }
  }

  if (section === 'admin') {
    return { page: 'admin' }
  }

  return { page: 'home' }
}

function App() {
  const [route, setRoute] = useState(readRoute)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { products, isLoading } = useProducts()
  const { count } = useCart()

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(readRoute())
      setSearchOpen(false)
      setCartOpen(false)
      window.scrollTo(0, 0)
    }

    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (hash) => {
    if (window.location.hash === hash) {
      window.scrollTo(0, 0)
      return
    }
    window.location.hash = hash
  }

  const goToCategory = (category) => {
    const slug = CATEGORY_SLUGS[category]
    navigate(slug ? `#/products/${slug}` : '#/products')
  }

  const openProduct = (id) => navigate(`#/product/${id}`)
  const adminRoute = route.page === 'admin'
  const checkoutRoute = route.page === 'checkout'
  const hideStoreHeader = adminRoute || checkoutRoute

  let content

  if (isLoading) {
    content = (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '96px 24px',
          color: '#6f665d',
          fontFamily: 'var(--font-site)',
        }}
      >
        Loading catalogue...
      </main>
    )
  } else if (route.page === 'products') {
    content = (
      <AllProducts
        category={route.category}
        onCategoryChange={goToCategory}
      />
    )
  } else if (route.page === 'product') {
    const product = products.find((item) => item.id === route.id)
    content = (
      <ProductPage
        key={product?.id || 'missing'}
        product={product}
        onNavigate={navigate}
        onProductSelect={openProduct}
        onOpenCart={() => setCartOpen(true)}
      />
    )
  } else if (route.page === 'login') {
    content = <LoginPage onNavigate={navigate} />
  } else if (route.page === 'search') {
    content = (
      <SearchPage key={route.query} route={route} onNavigate={navigate} />
    )
  } else if (route.page === 'account') {
    content = <AccountPage onNavigate={navigate} />
  } else if (route.page === 'checkout') {
    content = <CheckoutPage onNavigate={navigate} />
  } else if (route.page === 'order') {
    content = (
      <OrderConfirmationPage orderId={route.id} onNavigate={navigate} />
    )
  } else if (route.page === 'admin') {
    content = <AdminPage onNavigate={navigate} />
  } else {
    content = (
      <>
        <HeroCarousel />
        <FeaturedProducts />
        <ShopCollections onNavigate={goToCategory} />
      </>
    )
  }

  return (
    <>
      {!hideStoreHeader ? (
        <SiteHeader
          onNavigate={navigate}
          onOpenSearch={() => {
            setSearchOpen(true)
            setCartOpen(false)
          }}
          onOpenCart={() => {
            setCartOpen(true)
            setSearchOpen(false)
          }}
          cartCount={count}
        />
      ) : null}
      {content}
      {!hideStoreHeader ? (
        <>
          <SearchDrawer
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onNavigate={navigate}
          />
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onNavigate={navigate}
          />
        </>
      ) : null}
    </>
  )
}

export default App
