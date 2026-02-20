package models

import "time"

type Product struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Price       float64   `json:"price" db:"price"`
	ImageURL    string    `json:"image_url" db:"image_url"`
	CategoryID  int       `json:"category_id" db:"category_id"`
	Category    *Category `json:"category,omitempty"`
	SKU         string    `json:"sku" db:"sku"`
	Stock       int       `json:"stock" db:"stock"`
	Size        string    `json:"size" db:"size"`
	Color       string    `json:"color" db:"color"`
	Material    string    `json:"material" db:"material"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Category struct {
	ID          int    `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Slug        string `json:"slug" db:"slug"`
	Description string `json:"description" db:"description"`
	ImageURL    string `json:"image_url" db:"image_url"`
}

type CartItem struct {
	ID        int     `json:"id" db:"id"`
	SessionID string  `json:"session_id" db:"session_id"`
	ProductID int     `json:"product_id" db:"product_id"`
	Product   Product `json:"product,omitempty"`
	Quantity  int     `json:"quantity" db:"quantity"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Order struct {
	ID           int         `json:"id" db:"id"`
	SessionID    string      `json:"session_id" db:"session_id"`
	CustomerName string      `json:"customer_name" db:"customer_name"`
	Email        string      `json:"email" db:"email"`
	Phone        string      `json:"phone" db:"phone"`
	Address      string      `json:"address" db:"address"`
	City         string      `json:"city" db:"city"`
	State        string      `json:"state" db:"state"`
	ZipCode      string      `json:"zip_code" db:"zip_code"`
	Country      string      `json:"country" db:"country"`
	Total        float64     `json:"total" db:"total"`
	Status       string      `json:"status" db:"status"`
	Items        []OrderItem  `json:"items,omitempty"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at" db:"updated_at"`
}

type OrderItem struct {
	ID        int     `json:"id" db:"id"`
	OrderID   int     `json:"order_id" db:"order_id"`
	ProductID int     `json:"product_id" db:"product_id"`
	Product   Product `json:"product,omitempty"`
	Quantity  int     `json:"quantity" db:"quantity"`
	Price     float64 `json:"price" db:"price"`
}

