package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

func GetProducts(c *gin.Context) {
	query := `
		SELECT p.id, p.name, p.name_en, p.description, p.short_description,
		       p.base_price, p.sale_price, p.sku, p.stock, p.status,
		       p.category_id, p.brand_id, p.rating_average, p.rating_count,
		       c.id, c.name, c.slug,
		       b.id, b.name, b.slug,
		       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		WHERE p.status = 'active' AND p.stock > 0
		ORDER BY p.created_at DESC
	`

	// Handle pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	// Handle filters
	categoryID := c.Query("category_id")
	brandID := c.Query("brand_id")
	minPrice := c.Query("min_price")
	maxPrice := c.Query("max_price")

	whereClause := "WHERE p.status = 'active' AND p.stock > 0"
	args := []interface{}{}

	if categoryID != "" {
		whereClause += " AND p.category_id = ?"
		args = append(args, categoryID)
	}
	if brandID != "" {
		whereClause += " AND p.brand_id = ?"
		args = append(args, brandID)
	}
	if minPrice != "" {
		whereClause += " AND (COALESCE(p.sale_price, p.base_price) >= ?)"
		args = append(args, minPrice)
	}
	if maxPrice != "" {
		whereClause += " AND (COALESCE(p.sale_price, p.base_price) <= ?)"
		args = append(args, maxPrice)
	}

	query = `
		SELECT p.id, p.name, p.name_en, p.description, p.short_description,
		       p.base_price, p.sale_price, p.sku, p.stock, p.status,
		       p.category_id, p.brand_id, p.rating_average, p.rating_count,
		       c.id, c.name, c.slug,
		       b.id, b.name, b.slug,
		       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		` + whereClause + `
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`
	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	products := []map[string]interface{}{}
	for rows.Next() {
		var p struct {
			ID          int
			Name        string
			NameEn      sql.NullString
			Description sql.NullString
			ShortDesc   sql.NullString
			BasePrice   float64
			SalePrice   sql.NullFloat64
			SKU         string
			Stock       int
			Status      string
			CategoryID  sql.NullInt64
			BrandID     sql.NullInt64
			RatingAvg   sql.NullFloat64
			RatingCount int
			CatID       sql.NullInt64
			CatName     sql.NullString
			CatSlug     sql.NullString
			BrandID2    sql.NullInt64
			BrandName   sql.NullString
			BrandSlug   sql.NullString
			ImageURL    sql.NullString
		}
		err := rows.Scan(&p.ID, &p.Name, &p.NameEn, &p.Description, &p.ShortDesc,
			&p.BasePrice, &p.SalePrice, &p.SKU, &p.Stock, &p.Status,
			&p.CategoryID, &p.BrandID, &p.RatingAvg, &p.RatingCount,
			&p.CatID, &p.CatName, &p.CatSlug,
			&p.BrandID2, &p.BrandName, &p.BrandSlug,
			&p.ImageURL)
		if err != nil {
			log.Printf("[GetProducts] scan row error (id may vary): %v", err)
			continue
		}

		price := p.BasePrice
		if p.SalePrice.Valid {
			price = p.SalePrice.Float64
		}

		nameEn := getStringValue(p.NameEn)
		displayName := nameEn
		if displayName == "" {
			displayName = p.Name
		}
		desc := getStringValue(p.Description)
		shortDesc := getStringValue(p.ShortDesc)
		displayDesc := shortDesc
		if displayDesc == "" {
			displayDesc = desc
		}

		product := map[string]interface{}{
			"id":                 p.ID,
			"name":               p.Name,
			"name_en":            nameEn,
			"display_name":       displayName,
			"description":        desc,
			"short_description":   shortDesc,
			"display_description": displayDesc,
			"base_price":         p.BasePrice,
			"sale_price":         getFloatValue(p.SalePrice),
			"price":              price,
			"sku":                p.SKU,
			"stock":              p.Stock,
			"status":             p.Status,
			"rating_average":     getFloatValue(p.RatingAvg),
			"rating_count":       p.RatingCount,
			"image_url":          getStringValue(p.ImageURL),
			"category": map[string]interface{}{
				"id":   getIntValue(sql.NullInt64{Int64: p.CatID.Int64, Valid: p.CatID.Valid}),
				"name": getStringValue(p.CatName),
				"slug": getStringValue(p.CatSlug),
			},
			"brand": map[string]interface{}{
				"id":   getIntValue(sql.NullInt64{Int64: p.BrandID2.Int64, Valid: p.BrandID2.Valid}),
				"name": getStringValue(p.BrandName),
				"slug": getStringValue(p.BrandSlug),
			},
		}
		products = append(products, product)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"page":     page,
		"limit":    limit,
	})
}

// Helper functions
func getStringValue(s sql.NullString) string {
	if s.Valid {
		return s.String
	}
	return ""
}

func getIntValue(i sql.NullInt64) *int {
	if i.Valid {
		val := int(i.Int64)
		return &val
	}
	return nil
}

func getFloatValue(f sql.NullFloat64) *float64 {
	if f.Valid {
		return &f.Float64
	}
	return nil
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT p.id, p.name, p.name_en, p.description, p.short_description,
		       p.base_price, p.sale_price, p.sku, p.stock, p.rating_average, p.rating_count,
		       p.category_id, p.brand_id,
		       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url,
		       c.id, c.name, c.slug,
		       b.id, b.name, b.slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		WHERE p.id = ?
	`

	var p struct {
		ID            int
		Name          string
		NameEn        sql.NullString
		Description   sql.NullString
		ShortDesc     sql.NullString
		BasePrice     float64
		SalePrice     sql.NullFloat64
		SKU           string
		Stock         int
		RatingAvg     sql.NullFloat64
		RatingCount   int
		CategoryID    sql.NullInt64
		BrandID       sql.NullInt64
		ImageURL      sql.NullString
		CatID         sql.NullInt64
		CatName       sql.NullString
		CatSlug       sql.NullString
		BrandID2      sql.NullInt64
		BrandName     sql.NullString
		BrandSlug     sql.NullString
	}

	err := database.DB.QueryRow(query, id).Scan(
		&p.ID, &p.Name, &p.NameEn, &p.Description, &p.ShortDesc,
		&p.BasePrice, &p.SalePrice, &p.SKU, &p.Stock, &p.RatingAvg, &p.RatingCount,
		&p.CategoryID, &p.BrandID,
		&p.ImageURL,
		&p.CatID, &p.CatName, &p.CatSlug,
		&p.BrandID2, &p.BrandName, &p.BrandSlug,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	nameEn := getStringValue(p.NameEn)
	displayName := nameEn
	if displayName == "" {
		displayName = p.Name
	}
	desc := getStringValue(p.Description)
	shortDesc := getStringValue(p.ShortDesc)
	displayDesc := shortDesc
	if displayDesc == "" {
		displayDesc = desc
	}
	price := p.BasePrice
	if p.SalePrice.Valid {
		price = p.SalePrice.Float64
	}

	product := map[string]interface{}{
		"id":                  p.ID,
		"name":                p.Name,
		"name_en":             nameEn,
		"display_name":       displayName,
		"description":         desc,
		"short_description":   shortDesc,
		"display_description": displayDesc,
		"base_price":         p.BasePrice,
		"sale_price":         getFloatValue(p.SalePrice),
		"price":               price,
		"image_url":           getStringValue(p.ImageURL),
		"category_id":         getIntValue(p.CategoryID),
		"brand_id":            getIntValue(p.BrandID),
		"sku":                 p.SKU,
		"stock":               p.Stock,
		"rating_average":      getFloatValue(p.RatingAvg),
		"rating_count":        p.RatingCount,
		"category": map[string]interface{}{
			"id":   getIntValue(p.CatID),
			"name": getStringValue(p.CatName),
			"slug": getStringValue(p.CatSlug),
		},
		"brand": map[string]interface{}{
			"id":   getIntValue(p.BrandID2),
			"name": getStringValue(p.BrandName),
			"slug": getStringValue(p.BrandSlug),
		},
	}

	c.JSON(http.StatusOK, product)
}

func SearchProducts(c *gin.Context) {
	searchTerm := c.Query("q")
	if searchTerm == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search term is required"})
		return
	}

	query := `
		SELECT p.id, p.name, p.name_en, p.description, p.short_description,
		       p.base_price, p.sale_price, p.sku, p.stock,
		       (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url,
		       c.id, c.name, c.slug,
		       b.id, b.name, b.slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		WHERE p.status = 'active' AND p.stock > 0 AND (p.name LIKE ? OR p.name_en LIKE ? OR p.description LIKE ?)
		ORDER BY p.created_at DESC
	`

	searchPattern := "%" + searchTerm + "%"
	rows, err := database.DB.Query(query, searchPattern, searchPattern, searchPattern)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	products := []map[string]interface{}{}
	for rows.Next() {
		var p struct {
			ID          int
			Name        string
			NameEn      sql.NullString
			Description sql.NullString
			ShortDesc   sql.NullString
			BasePrice   float64
			SalePrice   sql.NullFloat64
			SKU         string
			Stock       int
			ImageURL    sql.NullString
			CatID       sql.NullInt64
			CatName     sql.NullString
			CatSlug     sql.NullString
			BrandID2    sql.NullInt64
			BrandName   sql.NullString
			BrandSlug   sql.NullString
		}
		err := rows.Scan(&p.ID, &p.Name, &p.NameEn, &p.Description, &p.ShortDesc,
			&p.BasePrice, &p.SalePrice, &p.SKU, &p.Stock,
			&p.ImageURL,
			&p.CatID, &p.CatName, &p.CatSlug,
			&p.BrandID2, &p.BrandName, &p.BrandSlug)
		if err != nil {
			continue
		}
		nameEn := getStringValue(p.NameEn)
		displayName := nameEn
		if displayName == "" {
			displayName = p.Name
		}
		desc := getStringValue(p.Description)
		shortDesc := getStringValue(p.ShortDesc)
		displayDesc := shortDesc
		if displayDesc == "" {
			displayDesc = desc
		}
		price := p.BasePrice
		if p.SalePrice.Valid {
			price = p.SalePrice.Float64
		}
		product := map[string]interface{}{
			"id":                  p.ID,
			"name":                p.Name,
			"name_en":             nameEn,
			"display_name":        displayName,
			"description":         desc,
			"short_description":   shortDesc,
			"display_description": displayDesc,
			"base_price":          p.BasePrice,
			"sale_price":          getFloatValue(p.SalePrice),
			"price":               price,
			"image_url":           getStringValue(p.ImageURL),
			"category_id":         getIntValue(p.CatID),
			"sku":                 p.SKU,
			"stock":                p.Stock,
			"category": map[string]interface{}{
				"id":   getIntValue(p.CatID),
				"name": getStringValue(p.CatName),
				"slug": getStringValue(p.CatSlug),
			},
			"brand": map[string]interface{}{
				"id":   getIntValue(p.BrandID2),
				"name": getStringValue(p.BrandName),
				"slug": getStringValue(p.BrandSlug),
			},
		}
		products = append(products, product)
	}

	c.JSON(http.StatusOK, gin.H{"products": products})
}

func GetCategories(c *gin.Context) {
	query := "SELECT id, name, slug, parent_id, description, image_url FROM categories ORDER BY sort_order, name"

	rows, err := database.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type catRow struct {
		ID          int
		Name        string
		Slug        string
		ParentID    sql.NullInt64
		Description sql.NullString
		ImageURL    sql.NullString
	}

	var rowsList []catRow
	for rows.Next() {
		var cat catRow
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Slug, &cat.ParentID, &cat.Description, &cat.ImageURL)
		if err != nil {
			continue
		}
		rowsList = append(rowsList, cat)
	}

	// Build flat list with parent_id; optional tree order (roots first, then children)
	categories := make([]map[string]interface{}, 0, len(rowsList))
	for _, cat := range rowsList {
		var parentID *int
		if cat.ParentID.Valid {
			id := int(cat.ParentID.Int64)
			parentID = &id
		}
		categories = append(categories, map[string]interface{}{
			"id":          cat.ID,
			"name":        cat.Name,
			"slug":        cat.Slug,
			"parent_id":   parentID,
			"description": getStringValue(cat.Description),
			"image_url":   getStringValue(cat.ImageURL),
		})
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

func GetProductsByCategory(c *gin.Context) {
	categoryID := c.Param("id")
	// Set category_id as query parameter and call GetProducts
	c.Request.URL.RawQuery = "category_id=" + categoryID
	GetProducts(c)
}
