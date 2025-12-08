const products = [
  {
    name: 'Apple Shimla 1kg',
    category: 'fruits',
    subcategory: 'apple',
    score: 0,
    price: 120,
    description: 'Crisp and sweet Shimla apples packed with freshness and natural nutrition.',
    inStock: true,
    quantity: 40,
    tags: ['apple', 'fruit', 'fresh'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761933789/apples-101-about-1440x810_biivub.webp',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761933958/Apples_etgoob.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Tomatoes 1kg',
    category: 'vegetables',
    subcategory: 'tomato',
    score: 0,
    price: 45,
    description: 'Juicy and ripe red tomatoes perfect for cooking and salads.',
    inStock: true,
    quantity: 70,
    tags: ['tomato', 'vegetable', 'fresh'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761934640/Tomato_je_cv5kg0.jpg',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761934678/tomatoes-1296x728-feature_t3ktzv.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Amul Taaza Milk 1L',
    category: 'dairy_and_breads',
    subcategory: 'milk',
    score: 0,
    price: 70,
    description: 'Pure and creamy toned milk from Amul for daily nutrition.',
    inStock: true,
    quantity: 200,
    tags: ['milk', 'amul', 'dairy_and_breads'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761935617/AmulGoldFullCreamMilk1L_Pouch_os8a1a.jpg',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761935828/17022824893525_u9r3sz.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Hide & Seek Chocolate Cookies 200g',
    category: 'snacks',
    subcategory: 'cookies',
    score: 0,
    price: 60,
    description: 'Crunchy cookies filled with rich chocolate chips.',
    inStock: true,
    quantity: 120,
    tags: ['cookies', 'chocolate', 'britannia'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761936191/hidenseekbis_hgwccf.jpg',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761936241/07257f62-f41e-4040-8c6b-a6ccef555e33_192_2_b3fw41.png'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Tropicana Orange Juice 1L',
    category: 'beverages',
    subcategory: 'juice',
    score: 0,
    price: 130,
    description: `Refreshing orange juice made from the finest fruits, rich
in vitamin C and perfect for breakfast or a quick energy boost.`,
    inStock: true,
    quantity: 120,
    tags: ['juice', 'orange', 'tropicana', 'beverages'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761937438/229787_23-tropicana-100-orange-juice_dpdtqb.png',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761937478/61aPBI8ux3L._AC_UF350_350_QL80__gbck87.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Coca-Cola Soft Drink 750ml',
    category: 'beverages',
    subcategory: 'soft_drink',
    score: 0,
    price: 45,
    description: 'Classic Coca-Cola soft drink with its signature refreshing taste, best served chilled on any occasion.',
    inStock: true,
    quantity: 300,
    tags: ['soft drink', 'cola', 'coca cola', 'beverages'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761937712/71YBmiSj-cL_zkeieq.jpg',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761937866/Coca-Cola-Nutrition-Facts_gxogs3.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  },
  {
    name: 'Apple Shimla 1kg',
    category: 'fruits',
    subcategory: 'apple',
    score: 0,
    price: 120,
    description: 'Crisp and sweet Shimla apples packed with freshness and natural nutrition.',
    inStock: true,
    quantity: 40,
    tags: ['apple', 'fruit', 'fresh'],
    images: [
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761933789/apples-101-about-1440x810_biivub.webp',
      'https://res.cloudinary.com/dusia02q8/image/upload/v1761933958/Apples_etgoob.jpg'
    ],
    seller: '68c42f02b21115ce741dfb85'
  }
];

module.exports = products;