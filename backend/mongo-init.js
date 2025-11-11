const db = db.getSiblingDB("ropadb");

db.createCollection("coupons");

// Cuponcillo por defecto - Buen Fin
let cuponBuenFin = {
  name: "Buen Fin 2024",
  discount: 20,
  code: "BUENFIN20",
  active: true,
  expiration_date: new Date("2024-12-31T23:59:59Z"),
  maximum_uses: 1000,
  actual_uses: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Cupón de temporada jejejej
let cuponVerano = {
  name: "Descuento de Verano",
  discount: 15,
  code: "VERANO15",
  active: true,
  expiration_date: new Date("2024-09-30T23:59:59Z"),
  maximum_uses: 500,
  actual_uses: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Cupón para nuevos clientes
let cuponBienvenida = {
  name: "Bienvenida Nuevos Clientes",
  discount: 10,
  code: "BIENVENIDA10",
  active: true,
  expiration_date: null, // Sin fecha de expiración
  maximum_uses: null, // Sin límite de usos w
  actual_uses: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

db.coupons.insertMany([cuponBuenFin, cuponVerano, cuponBienvenida]);
print("Insertando productos y variantes de prueba...");

// 1. Insertar los productos base primero
db.products.insertMany([
  {
    name: "Hoodie Clásica",
    base_price: 799.0,
    description: "Hoodie de algodón grueso, cómoda y duradera.",
    image_url: "sources/img/hoodie.jpg", // <--- NUEVO
    category: "hombre", // <--- NUEVO
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Pantalón Cargo",
    base_price: 650.5,
    description: "Pantalón estilo cargo con múltiples bolsillos.",
    image_url: "sources/img/pantalones.jpg", // <--- NUEVO
    category: "hombre", // <--- NUEVO
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Camiseta Básica",
    base_price: 350.0,
    description: "Camiseta de algodón suave, corte regular.",
    image_url: "sources/img/camisa.jpg", // <--- NUEVO
    category: "mujer", // <--- NUEVO
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]);

// 2. Obtener los IDs de los productos que acabamos de crear
const hoodie = db.products.findOne({ name: "Hoodie Clásica" });
const pantalon = db.products.findOne({ name: "Pantalón Cargo" });
const camiseta = db.products.findOne({ name: "Camiseta Básica" });

// 3. Insertar las variantes para cada producto, usando sus IDs
if (hoodie) {
  db.productvariants.insertMany([
    {
      product: hoodie._id,
      size: "M",
      sku: "HOOD-CLA-M",
      stock: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      product: hoodie._id,
      size: "L",
      sku: "HOOD-CLA-L",
      stock: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);
}

if (pantalon) {
  db.productvariants.insertOne({
    product: pantalon._id,
    size: "32",
    sku: "PANT-CAR-32",
    stock: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

if (camiseta) {
  db.productvariants.insertMany([
    {
      product: camiseta._id,
      size: "S",
      sku: "CAMI-BAS-S",
      stock: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      product: camiseta._id,
      size: "M",
      sku: "CAMI-BAS-M",
      stock: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);
}

print("¡Productos y variantes insertados exitosamente!");



db.roles.insertMany([
  {
    name: "admin",
    permission_ring: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "cashier",
    permission_ring: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "user",
    permission_ring: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const adminRole = db.roles.findOne({ name: "admin" });
const cashierRole = db.roles.findOne({ name: "cashier" });
const userRole = db.roles.findOne({ name: "user" });

const samplePasswordHash =
  "$2b$10$zNZEVbIXGs84eNZS3VmVyO/IPeoglQ9Jc90muzjRms/SwWQPBjHay"; // este es el hash de la contraseña: password123

if (adminRole && cashierRole && userRole) {
  db.users.insertMany([
    {
      username: "superadmin",
      password_hash: samplePasswordHash,
      email: "admin@ropadb.com",
      role: adminRole._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: "cajero01",
      password_hash: samplePasswordHash,
      email: "cajero@ropadb.com",
      role: cashierRole._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: "cliente01",
      password_hash: samplePasswordHash,
      email: "cliente@ropadb.com",
      role: userRole._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

print("Datos iniciales de Roles y Usuarios creados en ropadb.");
print("Cupon de prueba creo que también w");
