#!/bin/bash
# Script to run full database migration
# This script works with Docker MySQL container

echo "Running full database migration..."

# Check if MySQL is running in Docker
# Use UTF-8 so Persian text in database.sql is stored correctly
MYSQL_OPTS="-u root -prootpassword --default-character-set=utf8mb4"

if docker ps | grep -q shop_mysql; then
    echo "MySQL container is running. Using Docker exec..."
    docker exec -i shop_mysql mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS shop_db;" 2>/dev/null || true
    docker exec -i shop_mysql mysql $MYSQL_OPTS < database/database.sql
elif docker ps -a | grep -q shop_mysql; then
    echo "MySQL container exists but is not running. Starting it..."
    docker start shop_mysql
    sleep 3
    docker exec -i shop_mysql mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS shop_db;" 2>/dev/null || true
    docker exec -i shop_mysql mysql $MYSQL_OPTS < database/database.sql
else
    echo "MySQL container not found. Trying local MySQL connection..."
    # Try TCP connection instead of socket (use UTF-8 for Persian text)
    mysql -h 127.0.0.1 -P 3306 -u root -prootpassword -e "DROP DATABASE IF EXISTS shop_db;" 2>/dev/null || true
    mysql -h 127.0.0.1 -P 3306 -u root -prootpassword --default-character-set=utf8mb4 < database/database.sql 2>/dev/null || {
        echo "Error: Could not connect to MySQL."
        echo "Please ensure MySQL is running either:"
        echo "  1. In Docker: docker-compose up -d mysql"
        echo "  2. Or locally on port 3306"
        exit 1
    }
fi

echo ""
echo "Migration completed!"
echo "Admin credentials:"
echo "  Email: admin@shop.com"
echo "  Password: admin123"

