import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartProvider'
import { ProductsProvider } from './context/ProductsProvider'
import { ProfileProvider } from './context/ProfileProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProductsProvider>
      <ProfileProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ProfileProvider>
    </ProductsProvider>
  </StrictMode>,
)
