# ClackLabs — database structure

Local MongoDB (`mongodb://127.0.0.1:27017`), database **`clacklabs`**.

**Three collections, minimal fields, no documents.** Structure, validators,
indexes and two relationship views only.

```powershell
cd db
npm install        # first time only
npm run schema     # create/update structure (idempotent)
npm run reset      # DROP the database, then rebuild the structure
npm run check      # audit references + order totals
npm run demo       # build clacklabs_demo with sample data (Compass screenshots)
npm run inspect    # list databases and document counts
```

Env overrides: `MONGODB_URI`, `MONGODB_DB`.

## Collections (3)

| Collection | Fields |
| --- | --- |
| `users` | `name`, `email`, `passwordHash`, `role`, `cart[]`, `wishlist[]` |
| `products` | `name`, `slug`, `category`, `priceCents`, `stock`, `description`, `image` |
| `orders` | `orderNumber`, `userId`, `items[]`, `totalCents`, `status`, `placedAt` |

`cart[]` is `[{ productId, qty }]` — prices come from the product.
`items[]` on an order is `[{ productId, name, unitPriceCents, qty }]`: name and
price are snapshots so later catalog edits don't rewrite history.
`image` is a color string for now (`"#1d4ed8"`).

Money is integer **cents** (`priceCents`, `totalCents`), currency `PHP`.

## Relationships

```
users ──────1:N─▶ orders        orders.userId            → users._id
users ──────1:N─▶ cart          users.cart[].productId   → products._id
users ──────1:N─▶ wishlist      users.wishlist[]         → products._id
orders ─────1:N─▶ line items    orders.items[].productId → products._id
```

Embedded by design: the cart, the wishlist, order line items.

## Views (2)

| View | Adds |
| --- | --- |
| `user_cart` | `cartProducts[]` — the user's cart with products resolved |
| `order_details` | `customer` — order plus buyer (no password, cart or wishlist) |

## Indexes

Unique: `users.email`, `products.slug`, `orders.orderNumber`.

Query: `users { wishlist }` (multikey); `products { category }`,
`products { priceCents }`, text `product_text` over name + description;
`orders { userId, placedAt }`, `orders { status }`.

## Validation and audits

Strict `$jsonSchema` validators (bad writes → **121**, duplicates → **11000**).
The server cannot verify a reference exists, so `npm run check` reports:

- orphan references across the 4 relationship paths
- `orders.totalCents` disagreeing with the sum of its line items

Exit code is non-zero when something is inconsistent.

## Example documents

`users`

```json
{
  "name": "Demo Customer",
  "email": "demo@clacklabs.dev",
  "passwordHash": "<bcrypt>",
  "role": "customer",
  "cart": [{ "productId": "<products._id>", "qty": 1 }],
  "wishlist": ["<products._id>"]
}
```

`products`

```json
{
  "name": "ClackLabs Nova 75",
  "slug": "clacklabs-nova-75",
  "category": "Mechanical Keyboard",
  "priceCents": 599000,
  "stock": 24,
  "description": "75% aluminum board with gasket mount.",
  "image": "#1d4ed8"
}
```

`orders`

```json
{
  "orderNumber": "CL-1001",
  "userId": "<users._id>",
  "items": [
    { "productId": "<products._id>", "name": "ClackLabs Nova 75", "unitPriceCents": 599000, "qty": 1 }
  ],
  "totalCents": 599000,
  "status": "paid",
  "placedAt": "2026-11-13T00:00:00Z"
}
```
