-- ============================================
-- Complete Database Schema and Sample Data
-- E-commerce Shop Database
-- ============================================
-- IMPORTANT: Use UTF-8 when running this file so Persian text stores correctly.
-- Run: SET NAMES utf8mb4; before SOURCE, or: mysql ... --default-character-set=utf8mb4 < database.sql
SET NAMES utf8mb4;

-- Create database
CREATE DATABASE IF NOT EXISTS shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_persian_ci;
USE shop_db;

-- ============================================
-- TABLES CREATION
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    national_id VARCHAR(20),
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    mobile_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- User auth tokens (login session; middleware looks up user_id by token)
CREATE TABLE IF NOT EXISTS user_tokens (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    mobile VARCHAR(20),
    email VARCHAR(255),
    code VARCHAR(10) NOT NULL,
    type ENUM('mobile', 'email') NOT NULL,
    purpose ENUM('login', 'register', 'reset_password') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_mobile (mobile),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    receiver_mobile VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id INT,
    description TEXT,
    image_url VARCHAR(500),
    icon_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product attributes (dynamic attributes like size, color)
CREATE TABLE IF NOT EXISTS product_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    type ENUM('text', 'number', 'select', 'color', 'size') NOT NULL,
    is_filterable BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product attribute values
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_id INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    value_en VARCHAR(255),
    color_code VARCHAR(7),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
    INDEX idx_attribute (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    brand_id INT,
    category_id INT,
    base_price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2),
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 5,
    weight DECIMAL(8, 2),
    dimensions VARCHAR(100),
    status ENUM('draft', 'active', 'inactive', 'out_of_stock') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_brand (brand_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    FULLTEXT INDEX idx_search (name, description, name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product images and videos
CREATE TABLE IF NOT EXISTS product_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('image', 'video') NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product variants (combinations of attributes like size+color)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(12, 2),
    stock INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product variant attributes (which attributes this variant has)
CREATE TABLE IF NOT EXISTS product_variant_attributes (
    variant_id INT NOT NULL,
    attribute_id INT NOT NULL,
    attribute_value_id INT NOT NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_value_id) REFERENCES product_attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product specifications (technical specs)
CREATE TABLE IF NOT EXISTS product_specifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    spec_key VARCHAR(255) NOT NULL,
    spec_value TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Discounts/Coupons
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    session_id VARCHAR(255),
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    discount_id INT,
    shipping_address_id INT,
    tracking_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- User discount usage (must be after orders table)
CREATE TABLE IF NOT EXISTS user_discount_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    discount_id INT NOT NULL,
    order_id INT,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_discount (discount_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Product reviews and ratings
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_item_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    pros TEXT,
    cons TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (review_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- User favorites/wishlist
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    query VARCHAR(255) NOT NULL,
    results_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_query (query),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    product_id INT,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_persian_ci;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Brands
INSERT INTO brands (name, name_en, slug, description, is_active) VALUES
('زارا', 'Zara', 'zara', 'برند اسپانیایی پوشاک زنانه', TRUE),
('مانگو', 'Mango', 'mango', 'برند مد و فشن اروپایی', TRUE),
('اچ‌اند‌ام', 'H&M', 'h-and-m', 'برند سوئدی پوشاک', TRUE),
('فوراور 21', 'Forever 21', 'forever-21', 'برند آمریکایی فست فشن', TRUE),
('استرادا', 'Stradivarius', 'stradivarius', 'برند اسپانیایی پوشاک', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Categories
INSERT INTO categories (name, name_en, slug, parent_id, description, is_active, sort_order) VALUES
('لباس زنانه', 'Women Clothing', 'women-clothing', NULL, 'دسته‌بندی اصلی لباس زنانه', TRUE, 1),
('پیراهن و بلوز', 'Dresses & Blouses', 'dresses-blouses', 1, 'پیراهن و بلوز زنانه', TRUE, 1),
('شلوار', 'Pants', 'pants', 1, 'شلوار زنانه', TRUE, 2),
('دامن', 'Skirts', 'skirts', 1, 'دامن زنانه', TRUE, 3),
('کاپشن و کت', 'Jackets & Coats', 'jackets-coats', 1, 'کاپشن و کت زنانه', TRUE, 4),
('کیف و کفش', 'Bags & Shoes', 'bags-shoes', NULL, 'کیف و کفش زنانه', TRUE, 2),
('کیف', 'Bags', 'bags', 6, 'کیف زنانه', TRUE, 1),
('کفش', 'Shoes', 'shoes', 6, 'کفش زنانه', TRUE, 2),
('اکسسوری', 'Accessories', 'accessories', NULL, 'اکسسوری زنانه', TRUE, 3),
('ساعت', 'Watches', 'watches', 9, 'ساعت زنانه', TRUE, 1),
('جواهرات', 'Jewelry', 'jewelry', 9, 'جواهرات زنانه', TRUE, 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Product Attributes
INSERT INTO product_attributes (name, name_en, type, is_filterable, sort_order) VALUES
('سایز', 'Size', 'size', TRUE, 1),
('رنگ', 'Color', 'color', TRUE, 2),
('جنس', 'Material', 'select', TRUE, 3),
('برند', 'Brand', 'select', TRUE, 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Attribute Values
INSERT INTO product_attribute_values (attribute_id, value, value_en, color_code, sort_order) VALUES
-- Sizes
(1, 'XS', 'XS', NULL, 1),
(1, 'S', 'S', NULL, 2),
(1, 'M', 'M', NULL, 3),
(1, 'L', 'L', NULL, 4),
(1, 'XL', 'XL', NULL, 5),
(1, 'XXL', 'XXL', NULL, 6),
-- Colors
(2, 'مشکی', 'Black', '#000000', 1),
(2, 'سفید', 'White', '#FFFFFF', 2),
(2, 'قرمز', 'Red', '#FF0000', 3),
(2, 'آبی', 'Blue', '#0000FF', 4),
(2, 'سبز', 'Green', '#008000', 5),
(2, 'زرد', 'Yellow', '#FFFF00', 6),
(2, 'صورتی', 'Pink', '#FFC0CB', 7),
(2, 'خاکستری', 'Gray', '#808080', 8),
(2, 'بژ', 'Beige', '#F5F5DC', 9),
(2, 'نارنجی', 'Orange', '#FFA500', 10),
-- Materials
(3, 'پنبه', 'Cotton', NULL, 1),
(3, 'پلی‌استر', 'Polyester', NULL, 2),
(3, 'ابریشم', 'Silk', NULL, 3),
(3, 'چرم', 'Leather', NULL, 4),
(3, 'کتان', 'Linen', NULL, 5)
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Insert Products
INSERT INTO products (name, name_en, description, short_description, sku, brand_id, category_id, base_price, sale_price, stock, status, is_featured, rating_average, rating_count) VALUES
('پیراهن تابستانی زارا', 'Zara Summer Dress', 'پیراهن زیبا و راحت برای فصل تابستان با طراحی مدرن و شیک. مناسب برای مهمانی‌ها و مراسمات مختلف.', 'پیراهن تابستانی شیک و راحت', 'PRD-001', 1, 2, 890000, 750000, 25, 'active', TRUE, 4.5, 120),
('بلوز سفید کلاسیک', 'Classic White Blouse', 'بلوز سفید کلاسیک و همیشگی که با هر لباسی ست می‌شود. جنس با کیفیت و دوخت عالی.', 'بلوز سفید کلاسیک', 'PRD-002', 2, 2, 450000, 380000, 30, 'active', TRUE, 4.3, 95),
('شلوار جین فیت بالا', 'High-Waisted Jeans', 'شلوار جین راحت و شیک با فیت بالا. مناسب برای استایل کژوال و روزمره.', 'شلوار جین فیت بالا', 'PRD-003', 3, 3, 650000, 550000, 20, 'active', FALSE, 4.7, 150),
('دامن میدی A', 'A-Line Midi Skirt', 'دامن میدی با فرم A که برای هر استایلی مناسب است. جنس با کیفیت و رنگ‌بندی متنوع.', 'دامن میدی A', 'PRD-004', 1, 4, 520000, 450000, 18, 'active', FALSE, 4.2, 80),
('کاپشن زمستانی پشمی', 'Wool Winter Jacket', 'کاپشن گرم و شیک برای فصل زمستان. جنس پشم با کیفیت و طراحی مدرن.', 'کاپشن زمستانی پشمی', 'PRD-005', 2, 5, 1850000, 1650000, 12, 'active', TRUE, 4.8, 200),
('کیف دستی چرمی', 'Leather Handbag', 'کیف دستی چرمی با کیفیت و طراحی کلاسیک. مناسب برای استفاده روزمره و مهمانی.', 'کیف دستی چرمی', 'PRD-006', 4, 7, 1200000, 990000, 15, 'active', TRUE, 4.6, 110),
('کفش پاشنه‌بلند', 'High Heel Shoes', 'کفش پاشنه‌بلند راحت و شیک. مناسب برای مراسمات و مهمانی‌ها.', 'کفش پاشنه‌بلند', 'PRD-007', 3, 8, 850000, 720000, 22, 'active', FALSE, 4.4, 90),
('ساعت مچی طلایی', 'Gold Watch', 'ساعت مچی طلایی با طراحی لوکس و شیک. مناسب برای استایل رسمی و غیررسمی.', 'ساعت مچی طلایی', 'PRD-008', 5, 10, 2500000, 2200000, 8, 'active', TRUE, 4.9, 75),
('گردنبند نقره', 'Silver Necklace', 'گردنبند نقره با طراحی مدرن و زیبا. مناسب برای هدیه و استفاده شخصی.', 'گردنبند نقره', 'PRD-009', 4, 11, 680000, 580000, 35, 'active', FALSE, 4.1, 60),
('پیراهن مجلسی', 'Evening Dress', 'پیراهن مجلسی زیبا و شیک برای مراسمات خاص. طراحی منحصر به فرد و جنس با کیفیت.', 'پیراهن مجلسی', 'PRD-010', 1, 2, 1500000, 1300000, 10, 'active', TRUE, 4.7, 140)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Product Media
INSERT INTO product_media (product_id, type, url, thumbnail_url, alt_text, sort_order, is_primary) VALUES
(1, 'image', '/images/products/dress-1-1.jpg', '/images/products/dress-1-1-thumb.jpg', 'پیراهن تابستانی زارا', 1, TRUE),
(1, 'image', '/images/products/dress-1-2.jpg', '/images/products/dress-1-2-thumb.jpg', 'پیراهن تابستانی زارا - نمای پشت', 2, FALSE),
(1, 'image', '/images/products/dress-1-3.jpg', '/images/products/dress-1-3-thumb.jpg', 'پیراهن تابستانی زارا - جزئیات', 3, FALSE),
(2, 'image', '/images/products/blouse-1.jpg', '/images/products/blouse-1-thumb.jpg', 'بلوز سفید کلاسیک', 1, TRUE),
(3, 'image', '/images/products/jeans-1.jpg', '/images/products/jeans-1-thumb.jpg', 'شلوار جین فیت بالا', 1, TRUE),
(4, 'image', '/images/products/skirt-1.jpg', '/images/products/skirt-1-thumb.jpg', 'دامن میدی A', 1, TRUE),
(5, 'image', '/images/products/jacket-1.jpg', '/images/products/jacket-1-thumb.jpg', 'کاپشن زمستانی پشمی', 1, TRUE),
(6, 'image', '/images/products/bag-1.jpg', '/images/products/bag-1-thumb.jpg', 'کیف دستی چرمی', 1, TRUE),
(7, 'image', '/images/products/shoes-1.jpg', '/images/products/shoes-1-thumb.jpg', 'کفش پاشنه‌بلند', 1, TRUE),
(8, 'image', '/images/products/watch-1.jpg', '/images/products/watch-1-thumb.jpg', 'ساعت مچی طلایی', 1, TRUE),
(9, 'image', '/images/products/necklace-1.jpg', '/images/products/necklace-1-thumb.jpg', 'گردنبند نقره', 1, TRUE),
(10, 'image', '/images/products/evening-dress-1.jpg', '/images/products/evening-dress-1-thumb.jpg', 'پیراهن مجلسی', 1, TRUE)
ON DUPLICATE KEY UPDATE url=VALUES(url);

-- Insert Product Specifications
INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES
(1, 'جنس', 'پنبه 100%', 1),
(1, 'شستشو', 'قابل شستشو با ماشین', 2),
(1, 'کشور سازنده', 'اسپانیا', 3),
(2, 'جنس', 'پلی‌استر و پنبه', 1),
(2, 'شستشو', 'قابل شستشو با ماشین', 2),
(3, 'جنس', 'جین 98% پنبه', 1),
(3, 'شستشو', 'قابل شستشو با ماشین', 2),
(5, 'جنس', 'پشم 80%', 1),
(5, 'عایق', 'بله', 2)
ON DUPLICATE KEY UPDATE spec_value=VALUES(spec_value);

-- Insert Sample Users
-- Password for regular users: "password123"
-- Password hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- Admin password: "admin123"
-- Admin password hash: $2b$12$vrDgiQ1739j844VmkVjjGOdICEbGKFOaK1.N6kAIr8/bEPZrgiV2S
INSERT INTO users (email, mobile, password_hash, first_name, last_name, is_active, email_verified, mobile_verified, is_admin) VALUES
('sara.ahmadi@example.com', '09123456789', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'سارا', 'احمدی', TRUE, TRUE, TRUE, FALSE),
('maryam.karimi@example.com', '09129876543', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'مریم', 'کریمی', TRUE, TRUE, TRUE, FALSE),
('admin@shop.com', '09121111111', '$2b$12$vrDgiQ1739j844VmkVjjGOdICEbGKFOaK1.N6kAIr8/bEPZrgiV2S', 'مدیر', 'سیستم', TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_admin=VALUES(is_admin);

-- Insert User Addresses
INSERT INTO user_addresses (user_id, title, receiver_name, receiver_mobile, province, city, postal_code, address, is_default) VALUES
(1, 'خانه', 'سارا احمدی', '09123456789', 'تهران', 'تهران', '1234567890', 'خیابان ولیعصر، پلاک 123، واحد 4', TRUE),
(2, 'اداره', 'مریم کریمی', '09129876543', 'تهران', 'تهران', '1234567891', 'خیابان انقلاب، پلاک 456', TRUE)
ON DUPLICATE KEY UPDATE address=VALUES(address);

-- Insert Discounts
INSERT INTO discounts (code, title, description, type, value, min_purchase, usage_limit, starts_at, ends_at, is_active) VALUES
('WELCOME10', 'کد تخفیف خوش‌آمدگویی', '10 درصد تخفیف برای خرید اول', 'percentage', 10, 500000, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('SUMMER20', 'تخفیف تابستانی', '20 درصد تخفیف برای خریدهای بالای 2 میلیون', 'percentage', 20, 2000000, 500, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
('FREESHIP', 'ارسال رایگان', 'ارسال رایگان برای خریدهای بالای 500 هزار تومان', 'free_shipping', 0, 500000, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Insert Sample Reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment, pros, cons, is_verified_purchase, is_approved) VALUES
(1, 1, 5, 'خیلی عالی بود', 'پیراهن خیلی قشنگ و با کیفیت بود. جنس خوبی داره و اندازه هم درست بود.', 'کیفیت خوب، اندازه مناسب', 'هیچ', TRUE, TRUE),
(1, 2, 4, 'خوب بود', 'پیراهن خوبی بود ولی رنگش کمی با تصویر فرق داشت.', 'قیمت مناسب', 'رنگ کمی متفاوت', TRUE, TRUE),
(2, 1, 5, 'عالی', 'بلوز خیلی شیک و با کیفیت. پیشنهاد می‌کنم.', 'کیفیت عالی', 'هیچ', TRUE, TRUE),
(3, 2, 4, 'راحت و شیک', 'شلوار جین خیلی راحته و فیت خوبی داره.', 'راحت، فیت خوب', 'هیچ', TRUE, TRUE)
ON DUPLICATE KEY UPDATE comment=VALUES(comment);

-- ============================================
-- END OF DATABASE SETUP
-- ============================================

