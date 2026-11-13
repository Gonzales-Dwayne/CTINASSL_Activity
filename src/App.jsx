import Header from './components/Header'
import Carousel from './components/Carousel'
import CategoryCard from './components/CategoryCard'
import './App.css'

const CATEGORIES = [
  {
    id: 'mechanical',
    name: 'Mechanical Keyboard',
    blurb: 'Hot-swappable boards with crisp, consistent keyfeel.',
    color: '#1d4ed8',
  },
  {
    id: 'magnetic',
    name: 'Magnetic Keyboard',
    blurb: 'Hall-effect switches with adjustable actuation.',
    color: '#2563eb',
  },
  {
    id: 'switches',
    name: 'Switch',
    blurb: 'Linear, tactile and clicky sets, pre-lubed.',
    color: '#3b82f6',
  },
  {
    id: 'keycaps',
    name: 'Keycaps',
    blurb: 'PBT sets in every profile and layout.',
    color: '#60a5fa',
  },
]

function App() {
  return (
    <div className="site" id="top">
      <Header />

      <main className="site__main">
        <Carousel />

        <section
          className="categories"
          id="shop"
          aria-labelledby="categories-title"
        >
          <div className="categories__head">
            <h2 className="categories__title" id="categories-title">
              Shop by category
            </h2>
            <p className="categories__note">
              Four ways to upgrade your desk setup.
            </p>
          </div>

          <div className="categories__grid">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
