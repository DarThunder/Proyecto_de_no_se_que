# Manual de Uso: Backend y Despliegue

Este manual describe cómo desplegar, validar y utilizar la API del backend, basándose en la configuración de Docker y los scripts proporcionados.

---

## 1. Despliegue y Validación de Contenedores

El despliegue se gestiona mediante **Docker Compose**, que levanta los servicios de la base de datos (mongo) y la aplicación (backend).

### Cómo usar los Scripts de Despliegue

Los scripts `start-dev.sh` (para Linux/macOS) y `start-dev.ps1` (para Windows) automatizan el proceso.

Asegúrate de tener permisos de ejecución para el script que corresponda a tu sistema operativo:

```bash
chmod +x scripts/start-dev.sh
```

Ejecuta el script desde la raíz del proyecto:

```bash
# Linux/macOS
./scripts/start-dev.sh

# PowerShell
.\scripts\start-dev.ps1
```

Estos scripts realizarán las siguientes acciones:

1. Detendrán y eliminarán contenedores anteriores (`docker-compose down`).
2. Construirán la imagen del backend y crearán los contenedores (`docker-compose up --build -d`).
3. Mostrarán el estado final de los contenedores (`docker-compose ps`).

### Cómo Validar los Contenedores

Puedes validar que los contenedores estén levantados ejecutando:

```bash
docker-compose -f docker-compose.yml ps
```

Salida esperada:

```
NAME                             COMMAND                  SERVICE    STATUS      PORTS
ropa_backend_node_container      "docker-entrypoint.s…"   backend    Up          0.0.0.0:8080->8080/tcp
ropadb_mongo_container           "docker-entrypoint.s…"   mongo      Up          0.0.0.0:27017->27017/tcp
```

- La base de datos **Mongo** está disponible en el puerto **27017**.
- La API del backend está disponible en **http://localhost:8080**.

---

## 2. Manual de Endpoints de la API

La API utiliza un sistema de autenticación (**JWT**) y permisos basados en _anillos_ (`permission_ring`).
Un anillo menor implica permisos más altos (**Admin=0**, **Cajero=1**, **Usuario=2**).

**URL Base:** `http://localhost:8080`

---

### 🧩 Autenticación (`/auth`)

#### POST /auth/login _(Público)_

**Descripción:** Inicia sesión para obtener un token JWT.

**Usuarios de prueba:**

- `superadmin / password123` (Rol Admin, Anillo 0)
- `cajero01 / password123` (Rol Cajero, Anillo 1)

**Body (JSON):**

```json
{ "username": "superadmin", "password": "password123" }
```

**Respuesta:**

```json
{ "token": "...", "message": "Inicio de sesión exitoso" }
```

**Ejemplo en JavaScript:**

```js
fetch("http://localhost:8080/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "superadmin", password: "password123" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

#### POST /auth/register _(Público)_

**Descripción:** Registra un nuevo usuario.

```json
{ "username": "nuevo_usuario", "password": "password123", "role": "user" }
```

---

### 🛍️ Productos (`/products`)

#### GET /products _(Público)_

**Descripción:** Obtiene una lista de todas las variantes de productos.

**Ejemplo JavaScript:**

```js
fetch("http://localhost:8080/products")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

#### GET /products/:id _(Público)_

**Descripción:** Obtiene una variante de producto específica por su ID.

**Ejemplo JavaScript:**

```js
fetch("http://localhost:8080/products/672fbc125e9d")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

#### POST /products _(Protegido - Permiso Anillo 1 o 0)_

**Descripción:** Crea un nuevo producto base y su primera variante.

**Body (JSON):**

```json
{
  "name": "Camiseta",
  "base_price": 350.5,
  "description": "Camiseta de algodón",
  "size": "M",
  "sku": "prodsku1",
  "stock": 100
}
```

**Ejemplo JavaScript:**

```js
fetch("http://localhost:8080/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <token>",
  },
  body: JSON.stringify({
    name: "Camiseta",
    base_price: 350.5,
    description: "Camiseta de algodón",
    size: "M",
    sku: "prodsku1",
    stock: 100,
  }),
})
  .then((res) => res.json())
  .then(console.log);
```

#### PUT /products/:id _(Protegido - Permiso Anillo 1 o 0)_

**Descripción:** Actualiza un producto existente.

**Ejemplo JavaScript:**

```js
fetch("http://localhost:8080/products/672fbc125e9d", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <token>",
  },
  body: JSON.stringify({ stock: 150 }),
})
  .then((res) => res.json())
  .then(console.log);
```

#### DELETE /products/:id _(Protegido - Permiso Anillo 0)_

**Descripción:** Elimina un producto existente.

**Ejemplo JavaScript:**

```js
fetch("http://localhost:8080/products/672fbc125e9d", {
  method: "DELETE",
  headers: { Authorization: "Bearer <token>" },
})
  .then((res) => res.json())
  .then(console.log);
```

---

### 💰 Órdenes/Ventas (`/orders`)

#### POST /orders _(Protegido - Permiso Anillo 1 o 0)_

**Descripción:** Registra una nueva venta (orden) y descuenta stock automáticamente.

**Body (JSON):**

```json
{
  "cashier": "ID_del_cajero_logueado",
  "user": null,
  "transaction_type": "POS",
  "payment_method": "CASH",
  "items": [
    {
      "variant": "ID_variante_producto",
      "quantity": 1,
      "unit_price": 350.5,
      "discount_rate": 0.0
    }
  ]
}
```

---

### 👥 Usuarios (`/users`)

- **GET /users** _(Protegido - Admin)_: Lista de todos los usuarios.
- **GET /users/:id** _(Protegido)_: Obtiene información de un usuario.
- **PUT /users/:id** _(Protegido - Admin)_: Actualiza información de usuario.
- **DELETE /users/:id** _(Protegido - Admin)_: Elimina un usuario.

**Ejemplo GET:**

```js
fetch("http://localhost:8080/users", {
  headers: { Authorization: "Bearer <token>" },
})
  .then((res) => res.json())
  .then(console.log);
```

---

## 3. Cómo usar el Script de Prueba

El script `scripts/test_server.sh` (para Linux/macOS) prueba la secuencia completa de autenticación y creación de entidades.

### Ejecución:

```bash
chmod +x scripts/test_server.sh
./scripts/test_server.sh
```

El script hará lo siguiente:

1. Solicita un token JWT usando las credenciales `superadmin / password123`.
2. Usa ese token para crear un nuevo producto.
3. Usa el token y el ID del producto para crear una orden.

Si el script se completa sin errores, significa que los flujos principales de la API (autenticación, permisos, creación de productos y creación de órdenes con descuento de stock) funcionan correctamente.
