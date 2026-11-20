// Presentation helpers. Product data comes from the API — no demo values here.

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export function productsInCategory(products, category, subcategory = null) {
  return products.filter((product) => {
    if (category && product.category !== category) return false
    if (subcategory && product.subcategory !== subcategory) return false
    return true
  })
}

export function searchProducts(products, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return products.filter((product) =>
    `${product.name} ${product.category} ${product.subcategory ?? ''} ${product.description}`
      .toLowerCase()
      .includes(needle),
  )
}

const DETAILS = {
  'Mechanical Keyboards': [
    'Mechanical keyboard typing experience',
    'Layout and connectivity vary by model',
    'Available features vary by product',
    'Check the listing for included accessories',
  ],
  'Magnetic Keyboards': [
    'Hall-effect magnetic switch technology',
    'Actuation features vary by model',
    'Check the listing for connection options',
    'Designed for gaming and customization',
  ],
  Switches: [
    'Switch type and characteristics vary by model',
    'Pack quantity varies by product',
    'Check compatibility before purchase',
    'For use with compatible keyboard sockets',
  ],
  Keycaps: [
    'Material and profile vary by set',
    'Kit contents vary by set',
    'Check the included keys before purchase',
    'Compatibility depends on the keyboard layout',
  ],
  Accessories: [
    'Designed for desk setups',
    'Works with any ClackLabs board',
    'Lightweight, easy to store',
    'One-year warranty',
  ],
}

export function detailsFor(product) {
  return DETAILS[product.category] ?? [
    'Ships within 2-3 business days',
    'One-year warranty',
  ]
}

export function getProduct(products, id) {
  return products.find((product) => product.id === id) ?? null
}

export function formatPrice(priceCents) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(priceCents / 100)
}
