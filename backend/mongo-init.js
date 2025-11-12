const db = db.getSiblingDB("ropadb");

db.createCollection("coupons");

// --- Lógica de Cupones (sin cambios) ---
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
let cuponBienvenida = {
  name: "Bienvenida Nuevos Clientes",
  discount: 10,
  code: "BIENVENIDA10",
  active: true,
  expiration_date: null,
  maximum_uses: null,
  actual_uses: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
db.coupons.insertMany([cuponBuenFin, cuponVerano, cuponBienvenida]);

// --- ===== INICIO DE LA NUEVA LÓGICA DE PRODUCTOS ===== ---
print("Cargando datos de productos desde product-data.js...");

// ===== CORRECCIÓN AQUÍ =====
// Especifica la ruta absoluta dentro del contenedor
load('/docker-entrypoint-initdb.d/product-data.js'); 

if (typeof productsToInsert === 'undefined') {
  print("ERROR: No se pudo cargar la variable 'productsToInsert' desde product-data.js.");
} else {
  print(`Encontrados ${productsToInsert.length} productos para insertar.`);
  
  productsToInsert.forEach(productData => {
    const variantsData = productData.variants;
    delete productData.variants; 

    productData.createdAt = new Date();
    productData.updatedAt = new Date();

    const insertResult = db.products.insertOne(productData);
    const newProductId = insertResult.insertedId;

    if (newProductId) {
      const variantsToInsert = variantsData.map(variant => {
        return {
          ...variant,
          product: newProductId, 
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
      db.productvariants.insertMany(variantsToInsert);
      print(`Producto '${productData.name}' y sus ${variantsToInsert.length} variantes insertados.`);
    } else {
      print(`ERROR: No se pudo insertar el producto '${productData.name}'.`);
    }
  });
  print("¡Todos los productos y variantes fueron insertados exitosamente!");
}
// --- ===== FIN DE LA NUEVA LÓGICA DE PRODUCTOS ===== ---


// --- Lógica de Roles y Usuarios (sin cambios) ---
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
  "$2b$10$zNZEVbIXGs84eNZS3VmVyO/IPeoglQ9Jc90muzjRms/SwWQPBjHay"; // hash de: password123

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
