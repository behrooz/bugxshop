# فروشگاه آنلاین پوشاک زنانه

یک فروشگاه آنلاین کامل و حرفه‌ای برای فروش پوشاک زنانه با تمام امکانات مورد نیاز.

## ویژگی‌ها

### 👤 مدیریت کاربران
- ✅ ثبت‌نام و ورود با ایمیل/موبایل
- ✅ احراز هویت با OTP (کد یکبار مصرف)
- ✅ پروفایل کاربری کامل
- ✅ مدیریت آدرس‌های متعدد
- ✅ علاقه‌مندی‌ها (Wishlist)

### 🛍️ محصولات
- ✅ نمایش محصولات با فیلتر پیشرفته
- ✅ جستجوی هوشمند با Autocomplete
- ✅ صفحه محصول با گالری تصویر/ویدئو
- ✅ مشخصات فنی محصولات
- ✅ نظرات و امتیازدهی
- ✅ دسته‌بندی و برند

### 🛒 سبد خرید و سفارش
- ✅ سبد خرید
- ✅ پرداخت آنلاین (آماده اتصال به درگاه بانکی)
- ✅ پیگیری سفارش
- ✅ مدیریت سفارش‌ها در پنل کاربری

### 👨‍💼 پنل مدیریت (Admin)
- ✅ مدیریت محصولات (CRUD)
- ✅ مدیریت موجودی
- ✅ مدیریت دسته‌بندی و برند
- ✅ مدیریت تخفیف‌ها
- ✅ مدیریت نظرات کاربران
- ✅ آپلود دسته‌ای محصولات (CSV/Excel)

### 📊 گزارش‌گیری و آنالیتیکس
- ✅ گزارش فروش روزانه/ماهانه
- ✅ گزارش محصولات پرفروش
- ✅ گزارش کاربران
- ✅ نرخ تبدیل (Conversion Rate)

## تکنولوژی‌ها

- **Backend**: Golang (Gin Framework)
- **Frontend**: Next.js 14 (TypeScript)
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose

## نصب و راه‌اندازی

### پیش‌نیازها
- Docker و Docker Compose
- Go 1.21+ (برای اجرای محلی بک‌اند)
- Node.js 18+ (برای اجرای محلی فرانت)

### راه‌اندازی با Docker (توصیه می‌شود)

```bash
# کلون کردن پروژه
cd shop

# راه‌اندازی تمام سرویس‌ها
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f
```

سرویس‌ها در آدرس‌های زیر در دسترس هستند:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- MySQL: localhost:3306

### راه‌اندازی دستی

#### Backend
```bash
cd backend
go mod download
cp .env.example .env
# ویرایش .env با اطلاعات دیتابیس
go run main.go
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

#### Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

## دیتای آزمایشی

پس از راه‌اندازی، دیتای آزمایشی فارسی شامل:
- 5 برند (زارا، مانگو، H&M، ...)
- 11 دسته‌بندی
- 10 محصول نمونه
- کاربران نمونه
- نظرات نمونه

**اطلاعات ورود ادمین:**
- Email: `admin@shop.com`
- Password: `admin123`

برای تغییر رمز عبور ادمین:
```bash
mysql -u root -p shop_db < database/set_admin_password.sql
```

## API Endpoints

### احراز هویت
- `POST /api/v1/auth/send-otp` - ارسال کد OTP
- `POST /api/v1/auth/verify-otp` - تایید کد OTP
- `POST /api/v1/auth/register` - ثبت‌نام
- `POST /api/v1/auth/login` - ورود

### محصولات
- `GET /api/v1/products` - لیست محصولات (با فیلتر)
- `GET /api/v1/products/:id` - جزئیات محصول
- `GET /api/v1/products/search?q=...` - جستجو
- `GET /api/v1/products/:id/reviews` - نظرات محصول

### کاربر
- `GET /api/v1/user/profile` - پروفایل کاربر
- `GET /api/v1/user/addresses` - آدرس‌ها
- `GET /api/v1/user/favorites` - علاقه‌مندی‌ها
- `GET /api/v1/user/orders` - سفارش‌ها

### ادمین
- `POST /api/v1/admin/products` - ایجاد محصول
- `GET /api/v1/admin/analytics/sales` - گزارش فروش
- و سایر endpointهای مدیریتی

## ساختار پروژه

```
shop/
├── backend/          # API گولنگ
│   ├── handlers/     # Route handlers
│   ├── models/       # Data models
│   ├── database/     # Database connection
│   └── middleware/   # Middleware (auth, etc.)
├── frontend/         # Next.js application
│   ├── app/          # Pages
│   ├── components/   # React components
│   └── lib/          # Utilities
├── database/         # Database schema & data
│   ├── schema.sql    # Schema
│   └── sample_data.sql # Sample data
└── docker-compose.yml
```

## نکات مهم

1. **امنیت**: در production حتماً از JWT برای authentication استفاده کنید
2. **OTP**: برای ارسال واقعی OTP، باید سرویس SMS/Email متصل شود
3. **پرداخت**: برای اتصال به درگاه بانکی، باید gateway provider انتخاب شود
4. **تصاویر**: مسیر تصاویر محصولات باید تنظیم شود

## توسعه

برای توسعه با hot-reload:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## لایسنس

MIT

