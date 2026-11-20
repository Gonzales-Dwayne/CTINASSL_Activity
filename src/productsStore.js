import { createContext, useContext } from 'react'

// Shared products store: the provider lives in ProductsProvider.jsx.
export const ProductsContext = createContext(null)

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used inside a ProductsProvider')
  }
  return context
}
