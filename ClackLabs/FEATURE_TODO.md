# ClackLabs — Remaining Feature Implementation

_Last updated: 2026-11-21_

## Current foundation

- React + Vite storefront with a fixed, scroll-aware header.
- Hero carousel using four local Lofree product images and tinted backgrounds.
- Featured Products carousel with six hard-coded products and placeholder artwork.
- Shop Collections section with four placeholder collection cards.
- Express server with only a sample `/api/message` endpoint.
- No product database, routing, cart, checkout, search, or account flows yet.

---

## P0 — Core storefront features

### 1. Product data and API

- [ ] Define the product model: id, slug, name, category, description, price, variants, inventory, images.
- [ ] Add seed data for the real catalogue instead of hard-coded component arrays.
- [ ] Implement API endpoints:
  - [ ] `GET /api/products`
  - [ ] `GET /api/products/:slug`
  - [ ] `GET /api/categories`
  - [ ] `GET /api/search?q=`
- [ ] Connect the client to the API with loading, empty, and error states.
- [ ] Replace placeholder product artwork with real product images.

### 2. Application routing and catalogue

- [ ] Add client-side routing (React Router or equivalent).
- [ ] Build category/collection listing pages:
  - [ ] Mechanical Keyboards
  - [ ] Magnetic Keyboards
  - [ ] Keycaps
  - [ ] Switches
  - [ ] All Products
- [ ] Add sorting and filtering (price, category, availability).
- [ ] Make header navigation, collection cards, and other category links navigate to the correct pages.
- [ ] Align the header navigation taxonomy with the actual catalogue (currently “Keyboards” vs. “Mechanical Keyboards” / “Magnetic Keyboards”).

### 3. Product detail page

- [ ] Product image gallery.
- [ ] Colour/variant selector.
- [ ] Price, description, and specifications.
- [ ] Stock/availability state.
- [ ] Quantity selector.
- [ ] Add to Cart action.
- [ ] Related products.
- [ ] Wire all “Shop Now” actions in Featured Products to the relevant product page.

### 4. Cart

- [ ] Global cart state with add/remove/update quantity.
- [ ] Cart drawer or cart page.
- [ ] Line-item totals, subtotal, shipping estimate.
- [ ] Persist the cart across refresh.
- [ ] Header cart icon opens the cart and displays an item-count badge.
- [ ] Empty-cart state and “continue shopping” action.

### 5. Header and navigation functionality

- [ ] Make search, account, and cart controls interactive.
- [ ] Add a mobile navigation menu; navigation is currently hidden below 820px with no replacement.
- [ ] Highlight the active navigation item.
- [ ] Ensure keyboard focus, Escape-to-close, and scroll-lock behavior for overlays.
- [ ] Add a skip link and correct landmark structure.

---

## P1 — Commerce and accounts

### 6. Checkout and orders

- [ ] Checkout form: contact, shipping address, shipping method.
- [ ] Order summary with taxes/shipping totals.
- [ ] Payment-provider integration (Stripe or chosen provider).
- [ ] Server-side order creation and validation.
- [ ] Order confirmation page.
- [ ] Order status/history model.
- [ ] Protect against invalid prices/quantities being submitted from the client.

### 7. Authentication and account

- [ ] Register/login/logout.
- [ ] Session or JWT handling.
- [ ] Password hashing and validation.
- [ ] Account page with profile and order history.
- [ ] Saved addresses (optional).
- [ ] Auth-aware header account menu.

### 8. Search

- [ ] Search overlay or dedicated results page.
- [ ] Search by name, category, and description.
- [ ] Debounced results, empty state, and result counts.
- [ ] Link results to product pages.
- [ ] Keep search query in the URL.

---

## P2 — Main content, quality, and launch readiness

### 9. Real content and commerce rules

- [ ] Final product names, descriptions, prices, variants, and inventory.
- [ ] Real Shop Collections imagery.
- [ ] Shipping, returns, warranty, and contact/policy pages.
- [ ] Footer/navigation links for policies and support.
- [ ] Price and currency formatting rules.
- [ ] Tax and shipping rules.

### 10. Responsive and interaction quality

- [ ] Verify all three carousels on mobile, tablet, and desktop.
- [ ] Add touch/swipe support and keyboard navigation to the hero carousel.
- [ ] Add autoplay/pause behavior and slide indicators if desired.
- [ ] Define disabled/end-state behavior for all carousel controls.
- [ ] Check focus states, contrast, and reduced-motion behavior.
- [ ] Audit header hide/show behavior across pages and browser scroll restoration.

### 11. Backend and operational readiness

- [ ] Replace the sample server with the real API structure.
- [ ] Add a database and schema/migrations.
- [ ] Add environment configuration for database, API URL, and payment keys.
- [ ] Add server scripts (`dev`, `start`) and a documented local setup.
- [ ] Add request validation, error handling, rate limiting, and authentication middleware.
- [ ] Add health-check endpoint and production CORS configuration.
- [ ] Add deployment configuration for the client and API.

### 12. Testing and performance

- [ ] Add unit tests for cart totals, pricing, and API validation.
- [ ] Add component tests for carousels, navigation, and forms.
- [ ] Add end-to-end tests for browsing → product → cart → checkout.
- [ ] Add accessibility checks.
- [ ] Audit image sizes and lazy-load below-the-fold imagery.
- [ ] Add a 404 page and API/client error boundaries.
- [ ] Add SEO metadata, Open Graph tags, sitemap, and robots.txt.

---

## Suggested implementation order

1. Product data model + API + catalogue pages.
2. Product detail page and real featured/collection links.
3. Cart state and drawer.
4. Search + account.
5. Checkout, orders, and payment.
6. Mobile navigation, tests, and launch polish.
