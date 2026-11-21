import { useState } from 'react'
import FeaturedProducts from './components/FeaturedProducts'
import HeroCarousel from './components/HeroCarousel'
import ShopCollections from './components/ShopCollections'
import SiteHeader from './components/SiteHeader'
import AllProducts from './pages/AllProducts'

function App() {
  const [view, setView] = useState('home')

  const navigate = (nextView) => {
    setView(nextView)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <SiteHeader onNavigate={navigate} />
      {view === 'products' ? (
        <AllProducts />
      ) : (
        <>
          <HeroCarousel />
          <FeaturedProducts />
          <ShopCollections />
        </>
      )}
    </>
  )
}

export default App
