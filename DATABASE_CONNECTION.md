# راهنمای اتصال به دیتابیس

## اطلاعات اتصال

- **Host:** `localhost`
- **Port:** `3306`
- **Database:** `shop_db`  ← حتماً پر کنید
- **Username:** `root` (یا `shop_user`)
- **Password:** `rootpassword` (یا `shop_password`)

---

## رفع خطای "Public Key Retrieval is not allowed"

این خطا با MySQL 8 و کلاینت‌های JDBC (مثل IntelliJ، DataGrip، DBeaver) رخ می‌دهد. یکی از این دو روش را انجام دهید.

### روش ۱: استفاده از URL (ساده‌ترین)

به جای پر کردن جداگانه Host و Database:

1. در پنجره اتصال، **Connect by** را روی **URL** بگذارید.
2. در فیلد **URL** دقیقاً این را وارد کنید:
   ```
   jdbc:mysql://localhost:3306/shop_db?allowPublicKeyRetrieval=true
   ```
3. Username: `root`
4. Password: `rootpassword`
5. **Test Connection** بزنید.

### روش ۲: اتصال با Host + تنظیم Driver properties

اگر با Host وصل می‌کنید:

1. **Main** tab:
   - Host: `localhost`
   - Port: `3306`
   - **Database: `shop_db`** (حتماً پر کنید؛ خالی نگذارید)
   - Username: `root`
   - Password: `rootpassword`

2. بروید تب **Advanced** یا **Driver properties** (یا همان دکمه **»** کنار Driver).
3. یک property جدید اضافه کنید:
   - Name: `allowPublicKeyRetrieval`
   - Value: `true`
4. در صورت نیاز یکی دیگر هم:
   - Name: `useSSL`
   - Value: `false`
5. ذخیره کنید و **Test Connection** بزنید.

---

## IntelliJ IDEA / DataGrip

1. **Database** tool window → **+** → **Data Source** → **MySQL**.
2. در **URL** این را بگذارید:
   ```
   jdbc:mysql://localhost:3306/shop_db?allowPublicKeyRetrieval=true
   ```
   یا اگر از فیلدهای جدا استفاده می‌کنید:
   - Host: `localhost`, Port: `3306`, **Database: `shop_db`**
   - در **Advanced** یا **Driver properties** مقدار `allowPublicKeyRetrieval` را `true` کنید.
3. User: `root`, Password: `rootpassword`.
4. **Test Connection**.

## اتصال با DBeaver

**Main Tab:** Host `localhost`, Port `3306`, Database `shop_db`, User `root`, Password `rootpassword`.

**Driver properties:**  
`allowPublicKeyRetrieval` = `true`, در صورت نیاز `useSSL` = `false`.

## اتصال از Command Line

```bash
mysql -h localhost -P 3306 -u root -p
# Password: rootpassword
```

## اتصال از Go Application

Connection string به صورت خودکار شامل `allowPublicKeyRetrieval=true` است.

## تغییر رمز عبور Root

اگر می‌خواهید رمز عبور root را تغییر دهید:

```bash
# داخل container
docker exec -it shop_mysql mysql -u root -p
# سپس:
ALTER USER 'root'@'%' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

یا در `docker-compose.yml`، `MYSQL_ROOT_PASSWORD` را تغییر دهید و container را restart کنید.

## متن فارسی (نام/توضیحات محصول) به صورت درهم نمایش داده می‌شود

تغییر **COLLATE** به `utf8mb4_persian_ci` داده‌های قبلی را درست نمی‌کند. اگر ستون‌های `name` یا `description` ناخوانا (Mojibake) هستند، یعنی داده با encoding اشتباه **قبلاً** در دیتابیس ذخیره شده است. باید داده را **دوباره وارد** کنید با اتصال UTF-8.

**راه‌حل (داده را از نو لود کنید):**

1. **با اسکریپت migrate (توصیه می‌شود):**
   ```bash
   ./database/migrate.sh
   ```
   این اسکریپت دیتابیس را drop می‌کند و `database.sql` را با `--default-character-set=utf8mb4` اجرا می‌کند.

2. **دستی با MySQL:**
   ```bash
   mysql -h 127.0.0.1 -P 3306 -u root -prootpassword --default-character-set=utf8mb4 -e "DROP DATABASE IF EXISTS shop_db;"
   mysql -h 127.0.0.1 -P 3306 -u root -prootpassword --default-character-set=utf8mb4 < database/database.sql
   ```

3. **داخل Docker:**
   ```bash
   docker exec -i shop_mysql mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS shop_db;"
   docker exec -i shop_mysql mysql -u root -prootpassword --default-character-set=utf8mb4 < database/database.sql
   ```

4. **در IDE (DataGrip/IntelliJ):** قبل از اجرای فایل، در کنسول SQL اجرا کنید:  
   `SET NAMES utf8mb4;`  
   سپس فایل `database/database.sql` را اجرا کنید (یا در تنظیمات اتصال، encoding را روی UTF-8 بگذارید و دیتابیس را drop کرده و دوباره اسکریپت را run کنید).

فایل `database.sql` در خط اول شامل `SET NAMES utf8mb4;` است؛ اگر کل فایل را از ابتدا اجرا کنید، اتصال روی UTF-8 قرار می‌گیرد و متن فارسی درست ذخیره می‌شود.

