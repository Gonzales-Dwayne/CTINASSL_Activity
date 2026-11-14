import { useEffect, useState } from 'react'
import { ArrowRightIcon, CartIcon, SearchIcon, UserIcon } from './Icons'
import CartDrawer from './CartDrawer'
import SearchDrawer from './SearchDrawer'
import { CATEGORIES } from '../data/products'
import styles from './SiteHeader.module.css'

const NAV_LINKS = [
  { label: 'All Products', category: null },
  { label: 'Keyboards', category: 'Mechanical Keyboards' },
  { label: 'Keycaps', category: 'Keycaps' },
  { label: 'Switches', category: 'Switches' },
]

function SiteHeader({
  onNavigate,
  solid = false,
  cart = [],
  onQty,
  onRemove,
}) {
  const cartCount = cart.reduce((count, line) => count + line.qty, 0)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCategory, setMenuCategory] = useState(CATEGORIES[0])
  const [panel, setPanel] = useState(null)

  useEffect(() => {
    let lastY = window.scrollY

    function onScroll() {
      const y = window.scrollY

      // Past the header's own height: solid white bar, black text.
      setScrolled(y > 100)

      // Never hide at the very top; hide on the way down, reveal on the way up.
      if (y <= 100) {
        setHidden(false)
      } else if (y > lastY) {
        setHidden(true)
      } else if (y < lastY) {
        setHidden(false)
      }

      lastY = y

      // A hover menu should not survive a scroll.
      setMenuOpen(false)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setPanel(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(event, view, category = null, query = '') {
    event.preventDefault()
    setMenuOpen(false)
    setPanel(null)
    onNavigate?.(view, category, query)
  }

  const className = [
    styles.header,
    solid || scrolled || menuOpen ? styles.headerScrolled : '',
    hidden ? styles.headerHidden : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <header className={className} onMouseLeave={() => setMenuOpen(false)}>
      <div className={styles.headerBar}>
        <a className={styles.logo} href="#top" onClick={(e) => go(e, 'home')}>
          <span className={styles.logoMarks}>
            <span className={styles.logoMark}>C</span>
            <span className={styles.logoMark}>L</span>
          </span>
          <span className={styles.logoWordmark}>ClackLabs</span>
        </a>

        <nav className={styles.navigationText} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              className={styles.navLink}
              href="#top"
              onMouseEnter={() => {
                setMenuCategory(link.category ?? CATEGORIES[0])
                setMenuOpen(true)
              }}
              onFocus={() => {
                setMenuCategory(link.category ?? CATEGORIES[0])
                setMenuOpen(true)
              }}
              onClick={(e) => go(e, 'catalogue', link.category)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.icons}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Search"
            onClick={() => setPanel('search')}
          >
            <SearchIcon />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={`Cart, ${cartCount} items`}
            onClick={() => setPanel('cart')}
          >
            <CartIcon />
            {cartCount > 0 ? (
              <span className={styles.cartBadge}>{cartCount}</span>
            ) : null}
          </button>
          <button className={styles.iconButton} type="button" aria-label="Account">
            <UserIcon />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className={styles.megaMenu}>
          <div className={styles.megaLeft}>
            {CATEGORIES.map((category) => (
              <a
                key={category}
                className={
                  category === menuCategory
                    ? `${styles.megaCategory} ${styles.megaCategoryActive}`
                    : styles.megaCategory
                }
                href="#top"
                onMouseEnter={() => setMenuCategory(category)}
                onFocus={() => setMenuCategory(category)}
                onClick={(e) => go(e, 'catalogue', category)}
              >
                {category}
              </a>
            ))}
          </div>

          <div className={styles.megaDivider} aria-hidden="true" />

          <div className={styles.megaRight}>
            <div className={styles.megaHead}>
              <div>
                <p className={styles.megaEyebrow}>Featured picks</p>
                <p className={styles.megaTitle}>{menuCategory}</p>
              </div>
              <a
                className={styles.megaViewAll}
                href="#top"
                onClick={(e) => go(e, 'catalogue', menuCategory)}
              >
                View all
                <ArrowRightIcon className={styles.megaViewAllIcon} />
              </a>
            </div>

            {/* No products wired up yet — slots stay empty */}
            <div className={styles.megaTiles} aria-hidden="true">
              {Array.from({ length: 6 }, (_, slot) => (
                <div className={styles.megaTile} key={slot} />
              ))}
            </div>

            <div className={styles.megaArrows}>
              <button
                className={styles.megaArrow}
                type="button"
                aria-label="Previous products"
                disabled
              >
                <ArrowRightIcon className={styles.arrowLeft} />
              </button>
              <button
                className={styles.megaArrow}
                type="button"
                aria-label="Next products"
                disabled
              >
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </header>

      {panel === 'search' ? (
        <SearchDrawer
          onClose={() => setPanel(null)}
          onViewAll={(query) => {
            setPanel(null)
            onNavigate?.('search', null, query)
          }}
          onSelectProduct={(product) => {
            setPanel(null)
            onNavigate?.('product', null, '', product.id)
          }}
        />
      ) : null}

      {panel === 'cart' ? (
        <CartDrawer
          items={cart}
          onClose={() => setPanel(null)}
          onQty={onQty}
          onRemove={onRemove}
          onBrowse={() => {
            setPanel(null)
            onNavigate?.('catalogue', null)
          }}
        />
      ) : null}
    </>
  )
}

export default SiteHeader
