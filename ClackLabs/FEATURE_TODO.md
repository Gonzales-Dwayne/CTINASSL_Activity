# ClackLabs — Remaining Implementation Work

_Last updated: 2026-11-21_

This document tracks what is still missing or needs hardening. It replaces the earlier feature checklist, which no longer reflected the current app.

---

## Current foundation

### Storefront

- [x] React + Vite single-page storefront with hash routing:
  - `#/` landing page
  - `#/products`
  - `#/products/:category`
  - `#/product/:id`
  - `#/login`
  - `#/admin`
- [x] Scroll-aware fixed header with mega menu.
- [x] Hero carousel and featured-product carousel.
- [x] Real product imagery across the catalogue.
- [x] 84-product catalogue with 3 categories:
  - Keyboards (35)
  - Keycaps (42)
  - Switches (7)
- [x] MongoDB-backed product data by default, with a `VITE_DATA_SOURCE=local` fallback.
- [x] Checkout flow with server totals, stock checks, order creation, and confirmation.
- [x] Account API for profile, password, addresses, wishlist, order history, and cart.
- [x] Catalogue category pages with sorting, counts, and dynamic active-tab indicator.
- [x] Product detail pages with sourced descriptions/specs and related products.
- [x] Search drawer over the loaded catalogue.
- [x] Customer account at `#/account`:
  - Profile editing
  - Password change
  - Order history and item details
  - Saved addresses/default address
  - Wishlist
- [x] Persistent MongoDB cart for signed-in users:
  - Guest cart in `localStorage`
  - Guest cart merged into MongoDB on login
  - Stock validation on every cart mutation
  - Quantity capped to available stock
  - Stock messages in product and cart UI
  - Local cart cleared on sign-out
- [x] Product wishlist save/remove action.
- [x] Storefront header account menu with account and sign-out actions.
- [x] Customer register/login/logout with bcrypt password verification and JWT sessions.
- [x] Admin login redirects directly to `#/admin`.

### Admin

- [x] Standalone admin shell with no storefront header, search, or cart.
- [x] Admin-only JWT-protected API.
- [x] Overview stats and recent products/orders.
- [x] Product CRUD:
  - Create
  - Search/read
  - Edit
  - Delete
  - Featured flag
  - Image path/URL preview
- [x] Order management:
  - Read
  - Update status
  - Delete
- [x] Customer management:
  - Read
  - Change role
  - Change password (invalidates existing sessions)
  - Delete
- [x] Safety guards:
  - Cannot change own role.
  - Cannot delete own account.
  - Cannot demote/delete the last administrator.
- [x] Dynamic sidebar indicator.

### Backend / data

- [x] Express 5 API connected to local MongoDB.
- [x] Seeded catalogue and category records.
- [x] Sourced product details for 82 of 84 products.
- [x] Health endpoint, image serving, CORS, JSON body limits.
- [x] Unique user email index and bcrypt password hashing.
- [x] Account API for profile, password, addresses, wishlist, order history, and cart.
- [x] Checkout API with order creation and confirmation.
- [x] Product/order/customer admin APIs.
- [x] Backend organized into `models/`, `controllers/`, `routes/`, `middleware/`, and `utils/` modules.

---

## P0 — Storefront and commerce blockers

### 1. Checkout and real order creation — completed core flow

- [x] Checkout route at `#/checkout` with contact, shipping, delivery, and payment form.
- [x] Server-validated order summary.
- [x] Server-side totals from current prices, shipping, and 8% tax.
- [x] Stock/quantity revalidation before order creation.
- [x] Order number generation.
- [x] Inventory decrement with rollback if a line fails.
- [x] Cart cleared only after the order is committed.
- [x] Order confirmation page at `#/order/:id`.
- [x] Orders appear in customer order history.
- [x] “What happens next” fulfilment messaging.
- [ ] Live payment provider integration. Current options are demo card (marked paid) and pay-on-delivery (pending).
- [ ] Payment gateway success/failure/cancel/retry states.
- [ ] Separate `order_details` records; new orders currently embed line items in `orders`.
- [ ] Actual confirmation email delivery. A notification document is queued, but no email provider is connected.

### 2. Customer account and order history — completed

- [x] Customer profile page at `#/account`.
- [x] Order history with expandable line items.
- [x] Order status and totals.
- [x] Update customer name/email.
- [x] Customer password change (invalidates existing sessions and signs out).
- [x] Saved addresses with one default address.
- [x] Wishlist add/remove and account wishlist view.
- [x] Header account menu links to the account page.

### 3. Cart persistence and inventory rules — completed

- [x] Signed-in carts stored in MongoDB (`carts` collection).
- [x] Guest cart remains in `localStorage` and merges on login.
- [x] Guest cart is device-local; signed-in carts sync across devices.
- [x] Product existence and stock validated on every cart read/write.
- [x] Quantities capped to available stock (maximum 99 per line).
- [x] Stock/availability shown on product pages and in the cart.
- [x] Stock is **not reserved** — inventory is only reserved once checkout exists.
- [x] Sign-out clears the local cart.
- [ ] Abandoned-cart recovery is not implemented (out of current scope).

### 4. Mobile navigation

- [ ] Add a mobile header menu/hamburger.
- [ ] Add mobile category navigation and mega-menu equivalent.
- [ ] Ensure search, account, and cart remain reachable on small screens.
- [ ] Add mobile admin navigation review where tabs overflow.

### 5. Schema alignment

Critical before checkout:

- [ ] Normalize product identifiers. Current products use string `_id`/`id`, while order/cart schemas expect `ObjectId` product IDs.
- [ ] Choose one ID strategy and migrate products, carts, orders, and APIs consistently.
- [ ] Decide what to do with legacy orders that reference old product IDs no longer in the catalogue.
- [ ] Add a migration/seed strategy for existing users, carts, and orders.
- [ ] Confirm indexes and uniqueness constraints for products, orders, and users.

---

## P1 — Catalogue and product experience

### 6. Product model completeness

- [ ] Add variants (layout, colour, switch type, keycap set).
- [ ] Add per-variant SKU, price, stock, and image.
- [ ] Add a product image gallery rather than a single image.
- [ ] Add image alt text and responsive image sizes.
- [ ] Add quantity selector on product pages.
- [ ] Add stock/availability state on product cards and detail pages.
- [ ] Add “notify me” / back-in-stock handling if desired.
- [ ] Replace placeholder whole-dollar pricing with final prices (including cents if needed).
- [ ] Complete sourced details for the two generic products:
  - Lofree Moru
  - Lofree Transparent
- [ ] Audit sourced descriptions/specs against current official product pages.

### 7. Search and catalogue discovery

- [x] Server-backed `/api/search` with relevance ranking.
- [x] Debounced drawer querying.
- [x] Search query and filters stored in the URL (`#/search?...`).
- [x] Search result ranking/relevance.
- [x] Recent searches, trending products, and live result previews.
- [x] Dedicated search results page with pagination.
- [x] Price, availability, category, and sorting filters.
- [x] Server-side pagination for search results. Admin order/customer tables still use client-side lists.

### 8. Admin catalogue management

- [x] Edit product details and specifications in the admin UI.
- [x] Image upload and local file storage (`server/uploads`).
- [x] Category management:
  - Create/rename/reorder categories
  - Category images/descriptions
  - Prevent deleting a category with products
- [x] Soft delete/archive and restore.
- [x] Product duplication.
- [x] SKU/barcode fields.
- [x] Bulk archive/restore and CSV import/export.
- [x] Low-stock thresholds and restock notes.

---

## P1 — Admin completeness

### 9. Orders

- [ ] Add an admin order detail page with line items, customer, shipping address, totals, and payment status.
- [ ] Add internal notes and fulfilment notes.
- [ ] Add refund/cancel workflows with payment-provider integration.
- [ ] Add tracking number/carrier fields.
- [ ] Add order export and date filtering.
- [ ] Decide whether admins need to create manual orders.
- [ ] Align status labels/transitions with the database validator and checkout lifecycle.
- [ ] Add audit history for status changes.

### 10. Customers

- [ ] Add admin-created customer accounts.
- [ ] Allow editing customer name/email in the UI.
- [ ] Show customer order history and lifetime value.
- [ ] Show addresses and account status.
- [ ] Add customer disable/suspend instead of only delete.
- [ ] Add audit history for role/password changes.
- [ ] Review admin self-protection and last-admin rules under concurrent requests.

### 11. Admin experience and operations

- [ ] Add pagination and server-side filtering to all tables.
- [ ] Add date-range analytics and revenue charts.
- [ ] Add confirmation modals instead of native `window.confirm`.
- [ ] Add toast notifications that auto-dismiss.
- [ ] Add loading skeletons and empty states.
- [ ] Add audit logs for administrative mutations.
- [ ] Add admin settings (store name, currency, shipping/tax defaults).
- [ ] Add role-based permissions beyond `admin`/`customer` if needed.

---

## P1 — Authentication and security hardening

- [ ] Set a strong, non-default `JWT_SECRET`; never ship the development fallback.
- [ ] Decide between localStorage JWT storage and secure httpOnly cookies.
- [ ] Add refresh tokens or short-lived access tokens with rotation.
- [ ] Add logout-all-devices/session revocation.
- [ ] Add rate limiting and brute-force protection on auth endpoints.
- [ ] Add Helmet and a strict production CORS allowlist.
- [ ] Add email verification for new accounts.
- [ ] Add forgot-password/reset-token flow.
- [ ] Add password-strength rules and breached-password checks if required.
- [ ] Add CSRF protection if cookies are introduced.
- [ ] Add request validation/sanitization consistently (consider Zod/Joi).
- [ ] Add audit logging for auth and admin actions.
- [ ] Replace the temporary admin credential with a documented bootstrap/reset process.
- [ ] Add session-expiry UX and redirect handling.
- [ ] Add HTTPS and secure deployment configuration.

---

## P2 — Content, accessibility, and SEO

- [ ] Add footer navigation.
- [ ] Add policy pages:
  - Shipping
  - Returns/refunds
  - Warranty
  - Privacy
  - Terms
  - Contact/support
- [ ] Add a 404 page and React error boundary.
- [ ] Add skip-to-content link and verify landmark structure.
- [ ] Add proper dialog focus trapping and focus restoration for drawers/modals.
- [ ] Audit keyboard navigation across header, mega menu, drawers, admin tables, and modals.
- [ ] Audit colour contrast, reduced motion, and screen-reader labels.
- [ ] Add touch/swipe and keyboard controls to carousels.
- [ ] Add autoplay/pause behavior and slide indicators if desired.
- [ ] Add page titles, meta descriptions, Open Graph tags, sitemap, and robots.txt.
- [ ] Add structured product data for SEO.
- [ ] Clean up unused assets (e.g. root hero JPGs).
- [ ] Verify all product image paths in production hosting.

---

## P2 — Testing, tooling, and operations

- [ ] Add server tests for auth, products, orders, customers, and password resets.
- [ ] Add client tests for cart totals, search, login redirects, and admin CRUD.
- [ ] Add end-to-end tests for browse → product → cart → checkout.
- [ ] Add accessibility tests (axe or equivalent).
- [ ] Add CI for lint, build, and tests.
- [ ] Add a root dev script to run client and server together.
- [ ] Add server `dev` script with watch mode.
- [ ] Add a root README documenting:
  - Prerequisites
  - MongoDB setup
  - `.env` configuration
  - Seed/sync commands
  - Admin bootstrap
  - Running client/server
- [ ] Add production deployment configuration.
- [ ] Add database backups and restore procedure.
- [ ] Add monitoring/error tracking.
- [ ] Add performance budgets and image optimization.
- [ ] Add pagination/query limits to protect the API as data grows.

---

## Known gaps and risks (quick reference)

- Checkout uses demo card/pay-on-delivery; no live payment provider is connected.
- No payment gateway failure/cancel/retry flow.
- No real confirmation email delivery; notifications are queued only.
- New orders embed line items; separate `order_details` records are not written.
- Products/carts use string product IDs; orders still use `ObjectId` product/user references.
- The header navigation is hidden below 820px with no mobile replacement.
- Search is server-backed; admin order/customer tables remain client-side lists.
- Admin product pricing is whole-dollar only.
- JWT uses a development fallback secret unless `server/.env` sets one.
- No shipping carrier, tax-provider, or refund integration.
- Two products still use generic details: Lofree Moru and Lofree Transparent.
- No automated test suite or CI pipeline.
- Legacy order/customer data may not align with the current catalogue.

---

## Suggested implementation order

1. **Live payment provider, email delivery, and order_details** — finish commerce.
2. **Mobile navigation and responsive polish**.
3. **Admin order detail/refunds and customer management depth**.
4. **Auth/security hardening and audit logging**.
5. **Content, accessibility, SEO, tests, deployment**.
