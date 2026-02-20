package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

// Helper functions are in products.go

func AddToCart(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.GetHeader("X-Session-ID")

	var req struct {
		ProductID int  `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,min=1"`
		VariantID *int `json:"variant_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if product exists and get price/stock
	var stock int
	var basePrice, salePrice sql.NullFloat64
	err := database.DB.QueryRow(
		"SELECT stock, base_price, sale_price FROM products WHERE id = ? AND status = 'active'",
		req.ProductID,
	).Scan(&stock, &basePrice, &salePrice)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "محصول یافت نشد"})
		return
	}

	if stock < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "موجودی کافی نیست"})
		return
	}

	// Get product price (use sale_price if available, otherwise base_price)
	productPrice := basePrice.Float64
	if salePrice.Valid {
		productPrice = salePrice.Float64
	}

	// Check if item already in cart
	var existingID, existingQty int
	query := "SELECT id, quantity FROM cart_items WHERE product_id = ?"
	args := []interface{}{req.ProductID}

	if userID > 0 {
		query += " AND user_id = ?"
		args = append(args, userID)
	} else if sessionID != "" {
		query += " AND session_id = ?"
		args = append(args, sessionID)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نیاز به احراز هویت یا session"})
		return
	}

	if req.VariantID != nil {
		query += " AND variant_id = ?"
		args = append(args, *req.VariantID)
	} else {
		query += " AND variant_id IS NULL"
	}

	err = database.DB.QueryRow(query, args...).Scan(&existingID, &existingQty)

	if err == nil {
		// Update existing item
		newQty := existingQty + req.Quantity
		if newQty > stock {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
			return
		}
		_, err = database.DB.Exec(
			"UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?",
			newQty, time.Now(), existingID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Cart updated"})
		return
	}

	// Insert new item
	if userID > 0 {
		_, err = database.DB.Exec(
			"INSERT INTO cart_items (user_id, product_id, variant_id, quantity, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			userID, req.ProductID, req.VariantID, req.Quantity, productPrice, time.Now(), time.Now(),
		)
	} else {
		_, err = database.DB.Exec(
			"INSERT INTO cart_items (session_id, product_id, variant_id, quantity, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			sessionID, req.ProductID, req.VariantID, req.Quantity, productPrice, time.Now(), time.Now(),
		)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Item added to cart"})
}

func GetCart(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.GetHeader("X-Session-ID")

	if userID == 0 && sessionID == "" {
		c.JSON(http.StatusOK, gin.H{"items": []interface{}{}, "total": 0})
		return
	}

	var query string
	var args []interface{}

	if userID > 0 {
		query = `
			SELECT ci.id, ci.user_id, ci.product_id, ci.variant_id, ci.quantity, ci.price, ci.created_at, ci.updated_at,
			       p.id, p.name, p.name_en, p.description, p.base_price, p.sale_price, p.sku, p.stock,
			       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
			FROM cart_items ci
			JOIN products p ON ci.product_id = p.id
			WHERE ci.user_id = ?
		`
		args = []interface{}{userID}
	} else {
		query = `
			SELECT ci.id, ci.session_id, ci.product_id, ci.variant_id, ci.quantity, ci.price, ci.created_at, ci.updated_at,
			       p.id, p.name, p.name_en, p.description, p.base_price, p.sale_price, p.sku, p.stock,
			       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
			FROM cart_items ci
			JOIN products p ON ci.product_id = p.id
			WHERE ci.session_id = ?
		`
		args = []interface{}{sessionID}
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	total := 0.0

	for rows.Next() {
		var ci struct {
			ID        int
			UserID    sql.NullInt64
			SessionID sql.NullString
			ProductID int
			VariantID sql.NullInt64
			Quantity  int
			Price     float64
			CreatedAt time.Time
			UpdatedAt time.Time
			PID       int
			PName     string
			NameEn    sql.NullString
			PDesc     sql.NullString
			BasePrice float64
			SalePrice sql.NullFloat64
			PSKU      string
			PStock    int
			ImageURL  sql.NullString
		}

		var scanArgs []interface{}
		if userID > 0 {
			scanArgs = []interface{}{&ci.ID, &ci.UserID, &ci.ProductID, &ci.VariantID, &ci.Quantity, &ci.Price, &ci.CreatedAt, &ci.UpdatedAt,
				&ci.PID, &ci.PName, &ci.NameEn, &ci.PDesc, &ci.BasePrice, &ci.SalePrice, &ci.PSKU, &ci.PStock, &ci.ImageURL}
		} else {
			scanArgs = []interface{}{&ci.ID, &ci.SessionID, &ci.ProductID, &ci.VariantID, &ci.Quantity, &ci.Price, &ci.CreatedAt, &ci.UpdatedAt,
				&ci.PID, &ci.PName, &ci.NameEn, &ci.PDesc, &ci.BasePrice, &ci.SalePrice, &ci.PSKU, &ci.PStock, &ci.ImageURL}
		}

		err := rows.Scan(scanArgs...)
		if err != nil {
			continue
		}

		itemTotal := ci.Price * float64(ci.Quantity)
		total += itemTotal

		productPrice := ci.BasePrice
		if ci.SalePrice.Valid {
			productPrice = ci.SalePrice.Float64
		}

		item := map[string]interface{}{
			"id":         ci.ID,
			"product_id": ci.ProductID,
			"variant_id": getIntValue(ci.VariantID),
			"quantity":   ci.Quantity,
			"price":      ci.Price,
			"item_total": itemTotal,
			"product": map[string]interface{}{
				"id":          ci.PID,
				"name":        ci.PName,
				"name_en":     getStringValue(ci.NameEn),
				"description": getStringValue(ci.PDesc),
				"base_price":  ci.BasePrice,
				"sale_price":  getFloatValue(ci.SalePrice),
				"price":       productPrice,
				"image_url":   getStringValue(ci.ImageURL),
				"sku":         ci.PSKU,
				"stock":       ci.PStock,
			},
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
	})
}

func UpdateCartItem(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.GetHeader("X-Session-ID")
	itemID := c.Param("itemId")

	var req struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get product stock
	var productID, stock int
	var err error
	var query string
	if userID > 0 {
		query = "SELECT product_id FROM cart_items WHERE id = ? AND user_id = ?"
		err = database.DB.QueryRow(query, itemID, userID).Scan(&productID)
	} else if sessionID != "" {
		query = "SELECT product_id FROM cart_items WHERE id = ? AND session_id = ?"
		err = database.DB.QueryRow(query, itemID, sessionID).Scan(&productID)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نیاز به احراز هویت یا session"})
		return
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "آیتم سبد خرید یافت نشد"})
		return
	}

	err = database.DB.QueryRow("SELECT stock FROM products WHERE id = ?", productID).Scan(&stock)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	if req.Quantity > stock {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
		return
	}

	if userID > 0 {
		_, err = database.DB.Exec(
			"UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?",
			req.Quantity, time.Now(), itemID, userID,
		)
	} else {
		_, err = database.DB.Exec(
			"UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND session_id = ?",
			req.Quantity, time.Now(), itemID, sessionID,
		)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item updated"})
}

func RemoveFromCart(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.GetHeader("X-Session-ID")
	itemID := c.Param("itemId")

	var err error
	if userID > 0 {
		_, err = database.DB.Exec(
			"DELETE FROM cart_items WHERE id = ? AND user_id = ?",
			itemID, userID,
		)
	} else if sessionID != "" {
		_, err = database.DB.Exec(
			"DELETE FROM cart_items WHERE id = ? AND session_id = ?",
			itemID, sessionID,
		)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نیاز به احراز هویت یا session"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed from cart"})
}

func ClearCart(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.GetHeader("X-Session-ID")

	var err error
	if userID > 0 {
		_, err = database.DB.Exec("DELETE FROM cart_items WHERE user_id = ?", userID)
	} else if sessionID != "" {
		_, err = database.DB.Exec("DELETE FROM cart_items WHERE session_id = ?", sessionID)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نیاز به احراز هویت یا session"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}
