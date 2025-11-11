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
