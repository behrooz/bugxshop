.PHONY: help build up down logs clean install-backend install-frontend

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker containers
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Remove all containers and volumes
	docker-compose down -v

install-backend: ## Install Go dependencies
	cd backend && go mod download

install-frontend: ## Install Node.js dependencies
	cd frontend && npm install

dev-backend: ## Run backend in development mode
	cd backend && go run main.go

dev-frontend: ## Run frontend in development mode
	cd frontend && npm run dev

db-migrate: ## Run database migrations
	mysql -u root -p < database/schema.sql

