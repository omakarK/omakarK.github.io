/**
 * Handcrafted Wooden Toys Catalog Data
 * 100% Solid Hardwoods - Sustainable, Heirloom Grade, Non-Toxic
 */

const WOODEN_PRODUCTS = [
  {
    id: 'toy-rocking-horse',
    name: 'The Heirloom Oak Rocking Horse',
    subtitle: 'Classic American White Oak & Black Walnut Rockers',
    category: 'heirloom',
    categoryLabel: 'Heirloom Nursery',
    price: 189.00,
    originalPrice: 220.00,
    rating: 4.98,
    reviewsCount: 142,
    badge: 'Artisan Masterpiece',
    woodType: 'White Oak & Smoked Walnut',
    finish: 'Organic Beeswax & Cold-Pressed Linseed',
    dimensions: '82cm × 34cm × 56cm',
    weight: '5.8 kg',
    recommendedAge: '18 Months - 6 Years',
    inStock: 14,
    leadTime: 'Handcrafted in 2-3 days',
    image: 'assets/images/toy-rocking-horse.jpg',
    fallbackSvg: 'horse',
    description: 'Carved from century-old sustainably managed white oak with contrasting black walnut rockers. Features ergonomically rounded grip handles, zero nails, and a velvet-smooth hand-buffed finish that invites touch.',
    features: [
      'Zero metal fasteners or artificial glues - pure interlocking dowels',
      'Safety anti-tip curved rocking runners designed for gentle momentum',
      'Naturally antimicrobial and hypoallergenic solid wood grain',
      'Complies with ASTM-F963 & EN-71 child safety standards'
    ],
    reviews: [
      { author: 'Eleanor Vance', date: '2 days ago', rating: 5, comment: 'An absolute work of art. My 2-year-old daughter rides it daily, and it looks like a museum sculpture in our living room.' },
      { author: 'Marcus Sterling', date: '1 week ago', rating: 5, comment: 'The oak grain is deeply tactile. You can smell the real honeyed beeswax. Generation-lasting quality.' }
    ]
  },
  {
    id: 'toy-train',
    name: 'Grand Alpine Express Locomotive',
    subtitle: '5-Piece Articulated Magnetic Timber Train',
    category: 'vehicles',
    categoryLabel: 'Vehicles & Locomotives',
    price: 94.00,
    originalPrice: 110.00,
    rating: 4.95,
    reviewsCount: 98,
    badge: 'Bestseller',
    woodType: 'Hard Rock Maple & Black Cherry',
    finish: 'Pure Jojoba Oil & Carnauba Wax',
    dimensions: '58cm total length (4 carriages + engine)',
    weight: '1.4 kg',
    recommendedAge: '2 - 8 Years',
    inStock: 22,
    leadTime: 'Ready to ship',
    image: 'assets/images/toy-train.jpg',
    fallbackSvg: 'train',
    description: 'A tribute to Golden Age rail travel. Each carriage is turned and chamfered from solid maple with embedded child-safe countersunk neodymium magnetic couplers.',
    features: [
      'Whisper-quiet wooden wheels with natural rubber dampening O-rings',
      'Compatible with standard wooden track gauge systems worldwide',
      'Carriages include removable miniature wooden cargo barrels and logs',
      'Individually numbered certificate of artisan origin under the engine'
    ],
    reviews: [
      { author: 'David K.', date: '3 days ago', rating: 5, comment: 'My grandson carried this everywhere all weekend. The magnetic click is deeply satisfying.' }
    ]
  },
  {
    id: 'toy-montessori-blocks',
    name: 'Montessori Organic Arch Rainbow & Balancing Stones',
    subtitle: '12-Tier Steam-Bent Beech & 16 Faceted River Stones',
    category: 'montessori',
    categoryLabel: 'Montessori & Sensory',
    price: 88.00,
    originalPrice: 105.00,
    rating: 5.0,
    reviewsCount: 215,
    badge: 'Educator Choice',
    woodType: 'European Beechwood',
    finish: 'Natural Plant-Based Pigments & Beeswax',
    dimensions: '38cm × 19cm × 7cm (Rainbow Arch Base)',
    weight: '2.1 kg',
    recommendedAge: '12 Months - 7 Years',
    inStock: 35,
    leadTime: 'Ready to ship',
    image: 'assets/images/toy-montessori-blocks.jpg',
    fallbackSvg: 'rainbow',
    description: 'Handcrafted from single-origin European beechwood using traditional steam-bending. Designed by Montessori educators to foster open-ended spatial awareness, architectural balance, and fine motor skills.',
    features: [
      '12 nesting arches steam-bent with zero toxic resins',
      '16 asymmetrical balancing stones inspired by Japanese Tumi Ishi',
      'Velvety matte grip finish ensures stacked arches don’t slide abruptly',
      'Encourages divergent problem solving and open-ended imaginary play'
    ],
    reviews: [
      { author: 'Sarah Jenkins, Montessori Guide', date: 'Yesterday', rating: 5, comment: 'We replaced plastic sensory toys in our classroom with this set. The children spend hours testing different cantilever balances.' }
    ]
  },
  {
    id: 'toy-vintage-car',
    name: '1932 Classic Roadster Speedster',
    subtitle: 'Sculpted African Mahogany & White Ash Spoke Wheels',
    category: 'vehicles',
    categoryLabel: 'Vehicles & Locomotives',
    price: 76.00,
    originalPrice: 90.00,
    rating: 4.92,
    reviewsCount: 84,
    badge: 'Artisan Pick',
    woodType: 'Mahogany & White Ash',
    finish: 'Hand-buffed Organic Walnut Oil',
    dimensions: '26cm × 11cm × 9cm',
    weight: '0.85 kg',
    recommendedAge: '2+ Years',
    inStock: 18,
    leadTime: 'Ready to ship',
    image: 'assets/images/toy-vintage-car.jpg',
    fallbackSvg: 'car',
    description: 'Inspired by early 20th-century open-top racers. Contoured with aerodynamic boat-tail curves from dense mahogany, featuring free-spinning spoke wheels on solid hardwood axles.',
    features: [
      'Ergonomic hand-grip cockpit sculpted for small hands to grasp securely',
      'Weighted center of gravity ensures thrilling roll-distance across hardwood floors',
      'Zero battery, zero electronics - 100% human-powered velocity'
    ],
    reviews: [
      { author: 'Julian Bell', date: '2 weeks ago', rating: 5, comment: 'Feels substantial and heavy in the best way. My boy rolls it across the whole living room.' }
    ]
  },
  {
    id: 'toy-xylophone',
    name: 'Harmonic Rosewood Pentatonic Chime',
    subtitle: '8 Precision-Tuned Tonewood Bars & Dual Maple Mallets',
    category: 'musical',
    categoryLabel: 'Musical Woodcraft',
    price: 92.00,
    originalPrice: 115.00,
    rating: 4.97,
    reviewsCount: 76,
    badge: 'Harmonic Sound',
    woodType: 'Honduran Rosewood Tonebars & Birch Soundbox',
    finish: 'Resonator Shellac & Beeswax',
    dimensions: '34cm × 22cm × 8cm',
    weight: '1.2 kg',
    recommendedAge: '18 Months+',
    inStock: 12,
    leadTime: 'Hand-tuned in 1 day',
    image: 'assets/images/toy-train.jpg', // or dedicated image
    fallbackSvg: 'music',
    description: 'Tuned to the universal pentatonic scale (C-D-E-G-A), ensuring that every strike produces a naturally soothing, consonant harmony. Free from harsh metallic overtones.',
    features: [
      'Hand-tuned to 432Hz calming organic resonance',
      'Pure natural vibration pads beneath each bar for pure acoustic sustain',
      'Includes two ergonomic spherical-head hard maple mallets',
      'Zero sharp corners or loose resonance pins'
    ],
    reviews: [
      { author: 'Clara Miller', date: '5 days ago', rating: 5, comment: 'The tone is soothing and peaceful, not annoying like plastic musical toys! Even as parents we love hearing it.' }
    ]
  },
  {
    id: 'toy-pull-elephant',
    name: 'Artisan Pull-Along Timber Elephant',
    subtitle: 'Articulated Jointed Trunk & Natural Cotton Rope',
    category: 'heirloom',
    categoryLabel: 'Heirloom Nursery',
    price: 64.00,
    originalPrice: 75.00,
    rating: 4.89,
    reviewsCount: 63,
    badge: 'Toddler Favorite',
    woodType: 'Solid English Walnut & Sycamore',
    finish: 'Food-Safe Jojoba Wax',
    dimensions: '22cm × 18cm × 10cm',
    weight: '0.7 kg',
    recommendedAge: '12 Months - 4 Years',
    inStock: 25,
    leadTime: 'Ready to ship',
    image: 'assets/images/toy-rocking-horse.jpg',
    fallbackSvg: 'elephant',
    description: 'A charming companion for first steps. As your toddler walks, the offset eccentric cam axles give the elephant a gentle, rhythmic undulating walk while its articulated wooden trunk bobs happily.',
    features: [
      '100% unbleached organic cotton braided pull rope with wooden safety ball',
      'Offset wooden wheel cams create lifelike bobbing gait',
      'Food-grade safe for teething gums'
    ],
    reviews: [
      { author: 'Sophie Laurent', date: '1 week ago', rating: 5, comment: 'Helped my little boy gain confidence learning to walk. He holds the cord everywhere.' }
    ]
  },
  {
    id: 'toy-dollhouse',
    name: 'Nordic Modular Timber Manor',
    subtitle: '3-Story Open Architecture with 18 Wooden Furniture Pieces',
    category: 'puzzles',
    categoryLabel: 'Puzzles & Playsets',
    price: 240.00,
    originalPrice: 280.00,
    rating: 4.99,
    reviewsCount: 110,
    badge: 'Heirloom Grade',
    woodType: 'Solid Baltic Birch & Natural Pine',
    finish: 'Silk-touch Non-Toxic Carnauba',
    dimensions: '65cm × 48cm × 70cm',
    weight: '7.2 kg',
    recommendedAge: '3 - 10 Years',
    inStock: 8,
    leadTime: 'Handcrafted in 3 days',
    image: 'assets/images/hero-wooden-toys.jpg',
    fallbackSvg: 'house',
    description: 'An architectural heirloom designed for open 360-degree play. Features movable staircases, sliding timber partitions, skylights, and miniature wooden furniture carved from single blocks of wood.',
    features: [
      'Tool-free interlocking mortise & tenon assembly in under 5 minutes',
      'Includes dining set, miniature timber cradle, clawfoot bath, and sofa',
      'Wide open windows capture soft daylight from all angles'
    ],
    reviews: [
      { author: 'Hannah & Robert', date: '4 days ago', rating: 5, comment: 'The craft on this dollhouse made my wife cry with joy on Christmas morning. Truly magnificent.' }
    ]
  },
  {
    id: 'toy-kinetic-run',
    name: 'Archimedes Kinetic Wooden Gravity Run',
    subtitle: '48 Modular Interlocking Hardwood Chutes & 12 Wooden Spheres',
    category: 'puzzles',
    categoryLabel: 'Puzzles & Playsets',
    price: 135.00,
    originalPrice: 155.00,
    rating: 4.96,
    reviewsCount: 88,
    badge: 'STEM Certified',
    woodType: 'Precision German Beechwood',
    finish: 'Pure Beeswax Polish',
    dimensions: 'Infinite modular configurations',
    weight: '3.4 kg',
    recommendedAge: '4 - 12 Years',
    inStock: 19,
    leadTime: 'Ready to ship',
    image: 'assets/images/toy-montessori-blocks.jpg',
    fallbackSvg: 'run',
    description: 'Physics meets master carpentry. Precision CNC-carved spirals, xylophone chime bells, and velocity ramps that teach kinetic momentum, gravity, and trial-and-error engineering.',
    features: [
      'Zero plastic chutes - 100% solid beechwood grooves',
      'Includes acoustic tuned chime bell that sounds when sphere passes',
      'Infinite expandable designs with stable interlocking tenon pins'
    ],
    reviews: [
      { author: 'Dr. Gregory Hall', date: '3 weeks ago', rating: 5, comment: 'Best screen-free toy our family has ever purchased. Captivates adults and children alike.' }
    ]
  }
];

// Wood species educational database for interactive explorer
const WOOD_SPECIES_DATA = {
  oak: {
    name: 'American White Oak',
    botanical: 'Quercus alba',
    origin: 'Appalachian Sustainable Certified Forests',
    jankaHardness: '1,360 lbf (Exceptional Durability)',
    grainCharacter: 'Prominent, warm golden rays with deep tactile rings',
    bestFor: 'Heirloom Rocking Horses & Structural Furniture',
    scent: 'Warm, rich earthy woodland bouquet',
    colorHex: '#D8AB6F',
    quote: 'Oak has guarded ships and castles for millennia. In a child’s toy, it withstands decades of active play without splintering.',
    ecoRating: '100% FSC® Certified Fallen & Managed Harvest'
  },
  walnut: {
    name: 'American Black Walnut',
    botanical: 'Juglans nigra',
    origin: 'Midwestern River Valleys, USA',
    jankaHardness: '1,010 lbf (Dense & Velvety)',
    grainCharacter: 'Deep espresso to chocolate swirl with lustrous satiny sheen',
    bestFor: 'Accent trims, heirloom contrast details, classic roadsters',
    scent: 'Rich, subtle nutty warmth',
    colorHex: '#523420',
    quote: 'Prized for its natural deep chocolate coloration—requiring zero artificial chemical stains or synthetic dyes.',
    ecoRating: 'Regenerative Replanting Ratio 3:1'
  },
  maple: {
    name: 'Hard Rock Sugar Maple',
    botanical: 'Acer saccharum',
    origin: 'New England Hardwood Ridges',
    jankaHardness: '1,450 lbf (Ultra-Dense Impact Resistance)',
    grainCharacter: 'Silky cream with closed pores, ultra-smooth satin surface',
    bestFor: 'Teething rings, stacking blocks, locomotive wheels',
    scent: 'Sweet, gentle organic maple sap note',
    colorHex: '#EED9B3',
    quote: 'Because its pores are microscopic, it will never shed splinters—making it the safest tonewood for baby teething.',
    ecoRating: 'Sustainably Managed Forest Heritage'
  },
  beech: {
    name: 'European Mountain Beech',
    botanical: 'Fagus sylvatica',
    origin: 'Bavarian Alps, Germany',
    jankaHardness: '1,300 lbf (Shock Absorbing & Flexible)',
    grainCharacter: 'Pale honey with distinctive tiny flecked pores',
    bestFor: 'Steam-bent Montessori arches, balancing pebbles',
    scent: 'Clean, light alpine forest fragrance',
    colorHex: '#E3C193',
    quote: 'The ultimate wood for steam-bending curves without breaking. Bends gracefully under steam, sets rock-hard for life.',
    ecoRating: 'PEFC Certified Sustainable Timber'
  }
};
