const productsToInsert = [
  {
    name: "Hoodie Clásica",
    base_price: 799.0,
    description: "Hoodie de algodón grueso, cómoda y duradera.",
    image_url: "sources/img/hoodie.jpg",
    category: "hombre",
    productType: "hoodie",
    variants: [
      { size: "M", sku: "HOOD-CLA-M", stock: 50 },
      { size: "L", sku: "HOOD-CLA-L", stock: 30 }
    ]
  },
  {
    name: "Pantalón Cargo",
    base_price: 650.5,
    description: "Pantalón estilo cargo con múltiples bolsillos.",
    image_url: "sources/img/pantalones.jpg",
    category: "hombre",
    productType: "pantalones",
    variants: [
      { size: "M", sku: "PANT-CAR-M", stock: 40 }
    ]
  },
  {
    name: "Camiseta Básica",
    base_price: 350.0,
    description: "Camiseta de algodón suave, corte regular.",
    image_url: "sources/img/camisa.jpg",
    category: "mujer",
    productType: "camisas",
    variants: [
      { size: "S", sku: "CAMI-BAS-S", stock: 100 },
      { size: "M", sku: "CAMI-BAS-M", stock: 120 }
    ]
  },
  {
    name: "Hoodie Oversize",
    base_price: 899.0,
    description: "Hoodie amplia estilo urbano con capucha ajustable.",
    image_url: "sources/img/hoodie_oversize.jpg",
    category: "unisex",
    productType: "hoodie",
    variants: [
      { size: "M", sku: "HOOD-OVER-M", stock: 60 },
      { size: "L", sku: "HOOD-OVER-L", stock: 40 }
    ]
  },
  {
    name: "Pantalón Jogger",
    base_price: 720.0,
    description: "Jogger deportivo con ajuste elástico y bolsillos laterales.",
    image_url: "sources/img/jogger.jpg",
    category: "hombre",
    productType: "pantalones",
    variants: [
      { size: "M", sku: "PANT-JOG-M", stock: 35 },
      { size: "L", sku: "PANT-JOG-L", stock: 25 }
    ]
  },
  {
    name: "Short Deportivo",
    base_price: 450.0,
    description: "Short ligero y transpirable ideal para entrenamiento.",
    image_url: "sources/img/short_deportivo.jpg",
    category: "hombre",
    productType: "shorts",
    variants: [
      { size: "M", sku: "SHOR-DEP-M", stock: 70 },
      { size: "L", sku: "SHOR-DEP-L", stock: 50 }
    ]
  },
  {
    name: "Camisa de Lino",
    base_price: 780.0,
    description: "Camisa fresca de lino ideal para clima cálido.",
    image_url: "sources/img/camisa_lino.jpg",
    category: "hombre",
    productType: "camisas",
    variants: [
      { size: "M", sku: "CAMS-LIN-M", stock: 40 },
      { size: "L", sku: "CAMS-LIN-L", stock: 30 }
    ]
  },
  {
    name: "Hoodie con Cierre",
    base_price: 820.0,
    description: "Hoodie con cierre frontal y bolsillos amplios.",
    image_url: "sources/img/hoodie_cierre.jpg",
    category: "mujer",
    productType: "hoodie",
    variants: [
      { size: "S", sku: "HOOD-CIE-S", stock: 45 },
      { size: "M", sku: "HOOD-CIE-M", stock: 40 }
    ]
  },
  {
    name: "Camiseta Estampada",
    base_price: 420.0,
    description: "Camiseta con estampado moderno y tela suave.",
    image_url: "sources/img/camiseta_estampada.jpg",
    category: "mujer",
    productType: "camisas",
    variants: [
      { size: "S", sku: "CAMI-EST-S", stock: 90 },
      { size: "M", sku: "CAMI-EST-M", stock: 85 }
    ]
  },
  {
    name: "Pantalón Formal",
    base_price: 890.0,
    description: "Pantalón de vestir elegante y cómodo.",
    image_url: "sources/img/pantalon_formal.jpg",
    category: "hombre",
    productType: "pantalones",
    variants: [
      { size: "M", sku: "PANT-FOR-M", stock: 25 },
      { size: "L", sku: "PANT-FOR-L", stock: 20 }
    ]
  },
  {
    name: "Short Casual",
    base_price: 499.0,
    description: "Short de mezclilla suave, ideal para uso diario.",
    image_url: "sources/img/short_casual.jpg",
    category: "mujer",
    productType: "shorts",
    variants: [
      { size: "S", sku: "SHOR-CAS-S", stock: 80 },
      { size: "M", sku: "SHOR-CAS-M", stock: 60 }
    ]
  },
  {
    name: "Camisa Cuadros",
    base_price: 650.0,
    description: "Camisa de franela con diseño de cuadros clásicos.",
    image_url: "sources/img/camisa_cuadros.jpg",
    category: "hombre",
    productType: "camisas",
    variants: [
      { size: "M", sku: "CAMS-CUA-M", stock: 35 },
      { size: "L", sku: "CAMS-CUA-L", stock: 25 }
    ]
  },
  {
    name: "Hoodie Crop Top",
    base_price: 770.0,
    description: "Hoodie corta con diseño juvenil y moderno.",
    image_url: "sources/img/hoodie_crop.jpg",
    category: "mujer",
    productType: "hoodie",
    variants: [
      { size: "S", sku: "HOOD-CRO-S", stock: 50 },
      { size: "M", sku: "HOOD-CRO-M", stock: 40 }
    ]
  },
  {
    name: "Camiseta Sin Mangas",
    base_price: 330.0,
    description: "Camiseta sin mangas ideal para el gimnasio.",
    image_url: "sources/img/camiseta_sinmangas.jpg",
    category: "unisex",
    productType: "camisas",
    variants: [
      { size: "M", sku: "CAMI-SIN-M", stock: 70 },
      { size: "L", sku: "CAMI-SIN-L", stock: 60 }
    ]
  },
  {
    name: "Pantalón Skinny",
    base_price: 680.0,
    description: "Pantalón ajustado con tejido elástico.",
    image_url: "sources/img/pantalon_skinny.jpg",
    category: "mujer",
    productType: "pantalones",
    variants: [
      { size: "S", sku: "PANT-SKI-S", stock: 45 },
      { size: "M", sku: "PANT-SKI-M", stock: 40 }
    ]
  },
  {
    name: "Short Running",
    base_price: 420.0,
    description: "Short ligero con forro interno y bolsillos laterales.",
    image_url: "sources/img/short_running.jpg",
    category: "unisex",
    productType: "shorts",
    variants: [
      { size: "M", sku: "SHOR-RUN-M", stock: 60 },
      { size: "L", sku: "SHOR-RUN-L", stock: 50 }
    ]
  },
  {
    name: "Camisa Casual Blanca",
    base_price: 590.0,
    description: "Camisa blanca de algodón para cualquier ocasión.",
    image_url: "sources/img/camisa_blanca.jpg",
    category: "hombre",
    productType: "camisas",
    variants: [
      { size: "M", sku: "CAMS-BLA-M", stock: 40 },
      { size: "L", sku: "CAMS-BLA-L", stock: 30 }
    ]
  },
  {
    name: "Hoodie con Bolsillo Canguro",
    base_price: 840.0,
    description: "Hoodie con bolsillo delantero y capucha ajustable.",
    image_url: "sources/img/hoodie_canguro.jpg",
    category: "unisex",
    productType: "hoodie",
    variants: [
      { size: "M", sku: "HOOD-CAN-M", stock: 55 },
      { size: "L", sku: "HOOD-CAN-L", stock: 45 }
    ]
  },
  {
    name: "Pantalón Chino",
    base_price: 730.0,
    description: "Pantalón de corte recto, ideal para un look casual elegante.",
    image_url: "sources/img/pantalon_chino.jpg",
    category: "hombre",
    productType: "pantalones",
    variants: [
      { size: "M", sku: "PANT-CHI-M", stock: 30 },
      { size: "L", sku: "PANT-CHI-L", stock: 25 }
    ]
  },
  {
    name: "Camiseta Vintage",
    base_price: 390.0,
    description: "Camiseta con diseño retro y tacto suave.",
    image_url: "sources/img/camiseta_vintage.jpg",
    category: "mujer",
    productType: "camisas",
    variants: [
      { size: "S", sku: "CAMI-VIN-S", stock: 80 },
      { size: "M", sku: "CAMI-VIN-M", stock: 70 }
    ]
  }
];
