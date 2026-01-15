# --- VARIABLES ---
DEV_COMPOSE  = docker-compose -f docker-compose.dev.yml
PROD_COMPOSE = docker-compose -f docker-compose.prod.yml

# --- DEVELOPMENT COMMANDS ---

# Build and start development environment with hot reload
dev-up:
	$(DEV_COMPOSE) up --build

# Stop development environment
dev-down:
	$(DEV_COMPOSE) down

# Restart development environment
dev-restart:
	$(DEV_COMPOSE) restart

# Follow logs for development services
dev-logs:
	$(DEV_COMPOSE) logs -f

# --- PRODUCTION COMMANDS ---

# Build and start production environment in detached mode
prod-up:
	$(PROD_COMPOSE) up --build -d

# Stop production environment and remove containers
prod-down:
	$(PROD_COMPOSE) down

# Restart production services
prod-restart:
	$(PROD_COMPOSE) restart

# Follow logs for production services (very useful for debugging)
prod-logs:
	$(PROD_COMPOSE) logs -f

# Check status of production containers
prod-ps:
	$(PROD_COMPOSE) ps

# --- UTILS & MAINTENANCE ---

# Stop all possible environments (dev and prod)
stop-all:
	$(DEV_COMPOSE) down
	$(PROD_COMPOSE) down

# Full cleanup: remove containers, volumes, and all images
clean:
	$(DEV_COMPOSE) down -v --rmi all
	$(PROD_COMPOSE) down -v --rmi all

# Backend specific: update go dependencies inside container
# This helps fix the "missing go.sum entry" errors
tidy:
	$(DEV_COMPOSE) run --rm backend go mod tidy

# Frontend specific: install npm packages inside container
install-deps:
	$(DEV_COMPOSE) run --rm frontend npm install

# Show current system resource usage by containers
stats:
	docker stats

# Default action when just running 'make'
.DEFAULT_GOAL := dev-up