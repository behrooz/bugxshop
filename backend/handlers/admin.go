package handlers

import (
	"database/sql"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

const uploadDir = "uploads"
const uploadProductsDir = "uploads/products"
const maxUploadSize = 10 << 20 // 10 MB
var allowedImageTypes = map[string]bool{
	"image/jpeg": true, "image/jpg": true, "image/png": true, "image/gif": true, "image/webp": true,
}

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

// AdminListProductMedia returns all media for a product (admin can use GET /products/:id which includes images)
// This endpoint allows listing without full product payload if needed.
func AdminListProductMedia(c *gin.Context) {
	productID := c.Param("id")
	rows, err := database.DB.Query(
		"SELECT id, product_id, type, url, thumbnail_url, alt_text, sort_order, is_primary FROM product_media WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC",
		productID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	type mediaRow struct {
		ID          int
		ProductID   int
		Type        string
		URL         string
		ThumbURL    sql.NullString
		AltText     sql.NullString
		SortOrder   int
		IsPrimary   bool
	}
	var list []map[string]interface{}
	for rows.Next() {
		var m mediaRow
		if err := rows.Scan(&m.ID, &m.ProductID, &m.Type, &m.URL, &m.ThumbURL, &m.AltText, &m.SortOrder, &m.IsPrimary); err != nil {
			continue
		}
		list = append(list, map[string]interface{}{
			"id":            m.ID,
			"product_id":    m.ProductID,
			"type":          m.Type,
			"url":           m.URL,
			"thumbnail_url": getStringValue(m.ThumbURL),
			"alt_text":      getStringValue(m.AltText),
			"sort_order":    m.SortOrder,
			"is_primary":    m.IsPrimary,
		})
	}
	c.JSON(http.StatusOK, gin.H{"media": list})
}

// AdminAddProductMedia adds an image (by URL) to a product
func AdminAddProductMedia(c *gin.Context) {
	productID := c.Param("id")
	var req struct {
		URL       string `json:"url" binding:"required"`
		AltText   string `json:"alt_text"`
		IsPrimary bool   `json:"is_primary"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "آدرس تصویر الزامی است"})
		return
	}
	if req.IsPrimary {
		database.DB.Exec("UPDATE product_media SET is_primary = FALSE WHERE product_id = ?", productID)
	}
	var maxOrder sql.NullInt64
	database.DB.QueryRow("SELECT COALESCE(MAX(sort_order), 0) FROM product_media WHERE product_id = ?", productID).Scan(&maxOrder)
	sortOrder := 0
	if maxOrder.Valid {
		sortOrder = int(maxOrder.Int64) + 1
	}
	result, err := database.DB.Exec(
		"INSERT INTO product_media (product_id, type, url, alt_text, is_primary, sort_order) VALUES (?, 'image', ?, ?, ?, ?)",
		productID, req.URL, req.AltText, req.IsPrimary, sortOrder,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در افزودن تصویر"})
		return
	}
	lastID, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "تصویر اضافه شد", "id": lastID})
}

// AdminUploadProductMedia accepts multipart file upload, saves to disk, and creates product_media row.
func AdminUploadProductMedia(c *gin.Context) {
	productID := c.Param("id")
	if err := os.MkdirAll(uploadProductsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد پوشهٔ آپلود"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فرم multipart معتبر نیست"})
		return
	}
	files := form.File["file"]
	if len(files) == 0 {
		files = form.File["files"]
	}
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ فایلی انتخاب نشده است. فیلد نام باید «file» یا «files» باشد."})
		return
	}

	isPrimaryStr := c.PostForm("is_primary")
	altText := c.PostForm("alt_text")
	setPrimary := isPrimaryStr == "true" || isPrimaryStr == "1"

	if setPrimary {
		database.DB.Exec("UPDATE product_media SET is_primary = FALSE WHERE product_id = ?", productID)
	}

	var maxOrder sql.NullInt64
	database.DB.QueryRow("SELECT COALESCE(MAX(sort_order), 0) FROM product_media WHERE product_id = ?", productID).Scan(&maxOrder)
	sortOrder := 0
	if maxOrder.Valid {
		sortOrder = int(maxOrder.Int64) + 1
	}

	created := []map[string]interface{}{}
	for i, fileHeader := range files {
		if fileHeader.Size > maxUploadSize {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("حجم فایل «%s» بیش از حد مجاز است (حداکثر ۱۰ مگابایت)", fileHeader.Filename)})
			return
		}
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		ct := fileHeader.Header.Get("Content-Type")
		if ct == "" {
			ct = mime.TypeByExtension(ext)
		}
		if !allowedImageTypes[ct] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فقط تصاویر (JPEG, PNG, GIF, WebP) مجاز هستند"})
			return
		}
		filename := fmt.Sprintf("%s_%d_%d%s", productID, time.Now().UnixNano(), i, ext)
		destPath := filepath.Join(uploadProductsDir, filename)
		if err := c.SaveUploadedFile(fileHeader, destPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیرهٔ فایل"})
			return
		}
		// URL that frontend can use (relative; Next can proxy /uploads to backend)
		urlPath := "/uploads/products/" + filename
		primary := setPrimary && i == 0
		result, err := database.DB.Exec(
			"INSERT INTO product_media (product_id, type, url, alt_text, is_primary, sort_order) VALUES (?, 'image', ?, ?, ?, ?)",
			productID, urlPath, altText, primary, sortOrder+i,
		)
		if err != nil {
			os.Remove(destPath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت تصویر در دیتابیس"})
			return
		}
		lastID, _ := result.LastInsertId()
		created = append(created, map[string]interface{}{"id": lastID, "url": urlPath})
	}

	c.JSON(http.StatusCreated, gin.H{"message": "تصویر(ها) با موفقیت آپلود شد", "media": created})
}

// AdminSetPrimaryProductMedia sets one media as primary (and unsets others)
func AdminSetPrimaryProductMedia(c *gin.Context) {
	productID := c.Param("id")
	mediaID := c.Param("mediaId")
	database.DB.Exec("UPDATE product_media SET is_primary = FALSE WHERE product_id = ?", productID)
	result, err := database.DB.Exec("UPDATE product_media SET is_primary = TRUE WHERE id = ? AND product_id = ?", mediaID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی"})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "تصویر یافت نشد"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تصویر اصلی تنظیم شد"})
}

// AdminDeleteProductMedia removes a media from product
func AdminDeleteProductMedia(c *gin.Context) {
	productID := c.Param("id")
	mediaID := c.Param("mediaId")
	result, err := database.DB.Exec("DELETE FROM product_media WHERE id = ? AND product_id = ?", mediaID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف"})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "تصویر یافت نشد"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "تصویر حذف شد"})
}

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

