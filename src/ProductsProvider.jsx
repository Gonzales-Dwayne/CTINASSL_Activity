import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from './api'
import { ProductsContext } from './productsStore'

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { products: docs } = await apiRequest('/products')
        if (cancelled) return
        setProducts(docs)
        setError(null)
      } catch (loadError) {
        if (!cancelled) setError(loadError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadKey((current) => current + 1)
  }, [])

  const createProduct = useCallback(async (product) => {
    const { product: created } = await apiRequest('/products', {
      method: 'POST',
      body: product,
      auth: true,
    })
    setProducts((current) => [created, ...current])
    return created
  }, [])

  const updateProduct = useCallback(async (id, changes) => {
    const { product: updated } = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: changes,
      auth: true,
    })
    setProducts((current) =>
      current.map((product) => (product.id === id ? updated : product)),
    )
    return updated
  }, [])

  const deleteProduct = useCallback(async (id) => {
    await apiRequest(`/products/${id}`, { method: 'DELETE', auth: true })
    setProducts((current) => current.filter((product) => product.id !== id))
  }, [])

  const categories = useMemo(() => {
    const byCategory = new Map()

    for (const product of products) {
      if (!byCategory.has(product.category)) {
        byCategory.set(product.category, new Set())
      }
      if (product.subcategory) {
        byCategory.get(product.category).add(product.subcategory)
      }
    }

    return [...byCategory.entries()].map(([name, subcategories]) => ({
      name,
      subcategories: [...subcategories].sort((a, b) => a.localeCompare(b)),
    }))
  }, [products])

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      refresh,
      createProduct,
      updateProduct,
      deleteProduct,
    }),
    [
      products,
      categories,
      loading,
      error,
      refresh,
      createProduct,
      updateProduct,
      deleteProduct,
    ],
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}
