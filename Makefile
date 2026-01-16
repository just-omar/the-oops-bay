# --- SYSTEM CHECK ---
# Проверка: использовать 'docker compose' (V2) или 'docker-compose' (V1)
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# --- VARIABLES ---
DEV_COMPOSE  = $(DOCKER_COMPOSE) -f docker-compose.dev.yml
PROD_COMPOSE = $(DOCKER_COMPOSE) -f docker-compose.prod.yml

# --- HELP ---
.PHONY: help
help: ## Show this help message
	@echo "Usage: make [command]"
	@echo ""
	@echo "Development:"
	@grep -E '^[a-zA-Z_-]+-dev:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Production:"
	@grep -E '^[a-zA-Z_-]+-prod:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "General:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- DEVELOPMENT COMMANDS ---

build-dev: ## Build development images
	$(DEV_COMPOSE) build

up-dev: ## Start development environment with hot reload
	$(DEV_COMPOSE) up --build

down-dev: ## Stop development environment
	$(DEV_COMPOSE) down

restart-dev: ## Restart development environment
	$(DEV_COMPOSE) restart

logs-dev: ## Follow logs for development services
	$(DEV_COMPOSE) logs -f

# --- PRODUCTION COMMANDS ---

build-prod: ## Build production images
	$(PROD_COMPOSE) build

up-prod: ## Start production environment in detached mode
	$(PROD_COMPOSE) up --build -d

down-prod: ## Stop production environment and remove containers
	$(PROD_COMPOSE) down

restart-prod: ## Restart production services
	$(PROD_COMPOSE) restart

logs-prod: ## Follow logs for production services
	$(PROD_COMPOSE) logs -f

ps-prod: ## Check status of production containers
	$(PROD_COMPOSE) ps

# --- UTILS & MAINTENANCE ---

stop-all: ## Stop all environments (dev and prod)
	$(DEV_COMPOSE) down
	$(PROD_COMPOSE) down

clean: ## Remove containers, volumes, and all images
	$(DEV_COMPOSE) down -v --rmi all
	$(PROD_COMPOSE) down -v --rmi all

tidy: ## Run go mod tidy inside container
	$(DEV_COMPOSE) run --rm backend go mod tidy

install-deps: ## Install npm packages inside container
	$(DEV_COMPOSE) run --rm frontend npm install

stats: ## Show current system resource usage
	docker stats

.DEFAULT_GOAL := help