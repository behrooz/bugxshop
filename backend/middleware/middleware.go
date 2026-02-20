package middleware

import (
	"github.com/gin-gonic/gin"
)

// Logger middleware is handled by Gin by default
// Add custom middleware here if needed

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			c.JSON(c.Writer.Status(), gin.H{
				"error": c.Errors.Last().Error(),
			})
		}
	}
}

