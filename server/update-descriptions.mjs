/**
 * Fills in real, product-specific descriptions for the catalogue and keeps the
 * seed snapshot (server/data/products.json) in step with the database.
 *
 * Usage: node server/update-descriptions.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'

const here = dirname(fileURLToPath(import.meta.url))
const catalogPath = join(here, 'data', 'products.json')
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB ?? 'clacklabs'

// Layout / size facts for the Flow models come from
// src/lofree_flow_web/manifest.json; the rest describe the known family.
const DESCRIPTIONS = {
  // ── Lofree keyboards ────────────────────────────────────────────────────
  'mechanical-keyboards-lofree-flow-84':
    'Low-profile 84-key (75%) board with an all-aluminium case and frame, a gasket mount with IXPE and Poron foam, rose-gold side and foot plates and two RGB side strips. 316.7 × 126.6 × 24.5 mm — Black and White.',
  'mechanical-keyboards-lofree-flow-100':
    'Low-profile 100-key board with an all-aluminium case and frame, a gasket mount with IXPE and Poron foam, rose-gold side and foot plates and two RGB side strips. 373.7 × 126.6 × 26 mm — Black and White.',
  'mechanical-keyboards-lofree-flow-lite-84':
    'Low-profile 84-key board with a gasket mount, a USB-C port and power/mode slider on the rear edge, and a side volume roller. 316.8 × 138.9 × 23.5 mm — Off-White, Marble and Flamingo.',
  'mechanical-keyboards-lofree-flow-lite-100':
    'Low-profile 100-key board with a gasket mount, a rear USB-C port and power/mode slider, and a side volume roller. 374.5 × 138.9 × 23.5 mm — Off-White, Marble and Flamingo.',
  'mechanical-keyboards-lofree-edge':
    '84-key (75%) ultra-slim low-profile board, 15 mm thin at 485 g, with a 3K carbon-fibre top case and magnesium-alloy bottom, PCB-gasket mount, Kailh POM Switch 2.0 and dye-sub PBT keycaps. Bluetooth 5.3 or USB-C, up to 1000 Hz wired.',
  'mechanical-keyboards-lofree-block':
    '98-key (96%) wireless board with hot-swappable linear switches, gasket mount, dye-sub PBT keycaps, two retro knobs (volume and mode) and a small status display. Bluetooth 5.0, 2.4 GHz or USB-C; 387 × 165 × 40.5 mm, up to 80 hours per charge.',

  // ── Keychron mechanical ────────────────────────────────────────────────
  'mechanical-keyboards-keychron-k2-pro':
    '75% (84-key) wireless board with a gasket mount, hot-swap sockets, QMK/VIA support, Bluetooth 5.1 and USB-C.',
  'mechanical-keyboards-keychron-k8-pro':
    'TKL (87-key) take on the Pro platform: gasket mount, hot-swap sockets, QMK/VIA, Bluetooth 5.1 and USB-C.',
  'mechanical-keyboards-keychron-q1-max':
    '75% (81-key) full-aluminium board with a double-gasket mount, hot-swap sockets, QMK/VIA and 2.4 GHz, Bluetooth and USB-C connectivity.',
  'mechanical-keyboards-keychron-v1-max':
    '75% (81-key) gasket-mounted board with hot-swap sockets, QMK/VIA and 2.4 GHz, Bluetooth and USB-C.',
  'mechanical-keyboards-keychron-v3-max':
    'TKL (87-key) version of the V Max platform: gasket mount, hot-swap sockets, QMK/VIA and 2.4 GHz, Bluetooth and USB-C.',

  // ── Keychron magnetic (Hall effect) ────────────────────────────────────
  'magnetic-keyboards-keychron-k2-he':
    '75% (84-key) Hall-effect board with adjustable actuation, rapid trigger and per-key calibration, wired and 2.4 GHz.',
  'magnetic-keyboards-keychron-k2-he-black':
    'The K2 HE in a blacked-out finish — 75% Hall-effect switches with adjustable actuation and rapid trigger.',
  'magnetic-keyboards-keychron-k2-he-special-edition':
    'Special-edition K2 HE with a distinct case finish, keeping the 75% Hall-effect layout, rapid trigger and adjustable actuation.',
  'magnetic-keyboards-keychron-k4-he':
    '96% (100-key) Hall-effect board with adjustable actuation, rapid trigger and per-key calibration.',
  'magnetic-keyboards-keychron-q1-he':
    '75% (81-key) full-aluminium Hall-effect board with rapid trigger, adjustable actuation and 2.4 GHz plus USB-C.',
  'magnetic-keyboards-keychron-q1-he-carbon-black':
    'The Q1 HE in Carbon Black — aluminium 75% Hall-effect board with rapid trigger and adjustable actuation.',
  'magnetic-keyboards-keychron-q1-he-shell-white':
    'The Q1 HE in Shell White — aluminium 75% Hall-effect board with rapid trigger and adjustable actuation.',
  'magnetic-keyboards-keychron-q1-he-special-edition':
    'Special-edition Q1 HE: aluminium 75% Hall-effect board with rapid trigger, adjustable actuation and a unique finish.',
  'magnetic-keyboards-keychron-q3-he':
    'TKL (87-key) full-aluminium Hall-effect board with rapid trigger and adjustable actuation.',
  'magnetic-keyboards-keychron-q5-he':
    '96% (1800 compact) full-aluminium Hall-effect board with rapid trigger and adjustable actuation.',

  // ── GMK keycaps ────────────────────────────────────────────────────────
  'keycaps-gmk-blue-samurai':
    'GMK Blue Samurai — double-shot ABS keycaps in Cherry profile, in a deep blue and white colourway with red accents.',
  'keycaps-gmk-red-samurai':
    'GMK Red Samurai — double-shot ABS keycaps in Cherry profile, pairing red and black with white legends.',
  'keycaps-gmk-botanical':
    'GMK Botanical — double-shot ABS keycaps in Cherry profile, in forest green and cream.',
  'keycaps-gmk-dots':
    'GMK Dots — double-shot ABS keycaps in Cherry profile, with a dark base and multicoloured dot legends.',
  'keycaps-gmk-metropolis':
    'GMK Metropolis — double-shot ABS keycaps in Cherry profile, in a navy, teal and yellow colourway.',
  'keycaps-gmk-mictlan':
    'GMK Mictlan — double-shot ABS keycaps in Cherry profile, in an earthy colourway with teal and gold accents.',
  'keycaps-gmk-minimal-2':
    'GMK Minimal 2 — double-shot ABS keycaps in Cherry profile, in a clean white and light-grey colourway.',
  'keycaps-gmk-pharaoh':
    'GMK Pharaoh — double-shot ABS keycaps in Cherry profile, in a sand, gold and deep-blue colourway.',
  'keycaps-gmk-striker':
    'GMK Striker — double-shot ABS keycaps in Cherry profile, in a bright blue and white colourway.',
  'keycaps-gmk-wob':
    'GMK WoB — “White on Black”: double-shot ABS keycaps in Cherry profile with bright legends on black.',

  // ── Switches ───────────────────────────────────────────────────────────
  'switches-keychron-gateron-jupiter-red':
    'Gateron Jupiter Red — a smooth linear switch from Gateron’s Jupiter line, sold in packs for hot-swap boards.',
  'switches-keychron-gateron-jupiter-banana':
    'Gateron Jupiter Banana — a rounded tactile switch from Gateron’s Jupiter line, sold in packs.',
  'switches-keychron-k-pro-red':
    'Keychron K Pro Red — a light linear switch tuned for fast, smooth typing; sold in packs.',
  'switches-keychron-k-pro-brown':
    'Keychron K Pro Brown — a tactile switch with a gentle bump for typing and everyday work; sold in packs.',
  'switches-keychron-k-pro-banana':
    'Keychron K Pro Banana — a tactile switch with a fuller bump, sold in packs for hot-swap keyboards.',
  'switches-keychron-k-pro-mint':
    'Keychron K Pro Mint — a tactile switch with a crisp, well-defined bump; sold in packs.',
  'switches-lofree-ghost':
    'Lofree Ghost — a linear low-profile switch for the Flow series, sold in packs for hot-swap boards.',
  'switches-lofree-phantom':
    'Lofree Phantom — a linear low-profile switch with a light, consistent feel; sold in packs.',
  'switches-lofree-specter':
    'Lofree Specter — a linear low-profile switch with a smooth travel; sold in packs.',
  'switches-lofree-wizard':
    'Lofree Wizard — a tactile low-profile switch for the Flow series, sold in packs.',

  // ── Accessories ────────────────────────────────────────────────────────
  'accessories-artisan-keycap':
    'A hand-finished artisan keycap for the Esc or F-row, made to add a single point of character to a build.',
  'accessories-carry-sleeve':
    'Padded carry sleeve that fits 60% to 75% keyboards, with a soft inner lining for transport.',
  'accessories-case-foam-sheet':
    'Die-cut foam sheet for the inside of a case, damping ping and tightening up the sound.',
  'accessories-coiled-cable-blue':
    'Coiled USB-C cable in blue, with a braided jacket and a detachable connector end.',
  'accessories-desk-mat-xl':
    'Extra-large cloth desk mat with a stitched edge and a non-slip rubber base.',
  'accessories-keycap-puller':
    'Wire keycap puller for safely lifting PBT and ABS keycaps without marking the caps.',
  'accessories-lube-kit':
    'Switch lube kit with brushes, tweezers and a small pot of lubricant for stabilisers and switches.',
  'accessories-stabilizer-set':
    'Screw-in stabiliser set for spacebar, shifts and enter, pre-clipped for a clean PCB fit.',
  'accessories-switch-puller':
    'Switch puller for hot-swap boards, with a slim claw that gets under the plate without bending pins.',
  'accessories-walnut-wrist-rest':
    'Solid walnut wrist rest, cut to match 60% to TKL boards and finished with a natural oil coat.',
}

// Product-page bullets. Kept short so they scan like a spec sheet.
const DETAILS = {
  'mechanical-keyboards-lofree-flow-84': [
    'Low-profile 84-key (75%) layout',
    'All-aluminium case and frame, gasket mount with IXPE and Poron foam',
    'Rose-gold side and foot plates, two RGB side strips',
    '316.7 × 126.6 × 24.5 mm — Black and White',
  ],
  'mechanical-keyboards-lofree-flow-100': [
    'Low-profile 100-key layout',
    'All-aluminium case and frame, gasket mount with IXPE and Poron foam',
    'Rose-gold side and foot plates, two RGB side strips',
    '373.7 × 126.6 × 26 mm — Black and White',
  ],
  'mechanical-keyboards-lofree-flow-lite-84': [
    'Low-profile 84-key layout',
    'Gasket-mounted case',
    'Rear USB-C plus power/mode slider, side volume roller',
    '316.8 × 138.9 × 23.5 mm — Off-White, Marble and Flamingo',
  ],
  'mechanical-keyboards-lofree-flow-lite-100': [
    'Low-profile 100-key layout',
    'Gasket-mounted case',
    'Rear USB-C plus power/mode slider, side volume roller',
    '374.5 × 138.9 × 23.5 mm — Off-White, Marble and Flamingo',
  ],
  'mechanical-keyboards-lofree-edge': [
    '84-key (75%) low-profile, 15 mm thin at 485 g',
    '3K carbon-fibre top case, magnesium-alloy bottom',
    'Kailh POM Switch 2.0 on a PCB-gasket mount',
    'Bluetooth 5.3 or USB-C — up to 1000 Hz wired',
  ],
  'mechanical-keyboards-lofree-block': [
    '98-key (96%) layout with dye-sub PBT keycaps',
    'Hot-swappable linear Lofree × TTC switches, gasket mount',
    'Volume and mode knobs plus a small status display',
    'Bluetooth 5.0, 2.4 GHz or USB-C — up to 80 hours',
  ],

  'mechanical-keyboards-keychron-k2-pro': [
    '75% (84-key) layout',
    'Gasket mount with hot-swap sockets',
    'QMK/VIA programmable',
    'Bluetooth 5.1 and USB-C',
  ],
  'mechanical-keyboards-keychron-k8-pro': [
    'TKL (87-key) layout',
    'Gasket mount with hot-swap sockets',
    'QMK/VIA programmable',
    'Bluetooth 5.1 and USB-C',
  ],
  'mechanical-keyboards-keychron-q1-max': [
    '75% (81-key) layout',
    'Full aluminium case, double-gasket mount',
    'Hot-swap sockets, QMK/VIA programmable',
    '2.4 GHz, Bluetooth and USB-C',
  ],
  'mechanical-keyboards-keychron-v1-max': [
    '75% (81-key) layout',
    'Gasket mount with hot-swap sockets',
    'QMK/VIA programmable',
    '2.4 GHz, Bluetooth and USB-C',
  ],
  'mechanical-keyboards-keychron-v3-max': [
    'TKL (87-key) layout',
    'Gasket mount with hot-swap sockets',
    'QMK/VIA programmable',
    '2.4 GHz, Bluetooth and USB-C',
  ],

  'magnetic-keyboards-keychron-k2-he': [
    '75% (84-key) Hall-effect layout',
    'Adjustable actuation with rapid trigger',
    'Per-key calibration',
    'Wired and 2.4 GHz',
  ],
  'magnetic-keyboards-keychron-k2-he-black': [
    '75% (84-key) Hall-effect layout in a blacked-out finish',
    'Adjustable actuation with rapid trigger',
    'Per-key calibration',
    'Wired and 2.4 GHz',
  ],
  'magnetic-keyboards-keychron-k2-he-special-edition': [
    '75% (84-key) Hall-effect layout, special-edition finish',
    'Adjustable actuation with rapid trigger',
    'Per-key calibration',
    'Wired and 2.4 GHz',
  ],
  'magnetic-keyboards-keychron-k4-he': [
    '96% (100-key) Hall-effect layout',
    'Adjustable actuation with rapid trigger',
    'Per-key calibration',
    'Wired and 2.4 GHz',
  ],
  'magnetic-keyboards-keychron-q1-he': [
    '75% (81-key) full-aluminium Hall-effect layout',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],
  'magnetic-keyboards-keychron-q1-he-carbon-black': [
    '75% (81-key) aluminium Hall-effect layout, Carbon Black finish',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],
  'magnetic-keyboards-keychron-q1-he-shell-white': [
    '75% (81-key) aluminium Hall-effect layout, Shell White finish',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],
  'magnetic-keyboards-keychron-q1-he-special-edition': [
    '75% (81-key) aluminium Hall-effect layout, special-edition finish',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],
  'magnetic-keyboards-keychron-q3-he': [
    'TKL (87-key) full-aluminium Hall-effect layout',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],
  'magnetic-keyboards-keychron-q5-he': [
    '96% (1800 compact) full-aluminium Hall-effect layout',
    'Rapid trigger with adjustable actuation',
    'Per-key calibration',
    '2.4 GHz and USB-C',
  ],

  'keycaps-gmk-blue-samurai': [
    'Double-shot ABS, Cherry profile',
    'Deep blue and white with red accents',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-red-samurai': [
    'Double-shot ABS, Cherry profile',
    'Red and black with white legends',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-botanical': [
    'Double-shot ABS, Cherry profile',
    'Forest green and cream colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-dots': [
    'Double-shot ABS, Cherry profile',
    'Dark base with multicoloured dot legends',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-metropolis': [
    'Double-shot ABS, Cherry profile',
    'Navy, teal and yellow colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-mictlan': [
    'Double-shot ABS, Cherry profile',
    'Earthy colourway with teal and gold accents',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-minimal-2': [
    'Double-shot ABS, Cherry profile',
    'White and light-grey colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-pharaoh': [
    'Double-shot ABS, Cherry profile',
    'Sand, gold and deep-blue colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-striker': [
    'Double-shot ABS, Cherry profile',
    'Bright blue and white colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],
  'keycaps-gmk-wob': [
    'Double-shot ABS, Cherry profile',
    'White on Black colourway',
    'Base kit covers 60% to TKL layouts',
    'Fits MX-style stems',
  ],

  'switches-keychron-gateron-jupiter-red': [
    'Linear switch from Gateron’s Jupiter line',
    'Smooth, light actuation',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-keychron-gateron-jupiter-banana': [
    'Tactile switch from Gateron’s Jupiter line',
    'Rounded bump on the downstroke',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-keychron-k-pro-red': [
    'Linear switch from Keychron’s K Pro line',
    'Light and fast for typing or gaming',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-keychron-k-pro-brown': [
    'Tactile switch from Keychron’s K Pro line',
    'Gentle bump for everyday typing',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-keychron-k-pro-banana': [
    'Tactile switch from Keychron’s K Pro line',
    'Fuller, rounder bump',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-keychron-k-pro-mint': [
    'Tactile switch from Keychron’s K Pro line',
    'Crisp, well-defined bump',
    'Sold in packs for hot-swap builds',
    'MX-style footprint',
  ],
  'switches-lofree-ghost': [
    'Linear low-profile switch for the Flow series',
    'Light, consistent feel',
    'Sold in packs for hot-swap boards',
    'Check the profile against your board',
  ],
  'switches-lofree-phantom': [
    'Linear low-profile switch for the Flow series',
    'Smooth, even travel',
    'Sold in packs for hot-swap boards',
    'Check the profile against your board',
  ],
  'switches-lofree-specter': [
    'Linear low-profile switch for the Flow series',
    'Light actuation with a quiet bottom-out',
    'Sold in packs for hot-swap boards',
    'Check the profile against your board',
  ],
  'switches-lofree-wizard': [
    'Tactile low-profile switch for the Flow series',
    'Defined bump with a short travel',
    'Sold in packs for hot-swap boards',
    'Check the profile against your board',
  ],

  'accessories-artisan-keycap': [
    'Hand-finished artisan cap for Esc or an F-row key',
    'Fits MX-style stems',
    'One-off finish — each cap varies slightly',
  ],
  'accessories-carry-sleeve': [
    'Fits 60% to 75% keyboards',
    'Padded, soft-lined interior',
    'Zip closure with a carry loop',
  ],
  'accessories-case-foam-sheet': [
    'Die-cut foam for the inside of a case',
    'Damps ping and tightens up the sound',
    'Trimmable to fit smaller layouts',
  ],
  'accessories-coiled-cable-blue': [
    'Coiled USB-C cable in blue',
    'Braided jacket with a detachable end',
    'Works with most USB-C keyboards',
  ],
  'accessories-desk-mat-xl': [
    'Extra-large cloth surface',
    'Stitched edge, non-slip rubber base',
    'Room for a keyboard and a mouse',
  ],
  'accessories-keycap-puller': [
    'Wire puller for keycaps',
    'Lifts PBT and ABS caps without marking them',
    'Works on all standard layouts',
  ],
  'accessories-lube-kit': [
    'Lubricant plus brushes and tweezers',
    'For switches and stabilisers',
    'Small pot with a resealable lid',
  ],
  'accessories-stabilizer-set': [
    'Screw-in stabilisers for spacebar, shifts and enter',
    'Pre-clipped for a clean PCB fit',
    'Fits standard 60% to TKL layouts',
  ],
  'accessories-switch-puller': [
    'Slim claw for hot-swap boards',
    'Gets under the plate without bending pins',
    'Works with plate-mount switches',
  ],
  'accessories-walnut-wrist-rest': [
    'Solid walnut, natural oil finish',
    'Cut for 60% to TKL boards',
    'Non-slip feet on the underside',
  ],
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbName)
  const collection = db.collection('products')

  const docs = await collection.find().toArray()
  const missing = docs.filter((doc) => !DESCRIPTIONS[doc.slug]).map((doc) => doc.slug)
  if (missing.length > 0) {
    console.warn('No description written for:', missing.join(', '))
  }

  let updated = 0
  for (const doc of docs) {
    const description = DESCRIPTIONS[doc.slug]
    const details = DETAILS[doc.slug]
    if (!description && !details) continue

    const changes = {}
    if (description && description !== doc.description) changes.description = description
    if (details) changes.details = details
    if (Object.keys(changes).length === 0) continue

    await collection.updateOne({ _id: doc._id }, { $set: changes })
    updated += 1
  }
  console.log(`Updated ${updated} product descriptions in ${dbName}.`)

  // Keep the seed snapshot identical to the database.
  const snapshot = JSON.parse(await readFile(catalogPath, 'utf8'))
  let snapshotUpdated = 0
  for (const product of snapshot) {
    const description = DESCRIPTIONS[product.slug]
    const details = DETAILS[product.slug]
    let changed = false
    if (description && description !== product.description) {
      product.description = description
      changed = true
    }
    if (details) {
      product.details = details
      changed = true
    }
    if (changed) snapshotUpdated += 1
  }
  await writeFile(catalogPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  console.log(`Updated ${snapshotUpdated} descriptions in server/data/products.json.`)
} finally {
  await client.close()
}
