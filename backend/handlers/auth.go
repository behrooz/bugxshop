package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"shop-api/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GenerateOTP generates a 6-digit OTP
func GenerateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// SendOTP sends OTP via mobile or email
func SendOTP(c *gin.Context) {
	var req struct {
		Mobile string `json:"mobile"`
		Email  string `json:"email"`
		Type   string `json:"type" binding:"required"` // "mobile" or "email"
		Purpose string `json:"purpose" binding:"required"` // "login", "register", "reset_password"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	if req.Type == "mobile" && req.Mobile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شماره موبایل الزامی است"})
		return
	}

	if req.Type == "email" && req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ایمیل الزامی است"})
		return
	}

	// Generate OTP
	otp, err := GenerateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تولید کد"})
		return
	}

	// Check if user exists for login/register
	var userID *int
	if req.Purpose == "login" || req.Purpose == "reset_password" {
		var id int
		if req.Type == "mobile" {
			err = database.DB.QueryRow("SELECT id FROM users WHERE mobile = ?", req.Mobile).Scan(&id)
		} else {
			err = database.DB.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&id)
		}
		if err == nil {
			userID = &id
		} else if req.Purpose == "login" {
			c.JSON(http.StatusNotFound, gin.H{"error": "کاربری با این اطلاعات یافت نشد"})
			return
		}
	}

	// Save OTP
	expiresAt := time.Now().Add(5 * time.Minute)
	if userID != nil {
		_, err = database.DB.Exec(
			"INSERT INTO otp_codes (user_id, mobile, email, code, type, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			userID, req.Mobile, req.Email, otp, req.Type, req.Purpose, expiresAt,
		)
	} else {
		_, err = database.DB.Exec(
			"INSERT INTO otp_codes (mobile, email, code, type, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
			req.Mobile, req.Email, otp, req.Type, req.Purpose, expiresAt,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره کد"})
		return
	}

	// In production, send OTP via SMS/Email service
	// For now, return it in response (remove in production!)
	c.JSON(http.StatusOK, gin.H{
		"message": "کد ارسال شد",
		"otp":     otp, // Remove this in production!
		"expires_at": expiresAt,
	})
}

// VerifyOTP verifies OTP and returns token
func VerifyOTP(c *gin.Context) {
	var req struct {
		Mobile string `json:"mobile"`
		Email  string `json:"email"`
		Type   string `json:"type" binding:"required"`
		Code   string `json:"code" binding:"required"`
		Purpose string `json:"purpose" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	// Verify OTP
	var otpID int
	var userID *int
	var expiresAt time.Time
	var used bool

	query := "SELECT id, user_id, expires_at, used FROM otp_codes WHERE code = ? AND type = ? AND purpose = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1"
	
	var userIDNullable sql.NullInt64
	err := database.DB.QueryRow(query, req.Code, req.Type, req.Purpose).Scan(&otpID, &userIDNullable, &expiresAt, &used)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "کد نامعتبر است"})
		return
	}

	if used {
		c.JSON(http.StatusBadRequest, gin.H{"error": "این کد قبلاً استفاده شده است"})
		return
	}

	if time.Now().After(expiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "کد منقضی شده است"})
		return
	}

	if userIDNullable.Valid {
		id := int(userIDNullable.Int64)
		userID = &id
	}

	// Mark OTP as used
	database.DB.Exec("UPDATE otp_codes SET used = TRUE WHERE id = ?", otpID)

	// If register, create user
	if req.Purpose == "register" {
		if userID == nil {
			// Create new user
			var result sql.Result
			if req.Type == "mobile" {
				result, err = database.DB.Exec(
					"INSERT INTO users (mobile, mobile_verified) VALUES (?, TRUE)",
					req.Mobile,
				)
			} else {
				result, err = database.DB.Exec(
					"INSERT INTO users (email, email_verified) VALUES (?, TRUE)",
					req.Email,
				)
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت‌نام"})
				return
			}
			id, _ := result.LastInsertId()
			userID = new(int)
			*userID = int(id)
		}
	}

	// Generate session token (simple implementation)
	token, _ := generateToken(*userID)
	saveUserToken(*userID, token)

	c.JSON(http.StatusOK, gin.H{
		"message": "ورود موفق",
		"token":   token,
		"user_id": userID,
	})
}

// Register with email/password
func Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Mobile   string `json:"mobile"`
		Password string `json:"password" binding:"required,min=6"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رمزگذاری"})
		return
	}

	// Check if user exists
	var exists bool
	database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", req.Email).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "این ایمیل قبلاً ثبت شده است"})
		return
	}

	// Create user
	result, err := database.DB.Exec(
		"INSERT INTO users (email, mobile, password_hash, first_name, last_name, email_verified) VALUES (?, ?, ?, ?, ?, TRUE)",
		req.Email, req.Mobile, string(hashedPassword), req.FirstName, req.LastName,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت‌نام"})
		return
	}

	userID, _ := result.LastInsertId()
	token, _ := generateToken(int(userID))
	saveUserToken(int(userID), token)

	c.JSON(http.StatusCreated, gin.H{
		"message": "ثبت‌نام موفق",
		"token":   token,
		"user_id": userID,
	})
}

// Login with email/password
func Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ناقص است"})
		return
	}

	var userID int
	var passwordHash string
	err := database.DB.QueryRow(
		"SELECT id, password_hash FROM users WHERE email = ? OR mobile = ?",
		req.Email, req.Email,
	).Scan(&userID, &passwordHash)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ایمیل یا رمز عبور اشتباه است"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ایمیل یا رمز عبور اشتباه است"})
		return
	}

	token, _ := generateToken(userID)
	saveUserToken(userID, token)

	c.JSON(http.StatusOK, gin.H{
		"message": "ورود موفق",
		"token":   token,
		"user_id": userID,
	})
}

// Simple token generation (use JWT in production; userID reserved for JWT payload)
func generateToken(_ int) (string, error) {
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)
	return token, nil
}

// saveUserToken stores token for the user so middleware can resolve token -> user_id
func saveUserToken(userID int, token string) {
	// Optional: delete old tokens for this user to limit sessions
	database.DB.Exec("DELETE FROM user_tokens WHERE user_id = ?", userID)
	database.DB.Exec("INSERT INTO user_tokens (token, user_id) VALUES (?, ?)", token, userID)
}

