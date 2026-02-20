package handlers

import (
	"net/http"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	var req struct {
		SessionID    string `json:"session_id" binding:"required"`
		CustomerName string `json:"customer_name" binding:"required"`
		Email        string `json:"email" binding:"required,email"`
		Phone        string `json:"phone" binding:"required"`
		Address      string `json:"address" binding:"required"`
		City         string `json:"city" binding:"required"`
		State        string `json:"state" binding:"required"`
		ZipCode      string `json:"zip_code" binding:"required"`
		Country      string `json:"country" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get cart items
	query := `
		SELECT ci.product_id, ci.quantity, p.price
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.session_id = ?
	`

	rows, err := database.DB.Query(query, req.SessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var items []struct {
		ProductID int
		Quantity  int
		Price     float64
	}
	total := 0.0

	for rows.Next() {
		var item struct {
			ProductID int
			Quantity  int
			Price     float64
		}
		err := rows.Scan(&item.ProductID, &item.Quantity, &item.Price)
		if err != nil {
			continue
		}
		items = append(items, item)
		total += item.Price * float64(item.Quantity)
	}

	if len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Start transaction
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	// Create order
	result, err := tx.Exec(
		`INSERT INTO orders (session_id, customer_name, email, phone, address, city, state, zip_code, country, total, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
		req.SessionID, req.CustomerName, req.Email, req.Phone, req.Address, req.City, req.State, req.ZipCode, req.Country, total, time.Now(), time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	orderID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create order items and update stock
	for _, item := range items {
		_, err = tx.Exec(
			"INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
			orderID, item.ProductID, item.Quantity, item.Price,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		_, err = tx.Exec(
			"UPDATE products SET stock = stock - ? WHERE id = ?",
			item.Quantity, item.ProductID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Clear cart
	_, err = tx.Exec("DELETE FROM cart_items WHERE session_id = ?", req.SessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"order_id": orderID,
	})
}

func GetOrder(c *gin.Context) {
	orderID := c.Param("id")

	query := `
		SELECT o.id, o.session_id, o.customer_name, o.email, o.phone, o.address, o.city, o.state, o.zip_code, o.country, o.total, o.status, o.created_at, o.updated_at
		FROM orders o
		WHERE o.id = ?
	`

	var order struct {
		ID           int
		SessionID    string
		CustomerName string
		Email        string
		Phone        string
		Address      string
		City         string
		State        string
		ZipCode      string
		Country      string
		Total        float64
		Status       string
		CreatedAt    string
		UpdatedAt    string
	}

	err := database.DB.QueryRow(query, orderID).Scan(
		&order.ID, &order.SessionID, &order.CustomerName, &order.Email, &order.Phone,
		&order.Address, &order.City, &order.State, &order.ZipCode, &order.Country,
		&order.Total, &order.Status, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Get order items
	itemsQuery := `
		SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
		       p.name, p.image_url
		FROM order_items oi
		JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = ?
	`

	rows, err := database.DB.Query(itemsQuery, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	for rows.Next() {
		var item struct {
			ID        int
			OrderID   int
			ProductID int
			Quantity  int
			Price     float64
			PName     string
			PImageURL string
		}
		err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.Quantity, &item.Price, &item.PName, &item.PImageURL)
		if err != nil {
			continue
		}

		orderItem := map[string]interface{}{
			"id":         item.ID,
			"product_id": item.ProductID,
			"quantity":   item.Quantity,
			"price":      item.Price,
			"product": map[string]interface{}{
				"name":      item.PName,
				"image_url": item.PImageURL,
			},
		}
		items = append(items, orderItem)
	}

	orderResponse := map[string]interface{}{
		"id":            order.ID,
		"session_id":    order.SessionID,
		"customer_name": order.CustomerName,
		"email":         order.Email,
		"phone":         order.Phone,
		"address":       order.Address,
		"city":          order.City,
		"state":         order.State,
		"zip_code":      order.ZipCode,
		"country":       order.Country,
		"total":         order.Total,
		"status":         order.Status,
		"items":         items,
		"created_at":    order.CreatedAt,
		"updated_at":    order.UpdatedAt,
	}

	c.JSON(http.StatusOK, orderResponse)
}

