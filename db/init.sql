CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    talla VARCHAR(50),
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL
);

INSERT INTO products (nombre, precio, talla, stock) VALUES
('Camisa Blanca', 399.99, 'M', 20),
('Jeans Slim Fit', 699.00, '32', 15),
('Chaqueta Negra', 1299.50, 'L', 5);

INSERT INTO users (username, password_hash, email) VALUES
('admin', 'password_mock_hash', 'admin@ropa.com');