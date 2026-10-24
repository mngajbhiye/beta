mongodb+srv://projectsmohitgajbhiye9_db_user:f73eBUeecBVbNejD@cluster-beta.eycmyef.mongodb.net/

CREATE DATABASE inventory_db;

USE inventory_db;

CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
    unit VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    type ENUM('sale', 'purchase', 'payment') NOT NULL,
    datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unpaid',

    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE transaction_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    transaction_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(30),

    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);