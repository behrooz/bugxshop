package main

import (
	"log"
	"os"

	"shop-api/database"
	"shop-api/handlers"
	"shop-api/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	db, err := database.Initialize()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize router
	r := gin.Default()
	r.RedirectTrailingSlash = false // avoid 301 on /api/v1/cart -> /api/v1/cart/ (breaks CORS)

	// CORS: allow any origin so frontend works from localhost, 127.0.0.1, or any host/port
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Session-ID", "X-Requested-With", "Accept-Language"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:            12 * 3600, // 12 hours
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Serve uploaded files (product and category images)
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api/v1")
	{
		// Public routes - Products & Categories
		api.GET("/products", handlers.GetProducts)
		api.GET("/products/:id", handlers.GetProduct)
		api.GET("/products/search", handlers.SearchProducts)
		api.GET("/products/:id/reviews", handlers.GetProductReviews)
		api.GET("/categories", handlers.GetCategories)
		api.GET("/categories/:id", handlers.GetCategory)
		api.GET("/categories/:id/products", handlers.GetProductsByCategory)
		api.GET("/brands", handlers.GetBrands)
		api.GET("/search/suggestions", handlers.GetSearchSuggestions)

		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/send-otp", handlers.SendOTP)
			auth.POST("/verify-otp", handlers.VerifyOTP)
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Protected user routes
		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.GET("/profile", handlers.GetUserProfile)
			user.PUT("/profile", handlers.UpdateUserProfile)

			// Addresses
			user.GET("/addresses", handlers.GetUserAddresses)
			user.POST("/addresses", handlers.CreateUserAddress)
			user.PUT("/addresses/:id", handlers.UpdateUserAddress)
			user.DELETE("/addresses/:id", handlers.DeleteUserAddress)

			// Favorites
			user.GET("/favorites", handlers.GetUserFavorites)
			user.POST("/favorites/:id", handlers.AddToFavorites)
			user.DELETE("/favorites/:id", handlers.RemoveFromFavorites)

			// Orders
			user.GET("/orders", handlers.GetUserOrders)
			user.GET("/orders/:id", handlers.GetOrder)
		}

		// Cart routes (can work with session or user - optional auth)
		cart := api.Group("/cart")
		cart.Use(middleware.OptionalAuthMiddleware())
		{
			cart.POST("", handlers.AddToCart)
			cart.GET("", handlers.GetCart)
			cart.PUT("/item/:itemId", handlers.UpdateCartItem)
			cart.DELETE("/item/:itemId", handlers.RemoveFromCart)
			cart.DELETE("", handlers.ClearCart)
		}

		// Orders
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.POST("/", handlers.CreateOrder)
			orders.GET("/:id", handlers.GetOrder)
			orders.GET("/:id/tracking", handlers.GetOrderTracking)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware())
		admin.Use(middleware.AdminMiddleware())
		{
			// Products
			admin.POST("/products", handlers.AdminCreateProduct)
			admin.PUT("/products/:id", handlers.AdminUpdateProduct)
			admin.DELETE("/products/:id", handlers.AdminDeleteProduct)
			admin.POST("/products/bulk-upload", handlers.AdminBulkUploadProducts)
			admin.GET("/products/:id/media", handlers.AdminListProductMedia)
			admin.POST("/products/:id/media", handlers.AdminAddProductMedia)
			admin.POST("/products/:id/media/upload", handlers.AdminUploadProductMedia)
			admin.PATCH("/products/:id/media/:mediaId/primary", handlers.AdminSetPrimaryProductMedia)
			admin.DELETE("/products/:id/media/:mediaId", handlers.AdminDeleteProductMedia)

			// Categories & Brands
			admin.POST("/categories", handlers.AdminCreateCategory)
			admin.PUT("/categories/:id", handlers.AdminUpdateCategory)
			admin.POST("/categories/:id/image", handlers.AdminUploadCategoryImage)
			admin.POST("/brands", handlers.AdminCreateBrand)

			// Orders
			admin.GET("/orders", handlers.AdminGetOrders)
			admin.PUT("/orders/:id/status", handlers.AdminUpdateOrderStatus)

			// Reviews
			admin.GET("/reviews", handlers.AdminGetReviews)
			admin.PUT("/reviews/:id/approve", handlers.AdminApproveReview)

			// Discounts
			admin.GET("/discounts", handlers.AdminGetDiscounts)
			admin.POST("/discounts", handlers.AdminCreateDiscount)
			admin.PUT("/discounts/:id", handlers.AdminUpdateDiscount)

			// Analytics
			admin.GET("/analytics/sales", handlers.AdminGetSalesReport)
			admin.GET("/analytics/products", handlers.AdminGetProductReport)
			admin.GET("/analytics/users", handlers.AdminGetUserReport)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
