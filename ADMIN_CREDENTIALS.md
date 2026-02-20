# Admin Panel Credentials

## Default Admin Account

**Email:** `admin@shop.com`  
**Password:** `admin123`

## How to Reset Admin Password

If you need to reset the admin password, you can use the SQL script:

```bash
mysql -u root -p shop_db < database/set_admin_password.sql
```

This will set the password to `admin123`.

## Create New Admin User

You can also create a new admin user via SQL:

```sql
INSERT INTO users (email, mobile, password_hash, first_name, last_name, is_active, is_admin, email_verified, mobile_verified)
VALUES (
  'your-admin@example.com',
  '09120000000',
  '$2b$12$vrDgiQ1739j844VmkVjjGOdICEbGKFOaK1.N6kAIr8/bEPZrgiV2S', -- password: admin123
  'نام',
  'نام خانوادگی',
  TRUE,
  TRUE,
  TRUE,
  TRUE
);
```

## Generate New Password Hash

To generate a new password hash (using Go):

```go
package main

import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "your-password"
    hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    fmt.Println(string(hash))
}
```

## Security Note

⚠️ **Important:** Change the default password in production!

