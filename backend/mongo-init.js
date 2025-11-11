const db = db.getSiblingDB("ropadb");

db.createCollection("cupons");

// Cuponcillo por defecto - Buen Fin
let cuponBuenFin = {
  nombre: "Buen Fin 2024",
  descuento: 20,
  codigo: "BUENFIN20",
  activo: true,
  fecha_expiracion: new Date("2024-12-31T23:59:59Z"),
  usos_maximos: 1000,
  usos_actuales: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Cupón de temporada jejejej
let cuponVerano = {
  nombre: "Descuento de Verano",
  descuento: 15,
  codigo: "VERANO15",
  activo: true,
  fecha_expiracion: new Date("2024-09-30T23:59:59Z"),
  usos_maximos: 500,
  usos_actuales: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Cupón para nuevos clientes
let cuponBienvenida = {
  nombre: "Bienvenida Nuevos Clientes",
  descuento: 10,
  codigo: "BIENVENIDA10",
  activo: true,
  fecha_expiracion: null, // Sin fecha de expiración
  usos_maximos: null, // Sin límite de usos w
  usos_actuales: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insertar cupones
db.cupons.insertMany([cuponBuenFin, cuponVerano, cuponBienvenida]);

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
