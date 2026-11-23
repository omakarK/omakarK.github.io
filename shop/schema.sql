CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(80) PRIMARY KEY,
    type TEXT NOT NULL,
    data LONGBLOB NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(80) PRIMARY KEY,
    category_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    original_price INTEGER,
    stock INTEGER NOT NULL CHECK (stock >= 0),
    created_at BIGINT NOT NULL DEFAULT 0,
    active INTEGER NOT NULL CHECK (active IN (0, 1)),
    engravable INTEGER NOT NULL CHECK (engravable IN (0, 1)),
    image TEXT NOT NULL,
    media_id VARCHAR(80),
    FOREIGN KEY (media_id) REFERENCES media(id),
    details TEXT NOT NULL,
    CHECK (original_price >= price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(80) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    created_at BIGINT NOT NULL DEFAULT 0,
    active INTEGER NOT NULL CHECK (active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS offer_products (
    offer_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    product_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    position INTEGER NOT NULL,
    PRIMARY KEY (offer_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS offer_media (
    offer_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    media_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (media_id) REFERENCES media(id),
    position INTEGER NOT NULL,
    PRIMARY KEY (offer_id, media_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(80) PRIMARY KEY,
    request_key VARCHAR(64) NOT NULL UNIQUE,
    request_hash CHAR(64) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    status VARCHAR(16) NOT NULL,
    customer TEXT NOT NULL,
    subtotal BIGINT NOT NULL,
    shipping BIGINT NOT NULL,
    tracking VARCHAR(240) NOT NULL DEFAULT '',
    INDEX orders_by_date (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_items (
    order_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    position INTEGER NOT NULL,
    item TEXT NOT NULL,
    PRIMARY KEY (order_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_stock (
    order_id VARCHAR(80) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    product_id VARCHAR(80),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admins (
    username VARCHAR(80) PRIMARY KEY,
    password_hash TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    FOREIGN KEY (username) REFERENCES admins(username) ON DELETE CASCADE,
    csrf TEXT NOT NULL,
    expires_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS visits (
    visitor CHAR(36) NOT NULL,
    page VARCHAR(40) NOT NULL,
    seen_at BIGINT NOT NULL,
    INDEX visits_by_time (seen_at),
    INDEX visits_by_visitor (visitor, seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS newsletter (
    email VARCHAR(254) PRIMARY KEY,
    created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
