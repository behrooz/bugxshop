package handlers

import (
	"database/sql"
	"net/http"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

// GetUserProfile returns user profile
func GetUserProfile(c *gin.Context) {
	userID := c.GetInt("user_id") // Set by auth middleware

	var user struct {
		ID              int
		Email           sql.NullString
		Mobile          sql.NullString
		FirstName       sql.NullString
		LastName        sql.NullString
		EmailVerified   bool
		MobileVerified  bool
		IsAdmin         bool
	}

	err := database.DB.QueryRow(
		"SELECT id, email, mobile, first_name, last_name, email_verified, mobile_verified, is_admin FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Mobile, &user.FirstName, &user.LastName, &user.EmailVerified, &user.MobileVerified, &user.IsAdmin)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر یافت نشد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID,
		"email":           getStringValue(user.Email),
		"mobile":          getStringValue(user.Mobile),
		"first_name":      getStringValue(user.FirstName),
		"last_name":       getStringValue(user.LastName),
		"email_verified":  user.EmailVerified,
		"mobile_verified": user.MobileVerified,
		"is_admin":        user.IsAdmin,
	})
}

// UpdateUserProfile updates user profile
func UpdateUserProfile(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Mobile    string `json:"mobile"`
		BirthDate string `json:"birth_date"`
		Gender    string `json:"gender"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	_, err := database.DB.Exec(
		"UPDATE users SET first_name = ?, last_name = ?, email = COALESCE(?, email), mobile = COALESCE(?, mobile), birth_date = ?, gender = ? WHERE id = ?",
		req.FirstName, req.LastName, req.Email, req.Mobile, req.BirthDate, req.Gender, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروفایل به‌روزرسانی شد"})
}

// GetUserAddresses returns user addresses
func GetUserAddresses(c *gin.Context) {
	userID := c.GetInt("user_id")

	rows, err := database.DB.Query(
		"SELECT id, title, receiver_name, receiver_mobile, province, city, postal_code, address, is_default FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	addresses := []map[string]interface{}{}
	for rows.Next() {
		var addr struct {
			ID            int
			Title         string
			ReceiverName  string
			ReceiverMobile string
			Province      string
			City          string
			PostalCode    sql.NullString
			Address       string
			IsDefault     bool
		}
		err := rows.Scan(&addr.ID, &addr.Title, &addr.ReceiverName, &addr.ReceiverMobile, &addr.Province, &addr.City, &addr.PostalCode, &addr.Address, &addr.IsDefault)
		if err != nil {
			continue
		}

		addresses = append(addresses, map[string]interface{}{
			"id":              addr.ID,
			"title":           addr.Title,
			"receiver_name":   addr.ReceiverName,
			"receiver_mobile": addr.ReceiverMobile,
			"province":        addr.Province,
			"city":            addr.City,
			"postal_code":     getStringValue(addr.PostalCode),
			"address":         addr.Address,
			"is_default":      addr.IsDefault,
		})
	}

	c.JSON(http.StatusOK, gin.H{"addresses": addresses})
}

// CreateUserAddress creates a new address
func CreateUserAddress(c *gin.Context) {
	userID := c.GetInt("user_id")

	var req struct {
		Title          string `json:"title" binding:"required"`
		ReceiverName   string `json:"receiver_name" binding:"required"`
		ReceiverMobile string `json:"receiver_mobile" binding:"required"`
		Province       string `json:"province" binding:"required"`
		City           string `json:"city" binding:"required"`
		PostalCode     string `json:"postal_code"`
		Address        string `json:"address" binding:"required"`
		IsDefault      bool   `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	// If this is default, unset other defaults
	if req.IsDefault {
		database.DB.Exec("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?", userID)
	}

	result, err := database.DB.Exec(
		"INSERT INTO user_addresses (user_id, title, receiver_name, receiver_mobile, province, city, postal_code, address, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		userID, req.Title, req.ReceiverName, req.ReceiverMobile, req.Province, req.City, req.PostalCode, req.Address, req.IsDefault,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد آدرس"})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"message": "آدرس اضافه شد", "id": id})
}

// UpdateUserAddress updates an address
func UpdateUserAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	addressID := c.Param("id")

	var req struct {
		Title          string `json:"title"`
		ReceiverName   string `json:"receiver_name"`
		ReceiverMobile string `json:"receiver_mobile"`
		Province       string `json:"province"`
		City           string `json:"city"`
		PostalCode     string `json:"postal_code"`
		Address        string `json:"address"`
		IsDefault      *bool  `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	// If setting as default, unset others
	if req.IsDefault != nil && *req.IsDefault {
		database.DB.Exec("UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?", userID, addressID)
	}

	_, err := database.DB.Exec(
		"UPDATE user_addresses SET title = COALESCE(?, title), receiver_name = COALESCE(?, receiver_name), receiver_mobile = COALESCE(?, receiver_mobile), province = COALESCE(?, province), city = COALESCE(?, city), postal_code = COALESCE(?, postal_code), address = COALESCE(?, address), is_default = COALESCE(?, is_default) WHERE id = ? AND user_id = ?",
		req.Title, req.ReceiverName, req.ReceiverMobile, req.Province, req.City, req.PostalCode, req.Address, req.IsDefault, addressID, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "آدرس به‌روزرسانی شد"})
}

// DeleteUserAddress deletes an address
func DeleteUserAddress(c *gin.Context) {
	userID := c.GetInt("user_id")
	addressID := c.Param("id")

	_, err := database.DB.Exec("DELETE FROM user_addresses WHERE id = ? AND user_id = ?", addressID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "آدرس حذف شد"})
}

// GetUserFavorites returns user favorites
func GetUserFavorites(c *gin.Context) {
	userID := c.GetInt("user_id")

	rows, err := database.DB.Query(
		`SELECT p.id, p.name, p.name_en, p.base_price, p.sale_price, p.sku, 
		 (SELECT url FROM product_media WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
		 FROM user_favorites uf
		 JOIN products p ON uf.product_id = p.id
		 WHERE uf.user_id = ?`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	favorites := []map[string]interface{}{}
	for rows.Next() {
		var p struct {
			ID        int
			Name      string
			NameEn    sql.NullString
			BasePrice float64
			SalePrice sql.NullFloat64
			SKU       string
			ImageURL  sql.NullString
		}
		rows.Scan(&p.ID, &p.Name, &p.NameEn, &p.BasePrice, &p.SalePrice, &p.SKU, &p.ImageURL)
		favorites = append(favorites, map[string]interface{}{
			"id":         p.ID,
			"name":       p.Name,
			"name_en":    getStringValue(p.NameEn),
			"price":      p.BasePrice,
			"sale_price": getFloatValue(p.SalePrice),
			"sku":        p.SKU,
			"image_url":  getStringValue(p.ImageURL),
		})
	}

	c.JSON(http.StatusOK, gin.H{"favorites": favorites})
}

// AddToFavorites adds product to favorites
func AddToFavorites(c *gin.Context) {
	userID := c.GetInt("user_id")
	productID := c.Param("id")

	_, err := database.DB.Exec(
		"INSERT IGNORE INTO user_favorites (user_id, product_id) VALUES (?, ?)",
		userID, productID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در افزودن"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "به علاقه‌مندی‌ها اضافه شد"})
}

// RemoveFromFavorites removes product from favorites
func RemoveFromFavorites(c *gin.Context) {
	userID := c.GetInt("user_id")
	productID := c.Param("id")

	_, err := database.DB.Exec("DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?", userID, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "از علاقه‌مندی‌ها حذف شد"})
}

// Helper functions are in products.go

