export const CATEGORIES = [
  'Mechanical Keyboards',
  'Magnetic Keyboards',
  'Switches',
  'Keycaps',
  'Accessories',
]

export const SUBCATEGORIES = {
  Switches: ['Tactile', 'Linear', 'Magnetic'],
  Keycaps: ['Cherry', 'OEM', 'SA', 'XDA', 'DSA'],
}

const BLUES = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93b4f7']

const DESCRIPTIONS = {
  'Mechanical Keyboards':
    'Hot-swap board with a gasket mount, aluminum case and PBT keycaps.',
  'Magnetic Keyboards':
    'Hall-effect switches with per-key actuation and rapid trigger.',
  Switches: 'Factory pre-lubed switches, sold in packs of 110.',
  Keycaps: 'Double-shot PBT keycap set in an ANSI layout.',
  Accessories: 'Everyday desk accessory that pairs with any build.',
}

// [name, priceCents, subcategory]
const RAW = {
  'Mechanical Keyboards': [
    ['Nova 75', 599000, null],
    ['Atlas TKL', 425000, null],
    ['Nova 65', 535000, null],
    ['Atlas 68', 389000, null],
    ['Ridge 87', 479000, null],
    ['Terra 60', 429000, null],
    ['Halo 98', 749000, null],
    ['Vector 75', 619000, null],
    ['Ridge TKL Alu', 529000, null],
    ['Halo 65', 689000, null],
  ],
  'Magnetic Keyboards': [
    ['Flux 60 HE', 745000, null],
    ['Pulse 87 HE', 890000, null],
    ['Flux 75 HE', 829000, null],
    ['Pulse TKL HE', 799000, null],
    ['Spark 60', 559000, null],
    ['Spark 87', 629000, null],
    ['Drift 65 HE', 699000, null],
    ['Drift 87', 729000, null],
    ['Glide 60', 589000, null],
    ['Glide TKL', 649000, null],
  ],
  Switches: [
    ['Linear 45g — 110 pcs', 115000, 'Linear'],
    ['Silent Linear 50g — 110 pcs', 135000, 'Linear'],
    ['Speed Silver 40g — 110 pcs', 129000, 'Linear'],
    ['Ink Black 60g — 110 pcs', 159000, 'Linear'],
    ['Tactile 55g — 110 pcs', 125000, 'Tactile'],
    ['Box Brown 50g — 110 pcs', 139000, 'Tactile'],
    ['Holy Panda 60g — 110 pcs', 165000, 'Tactile'],
    ['Tactile 62g — 110 pcs', 145000, 'Tactile'],
    ['Magnetic HE 45g — 110 pcs', 175000, 'Magnetic'],
    ['Magnetic Jade 40g — 110 pcs', 185000, 'Magnetic'],
  ],
  Keycaps: [
    ['PBT Cherry Beige', 289000, 'Cherry'],
    ['PBT Cherry Dolch', 309000, 'Cherry'],
    ['PBT OEM Blue Ocean', 265000, 'OEM'],
    ['PBT OEM Sand', 259000, 'OEM'],
    ['PBT SA Retro', 349000, 'SA'],
    ['PBT SA Vintage', 359000, 'SA'],
    ['PBT XDA Pastel', 279000, 'XDA'],
    ['PBT XDA Blue', 269000, 'XDA'],
    ['PBT DSA Granite', 319000, 'DSA'],
    ['PBT DSA Midnight', 329000, 'DSA'],
  ],
  Accessories: [
    ['Walnut Wrist Rest', 125000, null],
    ['Coiled Cable — Blue', 89000, null],
    ['Desk Mat XL', 99000, null],
    ['Switch Puller', 25000, null],
    ['Keycap Puller', 22000, null],
    ['Lube Kit', 65000, null],
    ['Stabilizer Set', 85000, null],
    ['Case Foam Sheet', 45000, null],
    ['Artisan Keycap', 79500, null],
    ['Carry Sleeve', 69000, null],
  ],
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const PRODUCTS = Object.entries(RAW).flatMap(([category, items]) =>
  items.map(([name, priceCents, subcategory], index) => ({
    id: slugify(`${category}-${name}`),
    name,
    category,
    subcategory,
    priceCents,
    description: DESCRIPTIONS[category],
    image: BLUES[index % BLUES.length],
  })),
)

export function productsInCategory(category, subcategory = null) {
  return PRODUCTS.filter((product) => {
    if (category && product.category !== category) return false
    if (subcategory && product.subcategory !== subcategory) return false
    return true
  })
}

export function subcategoriesFor(category) {
  return SUBCATEGORIES[category] ?? []
}

export function searchProducts(query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return PRODUCTS.filter((product) =>
    `${product.name} ${product.category} ${product.subcategory ?? ''} ${product.description}`
      .toLowerCase()
      .includes(needle),
  )
}

const DETAILS = {
  'Mechanical Keyboards': [
    'Hot-swap sockets for any 3/5-pin switch',
    'Gasket mount with FR4 plate',
    'USB-C, 2.4 GHz and Bluetooth',
    'PBT keycaps included',
  ],
  'Magnetic Keyboards': [
    'Hall-effect switches, 0.1 mm actuation',
    'Rapid trigger and per-key curves',
    '8 kHz polling over USB-C',
    'Aluminum top case',
  ],
  Switches: [
    'Sold in packs of 110',
    'Factory pre-lubed',
    '5-pin PCB mount with a gold spring',
    'Compatible with MX-style sockets',
  ],
  Keycaps: [
    'Double-shot PBT, 1.5 mm walls',
    'ANSI 104 layout with novelties',
    'Shine-through legends on the base kit',
    'Fits MX-style stems',
  ],
  Accessories: [
    'Designed for desk setups',
    'Works with any ClackLabs board',
    'Lightweight, easy to store',
    'One-year warranty',
  ],
}

export function detailsFor(product) {
  return DETAILS[product.category] ?? []
}

export function getProduct(id) {
  return PRODUCTS.find((product) => product.id === id) ?? null
}

export function formatPrice(priceCents) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(priceCents / 100)
}
