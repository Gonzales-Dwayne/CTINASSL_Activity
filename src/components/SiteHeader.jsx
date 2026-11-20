import { useEffect, useState } from 'react'
import { ArrowRightIcon, CartIcon, SearchIcon, UserIcon } from './Icons'
import AccountDrawer from './AccountDrawer'
import CartDrawer from './CartDrawer'
import SearchDrawer from './SearchDrawer'
import { useProducts } from '../productsStore'
import styles from './SiteHeader.module.css'

function SiteHeader({
  onNavigate,
  solid = false,
  cart = [],
  onQty,
  onRemove,
  onCheckout,
  user = null,
  onLogin,
  onLogout,
  onDashboard,
}) {
  const cartCount = cart.reduce((count, line) => count + line.qty, 0)
  const { products, categories } = useProducts()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCategory, setMenuCategory] = useState(null)
  const [panel, setPanel] = useState(null)

  const navLinks = [
    { label: 'All Products', category: null },
    ...categories.slice(0, 3).map((entry) => ({
      label: entry.name,
      category: entry.name,
    })),
  ]

  const activeCategory = menuCategory ?? categories[0]?.name ?? ''
  const menuProducts = products
    .filter((product) => product.category === activeCategory)
    .slice(0, 6)

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
          {navLinks.map((link) => (
            <a
              key={link.label}
              className={styles.navLink}
              href="#top"
              onMouseEnter={() => {
                setMenuCategory(link.category ?? categories[0]?.name ?? null)
                setMenuOpen(true)
              }}
              onFocus={() => {
                setMenuCategory(link.category ?? categories[0]?.name ?? null)
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
          <button
            className={styles.iconButton}
            type="button"
            aria-label={user ? `Account, ${user.name}` : 'Account'}
            onClick={() => setPanel('account')}
          >
            <UserIcon />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className={styles.megaMenu}>
          <div className={styles.megaLeft}>
            {categories.map((entry) => {
              const category = entry.name
              return (
              <a
                key={category}
                className={
                  category === activeCategory
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
              )
            })}
          </div>

          <div className={styles.megaDivider} aria-hidden="true" />

          <div className={styles.megaRight}>
            <div className={styles.megaHead}>
              <div>
                <p className={styles.megaEyebrow}>Featured picks</p>
                <p className={styles.megaTitle}>{activeCategory}</p>
              </div>
              <a
                className={styles.megaViewAll}
                href="#top"
                onClick={(e) => go(e, 'catalogue', activeCategory)}
              >
                View all
                <ArrowRightIcon className={styles.megaViewAllIcon} />
              </a>
            </div>

            <div className={styles.megaTiles}>
              {menuProducts.map((product) => (
                <button
                  key={product.id}
                  className={styles.megaTile}
                  type="button"
                  style={{ backgroundColor: product.image }}
                  onClick={() => {
                    setMenuOpen(false)
                    onNavigate?.('product', null, '', product.id)
                  }}
                >
                  <span className={styles.megaTileName}>{product.name}</span>
                </button>
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

      {panel === 'account' ? (
        <AccountDrawer
          user={user}
          onClose={() => setPanel(null)}
          onLogin={() => {
            setPanel(null)
            onLogin?.()
          }}
          onLogout={() => {
            setPanel(null)
            onLogout?.()
          }}
          onDashboard={() => {
            setPanel(null)
            onDashboard?.()
          }}
        />
      ) : null}

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
          user={user}
          onClose={() => setPanel(null)}
          onQty={onQty}
          onRemove={onRemove}
          onCheckout={onCheckout}
          onSignIn={() => {
            setPanel(null)
            onNavigate?.('login')
          }}
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
