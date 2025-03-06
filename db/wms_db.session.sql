CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('WarehouseMan', 'Supervisor', 'PlantOfficer', 'Guard', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles_permissions (
    id CHAR(36) PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE purchase_requests (
    id CHAR(36) PRIMARY KEY,
    created_by CHAR(36) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Processed') DEFAULT 'Pending',
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


/* INSERT VALUES ROLES_PERMISSIONS*/
INSERT INTO roles_permissions (id, role_name, permissions) VALUES
(UUID(), 'Admin', JSON_ARRAY(
  'create_users', 'view_users', 'edit_users', 'delete_users', 
  'create_categories', 'view_categories', 'edit_categories', 'delete_categories', 
  'create_products', 'view_products', 'edit_products', 'delete_products', 
  'create_purchase_requests', 'view_purchase_requests', 'edit_purchase_requests', 'delete_purchase_requests', 
  'create_stock_transactions', 'view_stock_transactions', 'edit_stock_transactions', 'delete_stock_transactions', 
  'create_goods_receipts', 'view_goods_receipts', 'edit_goods_receipts', 'delete_goods_receipts', 
  'create_goods_issue', 'view_goods_issue', 'edit_goods_issue', 'delete_goods_issue', 
  'create_delivery_notes', 'view_delivery_notes', 'edit_delivery_notes', 'delete_delivery_notes', 
  'create_notifications', 'view_notifications', 'edit_notifications', 'delete_notifications', 
  'sync_sap'
)),
(UUID(), 'Supervisor', JSON_ARRAY(
  "view_products", "view_categories", "view_purchase_requests", 
  "view_pr_items", "view_stock_transactions", "view_goods_receipts", 
  "view_goods_issue", "view_delivery_notes", "view_notifications"
)),
(UUID(), 'Guard', JSON_ARRAY(
  "view_products", "view_categories", "view_purchase_requests", 
  "view_pr_items", "view_stock_transactions", "view_goods_receipts", 
  "view_goods_issue", "view_delivery_notes", "view_notifications"
)),
(UUID(), 'PlantOfficer', JSON_ARRAY(
  "view_products", "view_categories", "create_purchase_requests", 
  "view_purchase_requests", "edit_purchase_requests", "view_pr_items", 
  "create_stock_transactions", "view_stock_transactions", "view_goods_receipts", 
  "view_goods_issue", "view_delivery_notes", "view_notifications"
)),
(UUID(), 'WarehouseMan', JSON_ARRAY(
  "view_products", "view_categories", "view_purchase_requests", 
  "view_pr_items", "view_stock_transactions", "view_goods_receipts", 
  "view_goods_issue", "view_delivery_notes", "view_notifications"
));

/* ALTER IN USERS*/
ALTER TABLE users MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN ROLES_PERMISSIONS*/
ALTER TABLE roles_permissions MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN CATEGORIES*/
ALTER TABLE categories MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN PRODUCTS*/
ALTER TABLE products MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN PURCHASE_REQUESTS*/
ALTER TABLE purchase_requests MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN PR_ITEMS*/
ALTER TABLE pr_items MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN STOCK_TRANSACTIONS*/
ALTER TABLE stock_transactions MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN GOODS_RECEIPTS*/
ALTER TABLE goods_receipts MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN GOODS_ISSUE*/
ALTER TABLE goods_issue MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN DELIVERY_NOTES*/
ALTER TABLE delivery_notes MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN NOTIFICATIONS*/
ALTER TABLE notifications MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());
/* ALTER IN SAP_SYNC_LOGS*/
ALTER TABLE sap_sync_logs MODIFY id CHAR(36) NOT NULL DEFAULT (UUID());


