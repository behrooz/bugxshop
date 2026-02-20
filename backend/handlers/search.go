package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

// GetSearchSuggestions returns search autocomplete suggestions
func GetSearchSuggestions(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{}})
		return
	}

	// Get product suggestions
	rows, err := database.DB.Query(
		`SELECT DISTINCT name FROM products 
		 WHERE (name LIKE ? OR name_en LIKE ?) AND status = 'active'
		 LIMIT 10`,
		"%"+query+"%", "%"+query+"%",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	suggestions := []string{}
	for rows.Next() {
		var name string
		rows.Scan(&name)
		suggestions = append(suggestions, name)
	}

	// Save search to history
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID != "" {
		database.DB.Exec(
			"INSERT INTO search_history (session_id, query, results_count) VALUES (?, ?, ?)",
			sessionID, query, len(suggestions),
		)
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

// GetBrands returns all brands
func GetBrands(c *gin.Context) {
	rows, err := database.DB.Query("SELECT id, name, name_en, slug, logo_url FROM brands WHERE is_active = TRUE ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	brands := []map[string]interface{}{}
	for rows.Next() {
		var b struct {
			ID      int
			Name    string
			NameEn  sql.NullString
			Slug    string
			LogoURL sql.NullString
		}
		rows.Scan(&b.ID, &b.Name, &b.NameEn, &b.Slug, &b.LogoURL)
		brands = append(brands, map[string]interface{}{
			"id":       b.ID,
			"name":     b.Name,
			"name_en":  getStringValue(b.NameEn),
			"slug":     b.Slug,
			"logo_url": getStringValue(b.LogoURL),
		})
	}

	c.JSON(http.StatusOK, gin.H{"brands": brands})
}

// GetProductReviews returns reviews for a product
func GetProductReviews(c *gin.Context) {
	productID := c.Param("id")
	
	rows, err := database.DB.Query(
		`SELECT r.id, r.user_id, r.rating, r.title, r.comment, r.pros, r.cons, 
		 r.is_verified_purchase, r.helpful_count, r.created_at,
		 u.first_name, u.last_name
		 FROM product_reviews r
		 JOIN users u ON r.user_id = u.id
		 WHERE r.product_id = ? AND r.is_approved = TRUE
		 ORDER BY r.created_at DESC
		 LIMIT 20`,
		productID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	reviews := []map[string]interface{}{}
	for rows.Next() {
		var r struct {
			ID                int
			UserID            int
			Rating            int
			Title             sql.NullString
			Comment           sql.NullString
			Pros              sql.NullString
			Cons              sql.NullString
			IsVerifiedPurchase bool
			HelpfulCount      int
			CreatedAt         sql.NullTime
			FirstName         sql.NullString
			LastName          sql.NullString
		}
		rows.Scan(&r.ID, &r.UserID, &r.Rating, &r.Title, &r.Comment, &r.Pros, &r.Cons,
			&r.IsVerifiedPurchase, &r.HelpfulCount, &r.CreatedAt, &r.FirstName, &r.LastName)
		
		reviews = append(reviews, map[string]interface{}{
			"id":                  r.ID,
			"user_id":             r.UserID,
			"user_name":           getStringValue(r.FirstName) + " " + getStringValue(r.LastName),
			"rating":              r.Rating,
			"title":               getStringValue(r.Title),
			"comment":             getStringValue(r.Comment),
			"pros":                getStringValue(r.Pros),
			"cons":                getStringValue(r.Cons),
			"is_verified_purchase": r.IsVerifiedPurchase,
			"helpful_count":       r.HelpfulCount,
			"created_at":          getTimeValue(r.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// GetUserOrders returns user's orders
func GetUserOrders(c *gin.Context) {
	userID := c.GetInt("user_id")
	
	rows, err := database.DB.Query(
		`SELECT id, order_number, status, payment_status, total, created_at 
		 FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	orders := []map[string]interface{}{}
	for rows.Next() {
		var o struct {
			ID            int
			OrderNumber   string
			Status        string
			PaymentStatus string
			Total         float64
			CreatedAt     sql.NullTime
		}
		rows.Scan(&o.ID, &o.OrderNumber, &o.Status, &o.PaymentStatus, &o.Total, &o.CreatedAt)
		orders = append(orders, map[string]interface{}{
			"id":             o.ID,
			"order_number":   o.OrderNumber,
			"status":         o.Status,
			"payment_status": o.PaymentStatus,
			"total":          o.Total,
			"created_at":     getTimeValue(o.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// GetOrderTracking returns order tracking information
func GetOrderTracking(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetInt("user_id")

	var order struct {
		ID            int
		OrderNumber   string
		Status        string
		TrackingCode  sql.NullString
		CreatedAt     sql.NullTime
		UpdatedAt     sql.NullTime
	}

	err := database.DB.QueryRow(
		"SELECT id, order_number, status, tracking_code, created_at, updated_at FROM orders WHERE id = ? AND user_id = ?",
		orderID, userID,
	).Scan(&order.ID, &order.OrderNumber, &order.Status, &order.TrackingCode, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "سفارش یافت نشد"})
		return
	}

	// Status descriptions in Persian
	statusMap := map[string]string{
		"pending":    "در انتظار پرداخت",
		"confirmed":  "تایید شده",
		"processing": "در حال پردازش",
		"shipped":    "ارسال شده",
		"delivered":  "تحویل داده شده",
		"cancelled":  "لغو شده",
	}

		c.JSON(http.StatusOK, gin.H{
		"order_number":  order.OrderNumber,
		"status":        order.Status,
		"status_text":   statusMap[order.Status],
		"tracking_code": getStringValue(order.TrackingCode),
		"created_at":    getTimeValue(order.CreatedAt),
		"updated_at":    getTimeValue(order.UpdatedAt),
	})
}

// Helper functions
func getTimeValue(t sql.NullTime) *time.Time {
	if t.Valid {
		return &t.Time
	}
	return nil
}

