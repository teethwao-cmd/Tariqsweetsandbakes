import type {
  Coupon,
  Order,
  Product,
  Review,
  StoreData,
  StoreSettings,
} from '../types.ts';

export const IMAGE_ASSETS = {
  heroSpread: '/src/assets/images/hero_mithai_spread_1794549424843.jpg',
  aboutCraft: '/src/assets/images/about_bakery_craft_clean_1794549447558.jpg',
  gulabJamun: '/src/assets/images/sweet_gulab_jamun_1794549425955.jpg',
  rasMalai: '/src/assets/images/sweet_ras_malai_1794549426807.jpg',
  barfiLaddu: '/src/assets/images/sweet_barfi_laddu_1794549426888.jpg',
  jalebiHalwa: '/src/assets/images/sweet_jalebi_halwa_1794549427306.jpg',
  chocolateCake: '/src/assets/images/bakery_chocolate_cake_1794549427641.jpg',
  birthdayCake: '/src/assets/images/bakery_birthday_cake_1794549428591.jpg',
  donutsBrownies: '/src/assets/images/bakery_donuts_brownies_1794549428576.jpg',
  pastriesCupcakes: '/src/assets/images/bakery_pastries_cupcakes_1794549429429.jpg',
  breadRusk: '/src/assets/images/bakery_bread_rusk_1794549429154.jpg',
  giftHamper: '/src/assets/images/special_gift_hamper_clean_1794549447663.jpg',
} as const;

export const IMAGE_LIBRARY_OPTIONS = [
  { label: 'Gulab Jamun Brass Bowl', url: IMAGE_ASSETS.gulabJamun },
  { label: 'Saffron Ras Malai', url: IMAGE_ASSETS.rasMalai },
  { label: 'Barfi, Laddu & Peda Platter', url: IMAGE_ASSETS.barfiLaddu },
  { label: 'Jalebi & Gajar Halwa', url: IMAGE_ASSETS.jalebiHalwa },
  { label: 'Belgian Chocolate Cake', url: IMAGE_ASSETS.chocolateCake },
  { label: 'Celebration Birthday Cake', url: IMAGE_ASSETS.birthdayCake },
  { label: 'Glazed Donuts & Brownies', url: IMAGE_ASSETS.donutsBrownies },
  { label: 'Cupcakes, Pastries & Cookies', url: IMAGE_ASSETS.pastriesCupcakes },
  { label: 'Artisan Bread, Rusk & Biscuits', url: IMAGE_ASSETS.breadRusk },
  { label: 'Festive Gold Gift Hamper', url: IMAGE_ASSETS.giftHamper },
];

export const INITIAL_SETTINGS: StoreSettings = {
  brandName: 'Tariq Sweets & Bakes',
  whatsappNumber: '923001234567',
  storePhone: '+92 300 1234567',
  storeEmail: 'orders@tariqsweets.pk',
  storeAddress: '48-B Main Boulevard, Gulberg III, Lahore, Pakistan',
  openingHours: 'Daily · 8:00 AM – 11:30 PM',
  deliveryFee: 250,
  freeDeliveryThreshold: 3500,
  promoBanner:
    'Complimentary delivery on orders above PKR 3,500 · Use code SWEET10 for 10% off your order',
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'SWEET10',
    description: '10% off across all Mithai, Cakes & Bakery specialties',
    discountType: 'percent',
    value: 10,
    minOrder: 1000,
    active: true,
  },
  {
    code: 'CELEBRATE500',
    description: 'PKR 500 off celebration orders above PKR 4,000',
    discountType: 'fixed',
    value: 500,
    minOrder: 4000,
    active: true,
  },
  {
    code: 'TARIQ15',
    description: '15% festive savings on orders above PKR 5,000',
    discountType: 'percent',
    value: 15,
    minOrder: 5000,
    active: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // MITHAI (10)
  {
    id: 'ts-gulab-jamun',
    name: 'Gulab Jamun',
    slug: 'gulab-jamun',
    category: 'Mithai',
    description:
      'Melt-in-the-mouth khoya dumplings slow-simmered in warm rosewater, green cardamom, and Kashmiri saffron syrup, finished with crushed Iranian pistachios.',
    craftNote:
      'Prepared fresh every morning in pure desi ghee using slow-reduced buffalo milk khoya.',
    price: 750,
    variants: [
      { label: '500g', price: 750 },
      { label: '1 kg', price: 1450 },
      { label: '2 kg', price: 2800 },
    ],
    image: IMAGE_ASSETS.gulabJamun,
    available: true,
    stock: 45,
    featured: true,
    bestSeller: true,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-ras-malai',
    name: 'Ras Malai',
    slug: 'ras-malai',
    category: 'Mithai',
    description:
      'Feather-light chhena patties steeped in chilled saffron and cardamom reduced milk, garnished with toasted almonds, green pistachios, and dried rose petals.',
    craftNote:
      'Served chilled in leak-proof insulated packaging to preserve creamy richness.',
    price: 900,
    variants: [
      { label: '500g (6 pcs)', price: 900 },
      { label: '1 kg (12 pcs)', price: 1750 },
      { label: 'Party Tray (24 pcs)', price: 3400 },
    ],
    image: IMAGE_ASSETS.rasMalai,
    available: true,
    stock: 30,
    featured: true,
    bestSeller: true,
    unitHint: '6 pcs / 500g',
  },
  {
    id: 'ts-barfi',
    name: 'Pistachio Barfi',
    slug: 'barfi',
    category: 'Mithai',
    description:
      'Velvety slow-cooked milk fudge delicately scented with freshly ground cardamom, topped with roasted green pistachios and edible pure silver varq.',
    craftNote:
      'Signature Lahore-style dense creamy texture with balanced natural sweetness.',
    price: 850,
    variants: [
      { label: '500g', price: 850 },
      { label: '1 kg', price: 1650 },
      { label: '2 kg', price: 3200 },
    ],
    image: IMAGE_ASSETS.barfiLaddu,
    available: true,
    stock: 38,
    featured: true,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-laddu',
    name: 'Motichoor Laddu',
    slug: 'laddu',
    category: 'Mithai',
    description:
      'Golden pearls of gram flour fried in pure clarified butter, infused with saffron nectar and folded with crunchy melon seeds and pistachio slivers.',
    craftNote:
      'Hand-rolled in small batches for weddings, niaz, and festive milestones.',
    price: 700,
    variants: [
      { label: '500g', price: 700 },
      { label: '1 kg', price: 1350 },
      { label: '2 kg', price: 2600 },
    ],
    image: IMAGE_ASSETS.barfiLaddu,
    available: true,
    stock: 52,
    featured: false,
    bestSeller: true,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-jalebi',
    name: 'Saffron Jalebi',
    slug: 'jalebi',
    category: 'Mithai',
    description:
      'Crisp, lacy golden spirals piped live into bubbling desi ghee and dipped instantaneously into fragrant saffron-cardamom sugar syrup.',
    craftNote:
      'Fermented naturally for 14 hours for authentic tang and crackling crunch.',
    price: 600,
    variants: [
      { label: '500g', price: 600 },
      { label: '1 kg', price: 1150 },
      { label: '2 kg', price: 2200 },
    ],
    image: IMAGE_ASSETS.jalebiHalwa,
    available: true,
    stock: 40,
    featured: false,
    bestSeller: true,
    unitHint: 'Made hot daily',
  },
  {
    id: 'ts-cham-cham',
    name: 'Cham Cham',
    slug: 'cham-cham',
    category: 'Mithai',
    description:
      'Juicy oval cottage-cheese delicacies gently poached in light rose syrup, slit and filled with rich malai cream and rolled in desiccated coconut.',
    craftNote: 'Delicate floral finish crafted without artificial preservatives.',
    price: 820,
    variants: [
      { label: '500g', price: 820 },
      { label: '1 kg', price: 1600 },
    ],
    image: IMAGE_ASSETS.rasMalai,
    available: true,
    stock: 22,
    featured: false,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-kalakand',
    name: 'Kalakand',
    slug: 'kalakand',
    category: 'Mithai',
    description:
      'Moist, caramelized granular milk cake simmered for hours in heavy iron karahis and crowned with crushed almonds and silver leaf.',
    craftNote:
      'Rich caramelized milk notes with a signature soft, crumbly bite.',
    price: 880,
    variants: [
      { label: '500g', price: 880 },
      { label: '1 kg', price: 1700 },
      { label: '2 kg', price: 3300 },
    ],
    image: IMAGE_ASSETS.barfiLaddu,
    available: true,
    stock: 25,
    featured: false,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-peda',
    name: 'Saffron Peda',
    slug: 'peda',
    category: 'Mithai',
    description:
      'Traditional hand-pressed khoya medallions infused with genuine saffron threads, nutmeg, and cardamom, embossed with crushed pistachios.',
    craftNote: 'Soft, aromatic, and ideal for gifting or evening chai.',
    price: 800,
    variants: [
      { label: '500g', price: 800 },
      { label: '1 kg', price: 1550 },
    ],
    image: IMAGE_ASSETS.barfiLaddu,
    available: true,
    stock: 28,
    featured: false,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },
  {
    id: 'ts-soan-papdi',
    name: 'Flaky Soan Papdi',
    slug: 'soan-papdi',
    category: 'Mithai',
    description:
      'Gossamer-thin, melt-away spun sugar and gram flour layers perfumed with green cardamom and topped with roasted almonds and pistachios.',
    craftNote:
      'Hand-pulled to achieve feather-light golden strands that dissolve on the tongue.',
    price: 680,
    variants: [
      { label: '500g Box', price: 680 },
      { label: '1 kg Box', price: 1300 },
    ],
    image: IMAGE_ASSETS.giftHamper,
    available: true,
    stock: 34,
    featured: false,
    bestSeller: false,
    unitHint: 'Sealed gift box',
  },
  {
    id: 'ts-gajar-halwa',
    name: 'Gajar Halwa',
    slug: 'gajar-halwa',
    category: 'Mithai',
    description:
      'Ruby-red winter carrots slow-braised in full-cream milk and pure desi ghee, folded generously with house-made khoya, cashews, and almonds.',
    craftNote: 'Slow-cooked for four hours until deeply aromatic and glossy.',
    price: 950,
    variants: [
      { label: '500g', price: 950 },
      { label: '1 kg', price: 1850 },
      { label: '2 kg Family Pack', price: 3600 },
    ],
    image: IMAGE_ASSETS.jalebiHalwa,
    available: true,
    stock: 20,
    featured: true,
    bestSeller: false,
    unitHint: 'Served warm',
  },

  // CAKES (2)
  {
    id: 'bk-birthday-cakes',
    name: 'Birthday Cakes',
    slug: 'birthday-cakes',
    category: 'Cakes',
    description:
      'Three-layer vanilla bean and salted caramel sponge frosted in silky Swiss meringue buttercream, garnished with toasted almonds and golden caramel drip.',
    craftNote:
      'Includes complimentary dark chocolate plaque with your custom birthday message.',
    price: 2600,
    variants: [
      { label: '2 lb', price: 2600 },
      { label: '3 lb', price: 3800 },
      { label: '4 lb Double Tier', price: 5200 },
    ],
    image: IMAGE_ASSETS.birthdayCake,
    available: true,
    stock: 15,
    featured: true,
    bestSeller: true,
    unitHint: 'Custom inscription included',
  },
  {
    id: 'bk-chocolate-cakes',
    name: 'Belgian Chocolate Cakes',
    slug: 'chocolate-cakes',
    category: 'Cakes',
    description:
      'Moist single-origin dark cocoa sponge layered with glossy 70% Belgian dark chocolate fudge ganache and hand-shaved chocolate curls.',
    craftNote:
      'Baked in small batches with pure Dutch-process cocoa and espresso glaze.',
    price: 2400,
    variants: [
      { label: '2 lb', price: 2400 },
      { label: '3 lb', price: 3500 },
      { label: '4 lb', price: 4600 },
    ],
    image: IMAGE_ASSETS.chocolateCake,
    available: true,
    stock: 18,
    featured: true,
    bestSeller: true,
    unitHint: 'Starts at 2 lb',
  },

  // PASTRIES (2)
  {
    id: 'bk-pastries',
    name: 'French Pastries & Slices',
    slug: 'pastries',
    category: 'Pastries',
    description:
      'Flaky laminated butter croissants, fruit danishes, and layered truffle cream pastry slices baked golden twice daily.',
    craftNote:
      'Laminated with pure dairy butter for crisp honeycombed layers.',
    price: 1050,
    variants: [
      { label: 'Box of 4', price: 1050 },
      { label: 'Box of 8', price: 2000 },
    ],
    image: IMAGE_ASSETS.pastriesCupcakes,
    available: true,
    stock: 26,
    featured: false,
    bestSeller: false,
    unitHint: 'Box of 4 or 8',
  },
  {
    id: 'bk-bread',
    name: 'Artisan Milk Bread & Brioche',
    slug: 'bread',
    category: 'Pastries',
    description:
      'Soft, golden-crusted brioche milk loaves and hearty multigrain loaves pulled warm from our stone deck ovens every morning.',
    craftNote:
      'Zero improvers or bleaches—just flour, farm milk, butter, and patience.',
    price: 320,
    variants: [
      { label: 'Large Loaf (700g)', price: 320 },
      { label: 'Twin Pack (2 Loaves)', price: 600 },
    ],
    image: IMAGE_ASSETS.breadRusk,
    available: true,
    stock: 40,
    featured: false,
    bestSeller: false,
    unitHint: 'Baked fresh morning & evening',
  },

  // BISCUITS (2)
  {
    id: 'bk-biscuits',
    name: 'Zeera & Cardamom Biscuits',
    slug: 'biscuits',
    category: 'Biscuits',
    description:
      'Crisp, buttery Pakistani bakery biscuits in classic roasted cumin (zeera), green cardamom, and almond crunch varieties.',
    craftNote:
      'The essential companion to afternoon doodh patti and Kashmiri chai.',
    price: 550,
    variants: [
      { label: '500g Tin', price: 550 },
      { label: '1 kg Tin', price: 1050 },
    ],
    image: IMAGE_ASSETS.breadRusk,
    available: true,
    stock: 60,
    featured: false,
    bestSeller: false,
    unitHint: 'Airtight tin',
  },
  {
    id: 'bk-rusk',
    name: 'Crispy Cake Rusk',
    slug: 'rusk',
    category: 'Biscuits',
    description:
      'Twice-baked golden sponge cake rusks delicately scented with cardamom and vanilla, offering the perfect crunch for tea dunking.',
    craftNote: 'Made from whole fresh eggs and real butter sponge.',
    price: 580,
    variants: [
      { label: '500g Pack', price: 580 },
      { label: '1 kg Family Pack', price: 1100 },
    ],
    image: IMAGE_ASSETS.breadRusk,
    available: true,
    stock: 55,
    featured: false,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },

  // COOKIES (1)
  {
    id: 'bk-cookies',
    name: 'Butter & Almond Cookies',
    slug: 'cookies',
    category: 'Cookies',
    description:
      'Golden shortbread butter cookies, pistachio nan khatai, and toasted almond rounds baked to a delicate, sandy snap.',
    craftNote: 'Crafted with cultured butter and whole-nut flour.',
    price: 650,
    variants: [
      { label: '500g Box', price: 650 },
      { label: '1 kg Box', price: 1250 },
    ],
    image: IMAGE_ASSETS.pastriesCupcakes,
    available: true,
    stock: 42,
    featured: false,
    bestSeller: false,
    unitHint: 'Starts at 500g',
  },

  // DONUTS (1)
  {
    id: 'bk-donuts',
    name: 'Glazed Donuts',
    slug: 'donuts',
    category: 'Donuts',
    description:
      'Pillow-soft brioche-style ring donuts dipped in dark chocolate ganache, crushed pistachios, and warm vanilla bean glaze.',
    craftNote: 'Proofed slowly for an airy crumb that stays fresh all day.',
    price: 960,
    variants: [
      { label: 'Box of 6', price: 960 },
      { label: 'Box of 12', price: 1850 },
    ],
    image: IMAGE_ASSETS.donutsBrownies,
    available: true,
    stock: 30,
    featured: false,
    bestSeller: true,
    unitHint: 'Box of 6 or 12',
  },

  // CUPCAKES (1)
  {
    id: 'bk-cupcakes',
    name: 'Artisan Cupcakes',
    slug: 'cupcakes',
    category: 'Cupcakes',
    description:
      'Assorted Madagascar vanilla, Belgian fudge, and salted caramel cupcakes crowned with generous whipped buttercream swirls.',
    craftNote:
      'Hand-piped every morning for birthdays, office treats, and tea gatherings.',
    price: 1200,
    variants: [
      { label: 'Box of 6', price: 1200 },
      { label: 'Box of 12', price: 2300 },
    ],
    image: IMAGE_ASSETS.pastriesCupcakes,
    available: true,
    stock: 28,
    featured: false,
    bestSeller: false,
    unitHint: 'Box of 6 or 12',
  },

  // CHOCOLATES (2)
  {
    id: 'bk-brownies',
    name: 'Fudge Walnut Brownies',
    slug: 'brownies',
    category: 'Chocolates',
    description:
      'Crackly-top dark chocolate brownies studded with roasted Kashmiri walnuts and melted bittersweet chocolate chunks.',
    craftNote:
      'Rich, dense, and baked with real butter—never vegetable shortening.',
    price: 1100,
    variants: [
      { label: 'Box of 6', price: 1100 },
      { label: 'Box of 12', price: 2100 },
    ],
    image: IMAGE_ASSETS.donutsBrownies,
    available: true,
    stock: 32,
    featured: false,
    bestSeller: false,
    unitHint: 'Box of 6 or 12',
  },
  {
    id: 'ch-pistachio-truffles',
    name: 'Pistachio Praline Chocolates',
    slug: 'pistachio-truffles',
    category: 'Chocolates',
    description:
      'Hand-tempered dark and milk chocolate bonbons filled with roasted Iranian pistachio praline, saffron caramel, and hazelnut gianduja.',
    craftNote: 'Presented in a gold-lined confection box for effortless gifting.',
    price: 1550,
    variants: [
      { label: 'Box of 12', price: 1550 },
      { label: 'Box of 24', price: 2950 },
    ],
    image: IMAGE_ASSETS.donutsBrownies,
    available: true,
    stock: 24,
    featured: false,
    bestSeller: false,
    unitHint: 'Artisan bonbon box',
  },

  // GIFT BOXES (3)
  {
    id: 'sp-gift-boxes',
    name: 'Signature Gift Boxes',
    slug: 'gift-boxes',
    category: 'Gift Boxes',
    description:
      'Embossed ivory and gold presentation box curated with pistachio barfi, motichoor laddu, dry-fruit bites, and almond butter cookies.',
    craftNote: 'Finished with satin ribbon and customizable greeting card.',
    price: 2200,
    variants: [
      { label: '1 kg Keepsake Box', price: 2200 },
      { label: '2 kg Grand Box', price: 4200 },
    ],
    image: IMAGE_ASSETS.giftHamper,
    available: true,
    stock: 35,
    featured: true,
    bestSeller: true,
    unitHint: 'Ribbon-tied keepsake box',
  },
  {
    id: 'sp-sweet-hampers',
    name: 'Luxury Sweet Hampers',
    slug: 'sweet-hampers',
    category: 'Gift Boxes',
    description:
      'Bespoke celebration hamper uniting a 1.5 kg mithai assortment, saffron peda tin, Belgian chocolate brownies, and spiced tea biscuits.',
    craftNote:
      'Curated for Eid gifting, corporate appreciation, and family visits.',
    price: 4500,
    variants: [
      { label: 'Classic Hamper', price: 4500 },
      { label: 'Royal Executive Hamper', price: 7800 },
    ],
    image: IMAGE_ASSETS.giftHamper,
    available: true,
    stock: 18,
    featured: false,
    bestSeller: false,
    unitHint: 'Complete gift basket',
  },
  {
    id: 'sp-wedding-boxes',
    name: 'Wedding Bhaji Boxes',
    slug: 'wedding-boxes',
    category: 'Gift Boxes',
    description:
      'Traditional Nikkah, Mehndi, and Walima mithai favor boxes crafted with royal pistachio barfi, saffron laddu, and silver-leafed patisa.',
    craftNote:
      'Custom gold-foil monogram tags available for bulk wedding orders.',
    price: 1950,
    variants: [
      { label: '1 kg Box (Single)', price: 1950 },
      { label: 'Set of 10 Boxes', price: 18500 },
      { label: 'Set of 25 Boxes', price: 44500 },
    ],
    image: IMAGE_ASSETS.giftHamper,
    available: true,
    stock: 40,
    featured: false,
    bestSeller: false,
    unitHint: 'Single or bulk sets',
  },

  // SPECIAL ORDERS (3)
  {
    id: 'sp-customized-cakes',
    name: 'Customized Celebration Cakes',
    slug: 'customized-cakes',
    category: 'Special Orders',
    description:
      'Hand-crafted multi-tier cakes tailored for weddings, engagements, and milestone birthdays—add your theme, flavor, and inscription in order notes.',
    craftNote:
      'Available in Belgian Chocolate, Lotus Caramel, Red Velvet, and Pistachio Rose.',
    price: 4200,
    variants: [
      { label: '3 lb Custom Design', price: 4200 },
      { label: '5 lb Two-Tier', price: 7200 },
      { label: '8 lb Grand Tiered', price: 11800 },
    ],
    image: IMAGE_ASSETS.birthdayCake,
    available: true,
    stock: 12,
    featured: false,
    bestSeller: false,
    unitHint: 'Tailored to your note',
  },
  {
    id: 'sp-party-platters',
    name: 'Grand Party Platters',
    slug: 'party-platters',
    category: 'Special Orders',
    description:
      'Ready-to-serve dessert grazing platter featuring warm gulab jamun, glazed donuts, walnut brownies, cupcakes, and crispy pastries.',
    craftNote: 'Designed to delight 12 to 25 guests effortlessly.',
    price: 3600,
    variants: [
      { label: 'Serves 12–15', price: 3600 },
      { label: 'Serves 20–25', price: 5800 },
    ],
    image: IMAGE_ASSETS.heroSpread,
    available: true,
    stock: 16,
    featured: false,
    bestSeller: false,
    unitHint: 'Ready to serve',
  },
  {
    id: 'sp-seasonal-specials',
    name: 'Seasonal Artisanal Specials',
    slug: 'seasonal-specials',
    category: 'Special Orders',
    description:
      'Limited-edition seasonal collection featuring winter dry-fruit panjiri, saffron gajar halwa, and Eid-special sheer khurma dry kits.',
    craftNote:
      'Small-batch festive recipes available while seasonal ingredients are at peak.',
    price: 1650,
    variants: [
      { label: '750g Festive Jar', price: 1650 },
      { label: '1.5 kg Gift Tin', price: 3100 },
    ],
    image: IMAGE_ASSETS.jalebiHalwa,
    available: true,
    stock: 20,
    featured: false,
    bestSeller: false,
    unitHint: 'Limited seasonal batch',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'TSB-1041',
    customerName: 'Ayesha Siddiqui',
    phone: '+92 321 4458910',
    address: 'House 14, Street 6, DHA Phase 5, Lahore',
    notes: 'Please pack Gulab Jamun warm separately.',
    fulfillmentType: 'Delivery',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        productId: 'ts-gulab-jamun',
        name: 'Gulab Jamun',
        variantLabel: '1 kg',
        unitPrice: 1450,
        quantity: 1,
        lineTotal: 1450,
      },
      {
        productId: 'sp-gift-boxes',
        name: 'Signature Gift Boxes',
        variantLabel: '1 kg Keepsake Box',
        unitPrice: 2200,
        quantity: 1,
        lineTotal: 2200,
      },
    ],
    subtotal: 3650,
    discountAmount: 0,
    deliveryFee: 0,
    total: 3650,
    status: 'Delivered',
    createdAt: '2026-11-11T16:20:00.000Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 'TSB-1042',
    customerName: 'Hamza Tariq Mehmood',
    phone: '+92 333 9182736',
    address: 'Apartment 4B, Askari XI, Lahore',
    notes: 'Write "Happy Anniversary Ammi & Abbu" on the cake.',
    fulfillmentType: 'Delivery',
    paymentMethod: 'WhatsApp Order (COD)',
    items: [
      {
        productId: 'bk-chocolate-cakes',
        name: 'Belgian Chocolate Cakes',
        variantLabel: '2 lb',
        unitPrice: 2400,
        quantity: 1,
        lineTotal: 2400,
      },
      {
        productId: 'ts-ras-malai',
        name: 'Ras Malai',
        variantLabel: '500g (6 pcs)',
        unitPrice: 900,
        quantity: 1,
        lineTotal: 900,
      },
    ],
    subtotal: 3300,
    discountCode: 'SWEET10',
    discountAmount: 330,
    deliveryFee: 250,
    total: 3220,
    status: 'Preparing',
    createdAt: '2026-11-12T18:45:00.000Z',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Zainab Farooq',
    location: 'Gulberg, Lahore',
    occasion: 'Family Wedding',
    rating: 5,
    quote:
      'We ordered 40 Bhaji Gift Boxes for my sister’s Nikkah. Every box arrived ribbon-tied, warm-scented with cardamom, and our guests asked for Tariq Sweets all evening.',
    createdAt: '2026-11-02T12:00:00.000Z',
  },
  {
    id: 'rev-2',
    name: 'Bilal Qureshi',
    location: 'DHA Phase 6, Lahore',
    occasion: 'Birthday Celebration',
    rating: 5,
    quote:
      'Their Belgian Chocolate Cake rivals international patisseries while the saffron Ras Malai tastes just like homemade heritage mithai. WhatsApp confirmation took thirty seconds.',
    createdAt: '2026-11-06T15:30:00.000Z',
  },
  {
    id: 'rev-3',
    name: 'Dr. Sadia Mahmood',
    location: 'Model Town, Lahore',
    occasion: 'Weekend Tea & Eid',
    rating: 5,
    quote:
      'The cake rusk and zeera biscuits are a Sunday staple in our home. Always crisp, pure butter aroma, and reliably delivered right on time.',
    createdAt: '2026-11-09T10:15:00.000Z',
  },
];

export function createSeedData(): StoreData {
  return {
    products: INITIAL_PRODUCTS,
    coupons: INITIAL_COUPONS,
    orders: INITIAL_ORDERS,
    reviews: INITIAL_REVIEWS,
    customInquiries: [],
    settings: INITIAL_SETTINGS,
  };
}
