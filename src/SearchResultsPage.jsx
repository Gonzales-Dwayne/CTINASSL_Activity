import ProductCard from './components/ProductCard'
import { searchProducts } from './data/products'
import { useProducts } from './productsStore'
import styles from './CataloguePage.module.css'

function SearchResultsPage({ query, onNavigate }) {
  const { products, loading } = useProducts()
  const results = searchProducts(products, query)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.head}>
          <h1 className={styles.title}>Results for “{query.trim()}”</h1>
          <p className={styles.count}>
            {loading
              ? 'Loading products…'
              : `${results.length} ${results.length === 1 ? 'product' : 'products'}`}
          </p>
        </header>

        {results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((product) => (
              <ProductCard
                product={product}
                key={product.id}
                onSelect={() => onNavigate('product', null, '', product.id)}
              />
            ))}
          </div>
        ) : (
          <p className={styles.count}>
            Nothing matched that search. Try “keyboard”, “switch” or “keycaps”.
          </p>
        )}
      </main>
    </div>
  )
}

export default SearchResultsPage
