CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    img_sources NUMERIC,
    tags TEXT,
    price INTEGER,
    specifications REAL,
    availability INTEGER,
    in_banner INTEGER,
    company TEXT,
    choices TEXT DEFAULT '{}',
    discount TEXT,
    arrival_date INTEGER
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    cart TEXT,
    wishlist TEXT,
    orders TEXT,
    name TEXT,
    address TEXT,
    city TEXT,
    postcode TEXT,
    phone TEXT
);