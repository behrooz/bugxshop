# Women's Fashion E-Commerce Store

A modern, SEO-friendly e-commerce website for selling women's clothing, built with Golang backend API and Next.js frontend.

## Tech Stack

- **Backend**: Golang (Gin framework) with MySQL database
- **Frontend**: Next.js 14 with TypeScript
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose

## Features

- ✅ Product catalog with categories
- ✅ Product search and filtering
- ✅ Shopping cart functionality
- ✅ Order management
- ✅ SEO optimized (metadata, sitemap, robots.txt)
- ✅ Responsive design
- ✅ RESTful API

## Project Structure

```
shop/
├── backend/          # Golang API
│   ├── handlers/     # API route handlers
│   ├── models/       # Data models
│   ├── database/     # Database connection
│   ├── config/       # Configuration
│   └── main.go       # Entry point
├── frontend/         # Next.js application
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   └── lib/          # API client utilities
├── database/         # Database schema
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Go 1.21+ (if running backend locally)
- Node.js 18+ (if running frontend locally)

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project:
```bash
cd shop
```

2. Start all services:
```bash
docker-compose up -d
```

3. The services will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MySQL: localhost:3306

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Run the database migrations:
```bash
mysql -u root -p < ../database/schema.sql
```

6. Start the server:
```bash
go run main.go
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update `NEXT_PUBLIC_API_URL` if needed

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Products
- `GET /api/v1/products` - List all products (supports pagination and category filter)
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/products/search?q=query` - Search products
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/:id/products` - Get products by category

### Cart
- `POST /api/v1/cart` - Add item to cart
- `GET /api/v1/cart/:sessionId` - Get cart items
- `PUT /api/v1/cart/:sessionId/item/:itemId` - Update cart item quantity
- `DELETE /api/v1/cart/:sessionId/item/:itemId` - Remove item from cart
- `DELETE /api/v1/cart/:sessionId` - Clear cart

### Orders
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/:id` - Get order details

## Database Schema

The database includes the following tables:
- `categories` - Product categories
- `products` - Product information
- `cart_items` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Order line items

See `database/schema.sql` for the complete schema.

## SEO Features

- Meta tags for all pages
- Dynamic sitemap generation
- Robots.txt configuration
- Semantic HTML structure
- Open Graph tags

## Development

### Adding New Products

You can add products directly to the database or create an admin interface. For now, you can insert products using SQL:

```sql
INSERT INTO products (name, description, price, image_url, category_id, sku, stock, size, color, material)
VALUES ('Product Name', 'Description', 99.99, '/images/product.jpg', 1, 'SKU-001', 10, 'M', 'Red', 'Cotton');
```

## Environment Variables

### Backend (.env)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `PORT` - API server port
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

