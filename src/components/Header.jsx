import { useState } from 'react'
import './Header.css'

const NAV = [
  { label: 'Home', href: '#top', current: true },
  { label: 'Shop', href: '#shop' },
  { label: 'Wishlist', href: '#wishlist' },
]

function Header() {
  const [query, setQuery] = useState('')
  const [cartCount] = useState(0)

  function handleSubmit(event) {
    event.preventDefault()
    if (!query.trim()) return
    // Search is a placeholder for now.
    console.log('search:', query.trim())
  }

  return (
    <header className="header">
      <div className="header__inner">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true">
            C
          </span>
          <span className="brand__name">ClackLabs</span>
        </a>

        <nav className="nav" aria-label="Primary">
          <ul className="nav__list">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  className="nav__link"
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <form className="search" role="search" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="site-search">
            Search products
          </label>
          <svg
            className="search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="search__input"
            id="site-search"
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="search__button" type="submit">
            Search
          </button>
        </form>

        <div className="actions">
          <button className="action" type="button" aria-label="Updates">
            <span className="action__icon-wrap">
              <svg
                className="action__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
                <path d="M10.5 20a2 2 0 0 0 3 0" />
              </svg>
              <span className="action__dot" aria-hidden="true" />
            </span>
          </button>

          <button
            className="action action--cart"
            type="button"
            aria-label={`Cart, ${cartCount} items`}
          >
            <span className="action__icon-wrap">
              <svg
                className="action__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 5h2l2.2 10.2A2 2 0 0 0 10.2 17h7.6a2 2 0 0 0 2-1.6L21 8H7" />
                <circle cx="10.5" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
              </svg>
              <span className="action__badge" aria-hidden="true">
                {cartCount}
              </span>
            </span>
          </button>

          <span className="actions__divider" aria-hidden="true" />

          <button className="action action--profile" type="button">
            <span className="action__avatar" aria-hidden="true">
              C
            </span>
            <span className="action__label">Profile</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
