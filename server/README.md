# ClackLabs API

Express + MongoDB backend for the storefront and the admin dashboard.
Database: `clacklabs` (structure created by `db/schema.mjs`).

```powershell
# from the repo root
npm run catalog:export    # dump current products from Mongo → server/data/products.json
npm run catalog:sync      # apply products.json without wiping users/orders
npm run seed -- --force   # wipe + reseed from products.json (needs --force)
npm run api      # http://127.0.0.1:4000
npm run dev      # Vite on :5173, proxies /api to the API
```

`server/data/products.json` is the seed snapshot, exported from whatever is in
the database, so the two never drift. `catalog:sync` refreshes names,
categories, descriptions and images from that snapshot while preserving prices,
stock, users and orders — nothing is deleted.

The Vite dev server proxies `/api` → `http://127.0.0.1:4000`, so the frontend
uses relative URLs and no CORS setup is needed in development.

## Auth

`POST /api/auth/login` → `{ user, token }`. Send the token as
`Authorization: Bearer <token>`; it is valid for 7 days. Admin-only routes expect
`role: "admin"` in the token.

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@clacklabs.dev` | `admin123` |
| Customer | `demo@clacklabs.dev` | `demo123` |

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness + database name |
| POST | `/api/auth/login` | — | Email + password (bcrypt) |
| GET | `/api/auth/me` | token | Current account |
| GET | `/api/products` | — | Full catalogue |
| GET | `/api/products/:slug` | — | One product |
| POST | `/api/products` | admin | Create (unique slug) |
| PUT | `/api/products/:slug` | admin | Replace editable fields |
| DELETE | `/api/products/:slug` | admin | Delete |
| GET | `/api/orders` | admin | Orders joined with customer |
| GET | `/api/customers` | admin | Accounts + order counts |
| GET | `/api/stats` | admin | Revenue, orders, products, stock, low stock |

Products are stored with `slug` as their public identifier; the API returns it as
`id` so the frontend can keep using the same product objects everywhere.

## Data model

Seeded from `server/data/catalog.js` (51 products) and `server/seed.mjs`
(8 users, 24 orders). The frontend has no demo data: products, categories,
subcategories, orders and customers all come from the API. Money is integer cents, passwords are bcrypt hashes, and orders carry
line-item snapshots (`name`, `unitPriceCents`) so catalog edits never rewrite
history.
