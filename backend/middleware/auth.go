package middleware

import (
	"net/http"
	"strings"

	"shop-api/database"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates token and sets user_id
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "نیاز به احراز هویت"})
			c.Abort()
			return
		}

		// Extract token (format: "Bearer <token>")
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "فرمت توکن نامعتبر"})
			c.Abort()
			return
		}

		token := parts[1]

		var userID int
		err := database.DB.QueryRow(
			"SELECT user_id FROM user_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())",
			token,
		).Scan(&userID)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "توکن نامعتبر یا منقضی شده"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Set("token", token)
		c.Next()
	}
}

// OptionalAuthMiddleware allows requests with or without auth (for cart)
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token := parts[1]
				if len(token) > 0 {
					var userID int
					if database.DB.QueryRow(
						"SELECT user_id FROM user_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > NOW())",
						token,
					).Scan(&userID) == nil {
						c.Set("user_id", userID)
						c.Set("token", token)
					}
				}
			}
		}

		// Always continue, even without auth (for session-based cart)
		c.Next()
	}
}

// AdminMiddleware checks if user is admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("user_id")

		var isAdmin bool
		err := database.DB.QueryRow(
			"SELECT is_admin FROM users WHERE id = ?",
			userID,
		).Scan(&isAdmin)

		if err != nil || !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
			c.Abort()
			return
		}

		c.Next()
	}
}
