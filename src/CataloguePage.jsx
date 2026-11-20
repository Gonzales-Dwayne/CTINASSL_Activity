import ProductCard from './components/ProductCard'
import { productsInCategory } from './data/products'
import { useProducts } from './productsStore'
import styles from './CataloguePage.module.css'

function CataloguePage({
  category,
  subcategory,
  onCategory,
  onSubcategory,
  onNavigate,
}) {
  const { products: allProducts, categories, loading } = useProducts()
  const subcategories =
    categories.find((entry) => entry.name === category)?.subcategories ?? []
  const products = productsInCategory(allProducts, category, subcategory)
  const title = category ?? 'All Products'

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <nav className={styles.tabs} aria-label="Categories">
          <button
            className={!category ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            type="button"
            onClick={() => onCategory(null)}
            aria-pressed={!category}
          >
            All
            <span className={styles.tabCount}>{allProducts.length}</span>
          </button>

          {categories.map((entry) => {
            const name = entry.name
            const isActive = category === name
            return (
              <button
                key={name}
                className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                type="button"
                onClick={() => onCategory(name)}
                aria-pressed={isActive}
              >
                {name}
                <span className={styles.tabCount}>
                  {productsInCategory(allProducts, name).length}
                </span>
              </button>
            )
          })}
        </nav>

        {subcategories.length > 0 ? (
          <div className={styles.subtabs} role="group" aria-label="Subcategories">
            <button
              className={
                subcategory === null
                  ? `${styles.subtab} ${styles.subtabActive}`
                  : styles.subtab
              }
              type="button"
              onClick={() => onSubcategory(null)}
              aria-pressed={subcategory === null}
            >
              All {category}
            </button>

            {subcategories.map((name) => {
              const isActive = subcategory === name
              return (
                <button
                  key={name}
                  className={
                    isActive
                      ? `${styles.subtab} ${styles.subtabActive}`
                      : styles.subtab
                  }
                  type="button"
                  onClick={() => onSubcategory(name)}
                  aria-pressed={isActive}
                >
                  {name}
                  <span className={styles.tabCount}>
                    {productsInCategory(allProducts, category, name).length}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        <header className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.count}>
            {loading
              ? 'Loading products…'
              : `${subcategory ? `${subcategory} · ` : ''}${products.length} ${
                  products.length === 1 ? 'product' : 'products'
                }`}
          </p>
        </header>

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              product={product}
              key={product.id}
              onSelect={() => onNavigate('product', null, '', product.id)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default CataloguePage
