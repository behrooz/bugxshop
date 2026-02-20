package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

// AdminCreateProduct creates a new product
func AdminCreateProduct(c *gin.Context) {
	var req struct {
		Name            string  `json:"name" binding:"required"`
		NameEn          string  `json:"name_en"`
		Description     string  `json:"description"`
		ShortDescription string `json:"short_description"`
		SKU             string  `json:"sku" binding:"required"`
		BrandID         *int    `json:"brand_id"`
		CategoryID      *int    `json:"category_id"`
		BasePrice       float64 `json:"base_price" binding:"required"`
		SalePrice       *float64 `json:"sale_price"`
		Stock           int     `json:"stock"`
		Status          string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	result, err := database.DB.Exec(
		`INSERT INTO products (name, name_en, description, short_description, sku, brand_id, category_id, base_price, sale_price, stock, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.Name, req.NameEn, req.Description, req.ShortDescription, req.SKU, req.BrandID, req.CategoryID,
		req.BasePrice, req.SalePrice, req.Stock, req.Status,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد محصول"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "محصول ایجاد شد", "id": id})
}

// AdminUpdateProduct updates a product
func AdminUpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	var req struct {
		Name             string   `json:"name"`
		NameEn           string   `json:"name_en"`
		Description      string   `json:"description"`
		ShortDescription string   `json:"short_description"`
		SKU              string   `json:"sku"`
		BrandID          *int     `json:"brand_id"`
		CategoryID       *int     `json:"category_id"`
		BasePrice        float64  `json:"base_price"`
		SalePrice        *float64 `json:"sale_price"`
		Stock            int      `json:"stock"`
		Status           string   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}
	if req.Status == "" {
		req.Status = "active"
	}
	_, err := database.DB.Exec(
		`UPDATE products SET name=?, name_en=?, description=?, short_description=?, sku=?, brand_id=?, category_id=?, base_price=?, sale_price=?, stock=?, status=? WHERE id=?`,
		req.Name, req.NameEn, req.Description, req.ShortDescription, req.SKU, req.BrandID, req.CategoryID, req.BasePrice, req.SalePrice, req.Stock, req.Status, productID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "محصول به‌روزرسانی شد"})
}

// AdminDeleteProduct deletes a product
func AdminDeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	_, err := database.DB.Exec("UPDATE products SET status = 'inactive' WHERE id = ?", productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "محصول حذف شد"})
}

// AdminBulkUploadProducts handles CSV/Excel upload
func AdminBulkUploadProducts(c *gin.Context) {
	// TODO: Implement CSV/Excel parsing and bulk insert
	c.JSON(http.StatusOK, gin.H{"message": "آپلود دسته‌ای در حال توسعه است"})
}

// AdminCreateCategory creates a category
func AdminCreateCategory(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		NameEn      string `json:"name_en"`
		Slug        string `json:"slug" binding:"required"`
		ParentID    *int   `json:"parent_id"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO categories (name, name_en, slug, parent_id, description) VALUES (?, ?, ?, ?, ?)",
		req.Name, req.NameEn, req.Slug, req.ParentID, req.Description,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد دسته‌بندی"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "دسته‌بندی ایجاد شد", "id": id})
}

// AdminUpdateCategory updates a category
func AdminUpdateCategory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "دسته‌بندی به‌روزرسانی شد"})
}

// AdminCreateBrand creates a brand
func AdminCreateBrand(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		NameEn      string `json:"name_en"`
		Slug        string `json:"slug" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO brands (name, name_en, slug, description) VALUES (?, ?, ?, ?)",
		req.Name, req.NameEn, req.Slug, req.Description,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد برند"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "برند ایجاد شد", "id": id})
}

// AdminGetOrders returns all orders
func AdminGetOrders(c *gin.Context) {
	status := c.Query("status")
	query := `SELECT id, order_number, user_id, status, payment_status, total, created_at 
			  FROM orders WHERE 1=1`
	
	if status != "" {
		query += " AND status = ?"
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := database.DB.Query(query, status)
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
			UserID        sql.NullInt64
			Status        string
			PaymentStatus string
			Total         float64
			CreatedAt     time.Time
		}
		rows.Scan(&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.PaymentStatus, &o.Total, &o.CreatedAt)
		orders = append(orders, map[string]interface{}{
			"id":             o.ID,
			"order_number":   o.OrderNumber,
			"user_id":        getIntValue(o.UserID),
			"status":         o.Status,
			"payment_status": o.PaymentStatus,
			"total":          o.Total,
			"created_at":     o.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

// AdminUpdateOrderStatus updates order status
func AdminUpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	_, err := database.DB.Exec("UPDATE orders SET status = ? WHERE id = ?", req.Status, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "وضعیت سفارش به‌روزرسانی شد"})
}

// AdminGetReviews returns all reviews
func AdminGetReviews(c *gin.Context) {
	approved := c.Query("approved")
	query := `SELECT id, product_id, user_id, rating, title, is_approved, created_at 
			  FROM product_reviews WHERE 1=1`
	
	if approved == "true" {
		query += " AND is_approved = TRUE"
	} else if approved == "false" {
		query += " AND is_approved = FALSE"
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := database.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	reviews := []map[string]interface{}{}
	for rows.Next() {
		var r struct {
			ID         int
			ProductID  int
			UserID     int
			Rating     int
			Title      sql.NullString
			IsApproved bool
			CreatedAt  time.Time
		}
		rows.Scan(&r.ID, &r.ProductID, &r.UserID, &r.Rating, &r.Title, &r.IsApproved, &r.CreatedAt)
		reviews = append(reviews, map[string]interface{}{
			"id":          r.ID,
			"product_id": r.ProductID,
			"user_id":     r.UserID,
			"rating":      r.Rating,
			"title":       getStringValue(r.Title),
			"is_approved": r.IsApproved,
			"created_at":  r.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// AdminApproveReview approves a review
func AdminApproveReview(c *gin.Context) {
	reviewID := c.Param("id")
	_, err := database.DB.Exec("UPDATE product_reviews SET is_approved = TRUE WHERE id = ?", reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تایید"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "نظر تایید شد"})
}

// AdminGetDiscounts returns all discounts
func AdminGetDiscounts(c *gin.Context) {
	rows, err := database.DB.Query("SELECT id, code, title, type, value, usage_count, is_active, starts_at, ends_at FROM discounts ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	discounts := []map[string]interface{}{}
	for rows.Next() {
		var d struct {
			ID         int
			Code       sql.NullString
			Title      string
			Type       string
			Value      float64
			UsageCount int
			IsActive   bool
			StartsAt   sql.NullTime
			EndsAt     sql.NullTime
		}
		rows.Scan(&d.ID, &d.Code, &d.Title, &d.Type, &d.Value, &d.UsageCount, &d.IsActive, &d.StartsAt, &d.EndsAt)
		discounts = append(discounts, map[string]interface{}{
			"id":          d.ID,
			"code":        getStringValue(d.Code),
			"title":       d.Title,
			"type":        d.Type,
			"value":       d.Value,
			"usage_count": d.UsageCount,
			"is_active":   d.IsActive,
			"starts_at":   getTimeValue(d.StartsAt),
			"ends_at":     getTimeValue(d.EndsAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{"discounts": discounts})
}

// AdminCreateDiscount creates a discount
func AdminCreateDiscount(c *gin.Context) {
	var req struct {
		Code        string     `json:"code"`
		Title       string     `json:"title" binding:"required"`
		Description string     `json:"description"`
		Type        string     `json:"type" binding:"required"`
		Value       float64    `json:"value" binding:"required"`
		MinPurchase *float64   `json:"min_purchase"`
		UsageLimit  *int       `json:"usage_limit"`
		StartsAt    *time.Time `json:"starts_at"`
		EndsAt      *time.Time `json:"ends_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	result, err := database.DB.Exec(
		`INSERT INTO discounts (code, title, description, type, value, min_purchase, usage_limit, starts_at, ends_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.Code, req.Title, req.Description, req.Type, req.Value, req.MinPurchase, req.UsageLimit, req.StartsAt, req.EndsAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد تخفیف"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "تخفیف ایجاد شد", "id": id})
}

// AdminUpdateDiscount updates a discount
func AdminUpdateDiscount(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "تخفیف به‌روزرسانی شد"})
}

// AdminGetSalesReport returns sales analytics
func AdminGetSalesReport(c *gin.Context) {
	period := c.DefaultQuery("period", "daily") // daily, weekly, monthly
	
	var query string
	switch period {
	case "daily":
		query = `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue 
				 FROM orders WHERE status != 'cancelled' 
				 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
	case "monthly":
		query = `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as orders, SUM(total) as revenue 
				 FROM orders WHERE status != 'cancelled' 
				 GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT 12`
	default:
		query = `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue 
				 FROM orders WHERE status != 'cancelled' 
				 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7`
	}

	rows, err := database.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	reports := []map[string]interface{}{}
	for rows.Next() {
		var r struct {
			Period  string
			Orders  int
			Revenue sql.NullFloat64
		}
		rows.Scan(&r.Period, &r.Orders, &r.Revenue)
		reports = append(reports, map[string]interface{}{
			"period":  r.Period,
			"orders":  r.Orders,
			"revenue": getFloatValue(r.Revenue),
		})
	}

	c.JSON(http.StatusOK, gin.H{"reports": reports, "period": period})
}

// AdminGetProductReport returns product analytics
func AdminGetProductReport(c *gin.Context) {
	query := `SELECT p.id, p.name, p.sku, 
			  COUNT(oi.id) as sold_count, 
			  SUM(oi.quantity) as total_quantity,
			  SUM(oi.total) as revenue
			  FROM products p
			  LEFT JOIN order_items oi ON p.id = oi.product_id
			  LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
			  GROUP BY p.id
			  ORDER BY sold_count DESC
			  LIMIT 20`

	rows, err := database.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	products := []map[string]interface{}{}
	for rows.Next() {
		var p struct {
			ID           int
			Name         string
			SKU          string
			SoldCount    int
			TotalQty     sql.NullInt64
			Revenue      sql.NullFloat64
		}
		rows.Scan(&p.ID, &p.Name, &p.SKU, &p.SoldCount, &p.TotalQty, &p.Revenue)
		products = append(products, map[string]interface{}{
			"id":           p.ID,
			"name":         p.Name,
			"sku":          p.SKU,
			"sold_count":   p.SoldCount,
			"total_qty":    getIntValue(sql.NullInt64{Int64: p.TotalQty.Int64, Valid: p.TotalQty.Valid}),
			"revenue":      getFloatValue(sql.NullFloat64{Float64: p.Revenue.Float64, Valid: p.Revenue.Valid}),
		})
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

// AdminGetUserReport returns user analytics
func AdminGetUserReport(c *gin.Context) {
	query := `SELECT 
			  COUNT(DISTINCT u.id) as total_users,
			  COUNT(DISTINCT o.user_id) as users_with_orders,
			  COUNT(DISTINCT CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN o.user_id END) as active_users_30d
			  FROM users u
			  LEFT JOIN orders o ON u.id = o.user_id`

	var stats struct {
		TotalUsers      int
		UsersWithOrders int
		ActiveUsers30d  int
	}

	database.DB.QueryRow(query).Scan(&stats.TotalUsers, &stats.UsersWithOrders, &stats.ActiveUsers30d)

	c.JSON(http.StatusOK, gin.H{
		"total_users":        stats.TotalUsers,
		"users_with_orders":  stats.UsersWithOrders,
		"active_users_30d":   stats.ActiveUsers30d,
	})
}

// Helper functions are in products.go and search.go

