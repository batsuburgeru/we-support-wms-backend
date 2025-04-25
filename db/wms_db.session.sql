-- Description: SQL script to create the database schema for the NWMS system

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('WarehouseMan', 'Supervisor', 'PlantOfficer', 'Guard', 'Admin', 'Client') NOT NULL,
    acc_status ENUM('Verified', 'Unverified') DEFAULT 'Unverified',
    img_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    client_id CHAR(36) PRIMARY KEY, 
    org_name VARCHAR(255) NOT NULL,
    comp_add VARCHAR(255) NOT NULL,
    contact_num VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE roles_permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    role_name VARCHAR(255) UNIQUE NOT NULL,
    permissions JSON NOT NULL
);

CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category_id CHAR(36) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    img_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE purchase_requests (
    id CHAR(36) PRIMARY KEY,
    created_by CHAR(36) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Processed', 'Returned') DEFAULT 'Pending',
    approved_by CHAR(36) NULL,
    sap_sync_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE pr_items (
    id CHAR(36) PRIMARY KEY,
    pr_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE stock_transactions (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    transaction_type ENUM('Received', 'Issued', 'Adjusted') NOT NULL,
    quantity INT NOT NULL,
    performed_by CHAR(36) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goods_receipts (
    id CHAR(36) PRIMARY KEY,
    pr_id CHAR(36) NOT NULL,
    received_by CHAR(36) NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goods_issue (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    issued_to VARCHAR(255) NOT NULL,
    issued_by CHAR(36) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE delivery_notes (
    id CHAR(36) PRIMARY KEY,
    pr_id CHAR(36) NOT NULL,
    verified_by CHAR(36) NULL,
    verified_at TIMESTAMP NULL,
    note TEXT NULL,
    status ENUM('Pending', 'Verified', 'Dispatched') DEFAULT 'Pending',
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Unread', 'Read') DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sap_sync_logs (
    id CHAR(36) PRIMARY KEY,
    pr_id CHAR(36) NULL,
    transaction_id VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE SET NULL
);


INSERT INTO roles_permissions (role_name, permissions) VALUES
('Admin', JSON_ARRAY(
'create_categories', 'view_categories', 'update_categories', 'delete_categories', 
'create_delivery_notes', 'view_delivery_notes', 'update_delivery_notes', 'delete_delivery_notes', 
'create_goods_issue', 'view_goods_issue', 'update_goods_issue', 'delete_goods_issue', 
'create_goods_receipts', 'view_goods_receipts', 'update_goods_receipts', 'delete_goods_receipts', 
'create_notifications', 'view_notifications', 'update_notifications', 'delete_notifications', 
'create_pr_items', 'view_pr_items', 'update_pr_items', 'delete_pr_items',
'create_products', 'view_products', 'update_products', 'delete_products',
'create_purchase_requests', 'view_purchase_requests', 'update_purchase_requests', 'delete_purchase_requests',
'create_sap_sync_logs', 'view_sap_sync_logs', 'update_sap_sync_logs', 'delete_sap_sync_logs',
'create_stock_transactions', 'view_stock_transactions', 'update_stock_transactions', 'delete_stock_transactions',
'create_users', 'view_users', 'update_users', 'delete_users'
)),
('Supervisor', JSON_ARRAY(
'create_categories', 'view_categories', 'update_categories', 'delete_categories', 
'create_delivery_notes', 'view_delivery_notes', 'update_delivery_notes', 'delete_delivery_notes', 
'create_goods_issue', 'view_goods_issue', 'update_goods_issue', 'delete_goods_issue', 
'create_goods_receipts', 'view_goods_receipts', 'update_goods_receipts', 'delete_goods_receipts', 
'create_notifications', 'view_notifications', 'update_notifications', 'delete_notifications', 
'create_pr_items', 'view_pr_items', 'update_pr_items', 'delete_pr_items',
'create_products', 'view_products', 'update_products', 'delete_products',
'create_purchase_requests', 'view_purchase_requests', 'update_purchase_requests', 'delete_purchase_requests',
'create_sap_sync_logs', 'view_sap_sync_logs', 'update_sap_sync_logs', 'delete_sap_sync_logs',
'create_stock_transactions', 'view_stock_transactions', 'update_stock_transactions', 'delete_stock_transactions',
'view_users', 'update_users', 'delete_users'
)),
('Guard', JSON_ARRAY(
'view_delivery_notes', 'view_goods_issue', 'view_goods_receipts', 
'view_pr_items', 'view_products', 'view_purchase_requests', 
'update_delivery_notes'
)),
('PlantOfficer', JSON_ARRAY(
'view_categories', 'view_delivery_notes', 'view_goods_issue', 'view_goods_receipts', 
'view_notifications', 'view_pr_items', 'view_products', 'view_purchase_requests', 
'view_sap_sync_logs', 'view_stock_transactions', 'view_users', 
'update_purchase_requests', 'update_delivery_notes'
)),
('WarehouseMan', JSON_ARRAY(
'view_categories', 'view_delivery_notes', 'view_goods_issue', 'view_goods_receipts', 
'view_notifications', 'view_pr_items', 'view_products', 'view_purchase_requests', 
'view_sap_sync_logs', 'view_stock_transactions', 'view_users'
)),
('Client', JSON_ARRAY(
'view_purchase_requests', 'view_products', 'view_notifications'
));

INSERT INTO users (name, email, password_hash, role) VALUES ('admin', 'ekresmiswms@gmail.com', '$2a$10$s/HJ6QOVxH0wG6AyRjWegu2h3qcCZr2EtQpe2/K.18Kyhv22B7h6a', 'Admin');

UPDATE users
SET acc_status = 'Verified'
WHERE email = 'ekresmiswms@gmail.com';






