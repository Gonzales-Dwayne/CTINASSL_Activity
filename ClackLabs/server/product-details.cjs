const FLOW_84 = {
  description:
    'A 75% low-profile mechanical keyboard combining a CNC aluminum frame, gasket mount, hot-swappable full-POM switches, and dye-sublimated PBT keycaps.',
  details: [
    '84-key (75%) low-profile layout',
    'CNC-machined aluminum frame with gasket mount',
    'Hot-swappable Lofree × Kailh low-profile switches',
    'Dye-sublimated PBT keycaps',
    'Bluetooth 5.0 and USB-C wired connectivity',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: 'Bluetooth 5.0 / USB-C wired',
    Switches: 'Lofree × Kailh full-POM low-profile, 50±10 gf linear',
    Keycaps: 'Dye-sublimated PBT',
    Battery: '2,000 mAh — up to 40 hours',
    Dimensions: '316 × 126 × 24.5 mm',
  },
  sourceUrl: 'https://www.lofree.co/products/lofree-flow-the-smoothest-mechanical-keyboard',
};

const FLOW_LITE_2_84 = {
  description:
    'A lightweight 75% wireless keyboard with an integrated status display, 1,000 Hz response, and a 3,000 mAh battery rated for up to 100 hours.',
  details: [
    '84-key (75%) low-profile layout',
    'Built-in battery and connection status display',
    '3,000 mAh battery — up to 100 hours',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
    '45 gf Echo POM linear switches',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Switches: 'Lofree Echo 45 gf linear POM',
    Keycaps: 'Oil-resistant matte PBT',
    Battery: '3,000 mAh — up to 100 hours',
    Display: 'Battery and connection status screen',
    PollingRate: '1,000 Hz',
    Dimensions: '317 × 142.5 × 22 mm',
  },
  sourceUrl:
    'https://www.lofree.co/products/flow-lite-2-84-low-profile-mechanical-keyboard',
};

const FLOW_LITE_2_100 = {
  ...FLOW_LITE_2_84,
  description:
    'A full-size 100-key version of the Flow Lite 2 with the same integrated display, 1,000 Hz response, and 3,000 mAh battery.',
  details: [
    '100-key (96%) low-profile layout',
    'Built-in battery and connection status display',
    '3,000 mAh battery — up to 100 hours',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
    '45 gf Echo POM linear switches',
  ],
  specs: {
    ...FLOW_LITE_2_84.specs,
    Layout: '100 keys (96%)',
    Dimensions: '374 × 142.5 × 22 mm',
    Weight: '625 g',
  },
  sourceUrl:
    'https://www.lofree.co/products/flow-lite-2-100-low-profile-mechanical-keyboard',
};

const FLOW_2_68 = {
  description:
    'A compact 65% low-profile keyboard with tri-mode connectivity, 1,000 Hz polling, hot-swappable Cloud switches, and a 3,000 mAh battery.',
  details: [
    '68-key (65%) low-profile layout',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
    '3,000 mAh battery',
    'Hot-swappable Lofree × Kailh Cloud switches',
  ],
  specs: {
    Layout: '68 keys (65%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Switches: 'Lofree × Kailh Cloud low-profile, hot-swappable',
    Keycaps: 'PBT',
    Battery: '3,000 mAh',
    PollingRate: '1,000 Hz',
    Dimensions: '341.2 × 107 × 21.5 mm',
    Weight: '635 g',
  },
  sourceUrl: 'https://www.lofree.co/products/flow-2-68-low-profile-mechanical-keyboard',
};

const FLOW_2_84 = {
  description:
    'A 75% low-profile keyboard from the Flow 2 line with 1,000 Hz response, tri-mode connectivity, and a 3,000 mAh battery.',
  details: [
    '84-key (75%) low-profile layout',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
    '3,000 mAh battery',
    'Hot-swappable Lofree × Kailh Cloud switches',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Switches: 'Lofree × Kailh Cloud low-profile, hot-swappable',
    Keycaps: 'PBT',
    Battery: '3,000 mAh',
    PollingRate: '1,000 Hz',
    Dimensions: '341.2 × 126 × 21.5 mm',
    Weight: '745 g',
  },
  sourceUrl: 'https://www.lofree.co/products/flow-2-84-low-profile-mechanical-keyboard',
};

const FLOW_2_100 = {
  description:
    'A full-size 100-key low-profile keyboard with 1,000 Hz response, tri-mode connectivity, and a 3,000 mAh battery.',
  details: [
    '100-key (96%) low-profile layout',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
    '3,000 mAh battery',
    'Hot-swappable Lofree × Kailh Cloud switches',
  ],
  specs: {
    Layout: '100 keys (96%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Switches: 'Lofree × Kailh Cloud low-profile, hot-swappable',
    Keycaps: 'PBT',
    Battery: '3,000 mAh',
    PollingRate: '1,000 Hz',
    Dimensions: '398.2 × 126 × 21.5 mm',
    Weight: '870 g',
  },
  sourceUrl: 'https://www.lofree.co/products/flow-2-100-low-profile-mechanical-keyboard',
};

const TOFU_68 = {
  description:
    'A 68-key mechanical keyboard with an 11.5° ergonomic curve, tri-mode connectivity, and dye-sublimated PBT keycaps.',
  details: [
    '68-key layout with an 11.5° curved typing profile',
    'Tri-mode connectivity',
    'Custom Lofree × Gateron Tofu linear switches',
    'Dye-sublimated PBT keycaps',
    '2,000 mAh battery — up to 40 hours',
  ],
  specs: {
    Layout: '68 keys',
    Connectivity: '2.4 GHz / Bluetooth / USB-C',
    Switches: 'Lofree × Gateron Tofu linear',
    Keycaps: 'Dye-sublimated PBT',
    Battery: '2,000 mAh — up to 40 hours',
    Ergonomics: '11.5° curved profile',
    Dimensions: '310 × 109 × 51.5 mm',
  },
  sourceUrl:
    'https://www.lofree.co/products/lofree-touch-triple-mode-mechanical-keyboard-tofu',
};

const BLOCK = {
  description:
    'A retro-inspired 98-key mechanical keyboard with dual rotary knobs, tri-mode connectivity, and a gasket-mounted chassis.',
  details: [
    '98 keys plus 13 multifunction keys',
    'Dual rotary knobs for volume and mode control',
    'Tri-mode 2.4 GHz, Bluetooth 5.0, and USB-C connectivity',
    '2,000 mAh battery — up to 80 hours',
    '43 gf linear switches with 3.8 mm total travel',
  ],
  specs: {
    Layout: '98 keys + 13 multifunction keys',
    Connectivity: '2.4 GHz / Bluetooth 5.0 / USB-C',
    Switches: '43 gf linear, 3.8 mm total travel',
    Battery: '2,000 mAh — up to 80 hours',
    Dimensions: '387 × 165 × 40.5 mm',
    TypingAngle: '4° / 8°',
  },
  sourceUrl:
    'https://www.lofree.co/products/lofree-block-wireless-mechanical-keyboard-1',
};

const EDGE = {
  description:
    'An ultra-slim 75% keyboard built from carbon fiber and magnesium alloy, with Bluetooth and wired connectivity and a 130-hour battery.',
  details: [
    '84-key (75%) ultra-slim low-profile layout',
    'Carbon fiber and magnesium alloy construction',
    'Kailh POM 2.0 low-profile switches',
    'Bluetooth and USB-C wired connectivity',
    '2,000 mAh battery — up to 130 hours',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: 'Bluetooth / USB-C wired',
    Switches: 'Kailh POM 2.0 low-profile, 2.4 mm travel',
    Battery: '2,000 mAh — up to 130 hours',
    Dimensions: '318 × 154 × 15 mm',
    Thickness: '5.4 mm ultra-slim',
    Material: 'Carbon fiber and magnesium alloy',
  },
  sourceUrl: 'https://www.lofree.co/products/edge-mechanical-keyboard',
};

const HYzen = {
  description:
    'A 65% mechanical-magnetic keyboard with a CNC-milled aluminum body, TMR magnetic switches, and dual 8,000 Hz wireless readiness.',
  details: [
    '65% layout with 68 keys',
    'CNC-milled aluminum case with 205-mesh sandblasted finish',
    'Lofree × Kailh magnetic TMR switches',
    'Tri-mode 2.4 GHz, Bluetooth, and USB-C connectivity',
    '10,000 mAh battery',
    'Dual-knob control for audio and mode switching',
  ],
  specs: {
    Layout: '68 keys (65%)',
    Connectivity: '2.4 GHz / Bluetooth / USB-C',
    Switches: 'Lofree × Kailh magnetic TMR',
    Battery: '10,000 mAh',
    Wireless: 'Dual 8,000 Hz ready',
    Material: 'CNC-milled aluminum',
  },
  sourceUrl: 'https://www.lofree.co/products/hyzen-mechanical-magnetic-keyboard',
};

const FOUNDATION = {
  description:
    'A 75% mechanical keyboard with hot-swappable Lofree × Gateron Foundation switches, 1,000 Hz polling, and three-mode connectivity.',
  details: [
    '84-key (75%) layout',
    'Lofree × Gateron Foundation linear switches',
    'Hot-swappable switch sockets',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth, and USB-C connectivity',
    'ABS and PC keycaps',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth / USB-C',
    Switches: 'Lofree × Gateron Foundation linear, 55±15 gf',
    Travel: '1.7±0.4 mm pre-travel / 3.2±0.2 mm total',
    Keycaps: 'ABS and PC',
    PollingRate: '1,000 Hz',
  },
  sourceUrl: 'https://www.lofree.co/products/lofree-dot-foundation-mechanical-keyboard',
};

const KEYBOARD_1970S = {
  description:
    'A retro-styled 75% mechanical keyboard with a 1,000 Hz polling rate, white LED lighting, and a substantial steel-and-plastic build.',
  details: [
    '84-key (75%) layout',
    '1,000 Hz polling rate',
    'White LED backlighting (5,000K)',
    'Retro 1970s-inspired industrial design',
    'Tri-mode 2.4 GHz, Bluetooth, and USB-C connectivity',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth / USB-C',
    PollingRate: '1,000 Hz',
    Lighting: 'White LED (5,000K)',
    Dimensions: '325 × 160.5 × 44.4 mm',
    Weight: '972 g',
  },
  sourceUrl: 'https://www.lofree.co/products/1970s-mechanical-keyboard',
};

const POLAR_MOSS = {
  description:
    'A 75% mechanical keyboard with 40 gf linear hot-swappable switches, tri-mode connectivity, and a 1,000 Hz polling rate.',
  details: [
    '84-key (75%) layout',
    '40 gf linear hot-swappable switches',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Switches: '40 gf linear, hot-swappable',
    PollingRate: '1,000 Hz',
  },
  sourceUrl: 'https://www.lofree.co/products/432hz-polar-moss-mechanical-keyboard',
};

const LIPSTICK = {
  description:
    'A 75% gasket-mounted mechanical keyboard with lipstick-inspired dual-color PBT keycaps and tri-mode connectivity.',
  details: [
    '84-key (75%) layout',
    'Gasket-mounted construction',
    'Dual-color PBT keycaps in lipstick-inspired shades',
    '1,000 Hz polling rate',
    'Tri-mode 2.4 GHz, Bluetooth 5.3, and USB-C connectivity',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth 5.3 / USB-C',
    Keycaps: 'Dual-color PBT',
    Mount: 'Gasket mount',
    PollingRate: '1,000 Hz',
    Dimensions: '325 × 160.5 × 44.4 mm',
  },
  sourceUrl: 'https://www.lofree.co/products/lipstick-mechanical-keyboard',
};

const WONDERFREE = {
  description:
    'A portable 75% mechanical keyboard with a suitcase-style magnetic cover, built-in tablet stand, Cherry MX Brown switches, and a 4,000 mAh battery.',
  details: [
    '84-key (75%) layout',
    'Suitcase-style design with magnetic cover and tablet stand',
    'Cherry MX Brown tactile switches',
    '4,000 mAh battery',
    '2.4 GHz, Bluetooth, and USB-C connectivity',
  ],
  specs: {
    Layout: '84 keys (75%)',
    Connectivity: '2.4 GHz / Bluetooth / USB-C',
    Switches: 'Cherry MX Brown tactile',
    Battery: '4,000 mAh',
    Dimensions: '342.5 × 138.5 × 33.7 mm',
  },
  sourceUrl: 'https://www.lofree.co/products/wonderfree-mechanical-keyboard',
};

const SWITCHES = {
  Ghost: {
    description:
      'A low-profile full-POM linear switch with a light 50 gf actuation, 2.8 mm travel, and a 50-million-keystroke lifespan.',
    specs: {
      Type: 'Linear',
      Actuation: '50±15 gf',
      PreTravel: '1.2±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'Full POM',
    },
    sourceUrl: 'https://www.lofree.co/products/lofree-ghost-switches',
  },
  Hades: {
    description:
      'A low-profile full-POM linear switch tuned to 40 gf with 1.3 mm pre-travel and a 50-million-keystroke lifespan.',
    specs: {
      Type: 'Linear',
      Actuation: '40±10 gf',
      PreTravel: '1.3±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'Full POM',
    },
    sourceUrl: 'https://www.lofree.co/products/hades-low-profile-pom-switches',
  },
  Phantom: {
    description:
      'A low-profile tactile POM switch with a 45 gf actuation and a pronounced bump, designed for deliberate typing.',
    specs: {
      Type: 'Tactile',
      Actuation: '45±15 gf',
      PreTravel: '1.6±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'POM',
    },
    sourceUrl: 'https://www.lofree.co/products/lofree-phantom-switches',
  },
  Pulse: {
    description:
      'A low-profile tactile POM switch with a 40 gf actuation and a crisp, rhythmic bump.',
    specs: {
      Type: 'Tactile',
      Actuation: '40±10 gf',
      TotalTravel: '2.8±0.25 mm',
      Material: 'POM',
    },
    sourceUrl:
      'https://lofreekeyboard.com/products/pulse-low-profile-pom-switches',
  },
  Specter: {
    description:
      'A lightweight low-profile POM linear switch with a 40 gf actuation, 1.2 mm pre-travel, and 50-million-keystroke durability.',
    specs: {
      Type: 'Linear',
      Actuation: '40±10 gf',
      PreTravel: '1.2±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'Full POM',
    },
    sourceUrl:
      'https://www.lofree.co/products/specter-low-profile-pom-switches',
  },
  Surfer: {
    description:
      'A smooth low-profile POM linear switch with 40 gf actuation, 1.3 mm pre-travel, and a 50-million-keystroke lifespan.',
    specs: {
      Type: 'Linear',
      Actuation: '40±10 gf',
      PreTravel: '1.3±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'Full POM',
    },
    sourceUrl: 'https://www.lofree.co/products/surfer-low-profile-pom-switches',
  },
  Void: {
    description:
      'A silent low-profile POM linear switch with 40 gf actuation and a 1.3 mm pre-travel, made for quiet shared spaces.',
    specs: {
      Type: 'Silent linear',
      Actuation: '40±10 gf',
      PreTravel: '1.3±0.3 mm',
      TotalTravel: '2.8±0.25 mm',
      Durability: '50 million keystrokes',
      Material: 'Full POM',
    },
    sourceUrl: 'https://www.lofree.co/products/void-low-profile-pom-switches',
  },
};

const KEYBOARDS = [
  { test: /^Lofree Flow Lite 2 100/, data: FLOW_LITE_2_100, mac: true },
  { test: /^Lofree Flow Lite 2 84/, data: FLOW_LITE_2_84, mac: true },
  { test: /^Lofree Flow 2 100/, data: FLOW_2_100, mac: true },
  { test: /^Lofree Flow 2 84/, data: FLOW_2_84, mac: true },
  { test: /^Lofree Flow 2 68/, data: FLOW_2_68, mac: true },
  { test: /^Lofree Flow 84/, data: FLOW_84 },
  { test: /^Lofree Tofu 68/, data: TOFU_68 },
  {
    test: /^Lofree Street Artist 68/,
    data: {
      ...TOFU_68,
      description:
        'A Street Artist-themed edition of the 68-key Lofree Touch mechanical keyboard, combining an 11.5° ergonomic curve with tri-mode connectivity and dye-sublimated PBT keycaps.',
    },
  },
  { test: /^Lofree Block 101/, data: BLOCK },
  { test: /^Lofree Edge Grey/, data: EDGE },
  { test: /^Lofree Hyzen/, data: HYzen },
  { test: /^Lofree Foundation 101/, data: FOUNDATION },
  { test: /^Lofree 1970s Keyboard/, data: KEYBOARD_1970S },
  {
    test: /^Lofree Sugar Color 70s Keyboard/,
    data: {
      ...KEYBOARD_1970S,
      description:
        'A Sugar Color edition of the retro 1970s mechanical keyboard, pairing a 75% layout and 1,000 Hz polling with a candy-toned colorway.',
    },
  },
  { test: /^Lofree 432Hz Polar Moss/, data: POLAR_MOSS },
  { test: /^Lofree Lipstick Keyboard/, data: LIPSTICK },
  { test: /^Lofree Wonderfree Keyboard/, data: WONDERFREE },
];

function themeName(name) {
  return name
    .replace(/^Lofree /, '')
    .replace(/ Keycap Set.*$/, '')
    .replace(/ Keycaps$/, '')
    .replace(/ (68|84|100)$/, '')
    .trim();
}

function keycapDetails(product) {
  const flowSeries = /Flow|(?:84|100) Keycap Set/.test(product.name);
  const isBigLayout = /100|Panda 100/.test(product.name);
  const theme = themeName(product.name) || product.name.replace(/^Lofree /, '');
  const article = /^[aeiou]/i.test(theme) ? 'An' : 'A';

  if (flowSeries) {
    return {
      description: `${article} ${theme} theme keycap set for Lofree Flow and Flow Lite keyboards, made from dye-sublimated PBT in Lofree's 6.3 mm Flow profile.`,
      details: [
        `${isBigLayout ? '100' : '84'}-key layout`,
        'Dye-sublimated PBT construction',
        'Lofree Flow profile (6.3 mm)',
        'Compatible with Lofree Flow and Flow Lite keyboards',
        `${theme} themed legends and colorway`,
      ],
      specs: {
        Compatibility: 'Lofree Flow / Flow Lite series',
        Material: 'PBT',
        Legend: 'Dye-sublimated',
        Profile: 'Lofree Flow — 6.3 mm',
        Layout: isBigLayout ? '100 keys' : '84 keys',
      },
      sourceUrl: 'https://www.lofree.co/products/retrowave',
    };
  }

  return {
    description: `${article} ${theme} theme keycap set for Lofree Touch Series keyboards, made from 1.5 mm dye-sublimated PBT with Lofree's self-developed Touch profile.`,
    details: [
      '68-key layout',
      'Dye-sublimated PBT construction',
      '1.5 mm keycap thickness',
      'Lofree Touch profile',
      'Compatible with Lofree Touch Series keyboards',
      `${theme} themed legends and colorway`,
    ],
    specs: {
      Compatibility: 'Lofree Touch Series',
      Material: 'PBT',
      Thickness: '1.5 mm',
      Legend: 'Dye-sublimated',
      Profile: 'Lofree Touch',
      Layout: '68 keys',
    },
    sourceUrl: 'https://www.lofree.co/products/piggy-is-loving-you',
  };
}

function getProductDetails(product) {
  if (product.category === 'Keyboards') {
    const family = KEYBOARDS.find((entry) => entry.test.test(product.name));
    if (family) {
      const isMac = family.mac && /for Mac/.test(product.name);
      return {
        description: isMac
          ? `${family.data.description} This is the Mac-layout edition.`
          : family.data.description,
        details: family.data.details,
        specs: isMac
          ? { ...family.data.specs, Layout: `${family.data.specs.Layout} — Mac layout` }
          : family.data.specs,
        sourceUrl: family.data.sourceUrl,
      };
    }
  }

  if (product.category === 'Keycaps') {
    return keycapDetails(product);
  }

  if (product.category === 'Switches') {
    const key = Object.keys(SWITCHES).find((name) => product.name.includes(name));
    if (key) {
      const data = SWITCHES[key];
      return {
        description: data.description,
        details: Object.entries(data.specs).map(([label, value]) => `${label}: ${value}`),
        specs: data.specs,
        sourceUrl: data.sourceUrl,
      };
    }
  }

  const isMoru = /Moru/.test(product.name);
  const isTransparent = /Transparent/.test(product.name);

  return {
    description: isMoru
      ? 'A compact Lofree mechanical keyboard with a dark, understated finish and a minimalist desktop-friendly profile.'
      : isTransparent
        ? 'A Lofree mechanical keyboard with a translucent case and keycap treatment that exposes its internal structure.'
        : `A Lofree ${product.category.toLowerCase()} from the ClackLabs collection.`,
    details: [
      isMoru
        ? 'Moru-inspired dark finish'
        : isTransparent
          ? 'Translucent case and keycaps'
          : 'Lofree mechanical keyboard',
      'Mechanical key switches',
      'Desktop-friendly compact design',
    ],
    specs: {},
    sourceUrl: null,
  };
}

module.exports = { getProductDetails };
