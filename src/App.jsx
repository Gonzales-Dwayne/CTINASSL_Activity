import { useState } from 'react'
import CataloguePage from './CataloguePage'
import LandingPage from './LandingPage'
import ProductPage from './ProductPage'
import SearchResultsPage from './SearchResultsPage'
import SiteHeader from './components/SiteHeader'

function App() {
  const [view, setView] = useState('home')
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [query, setQuery] = useState('')
  const [productId, setProductId] = useState(null)
  const [cart, setCart] = useState([])

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

  return (
    <>
      <SiteHeader
        solid={view !== 'home'}
        onNavigate={navigate}
        cart={cart}
        onQty={changeQty}
        onRemove={removeLine}
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
