.PHONY: help dev setup docker-up docker-down docker-logs

help:
	@echo "make dev          - install deps if needed and start the Next.js dev server"
	@echo "make setup        - wipe the local database and reseed it with demo data (demo@loggo.dev)"
	@echo "make docker-up    - build and start Loggo via docker compose (http://localhost:3000)"
	@echo "make docker-down  - stop the docker compose stack"
	@echo "make docker-logs  - tail docker compose logs"

node_modules: package.json
	npm install
	@touch node_modules

.env:
	cp .env.example .env

dev: node_modules .env
	npm run dev

setup: node_modules .env
	npx tsx scripts/seed-demo.ts

docker-up: ## Rebuild and start Loggo via docker compose
	docker compose up --build

docker-down: ## Stop the docker compose stack
	docker compose down

docker-logs: ## Tail docker compose logs
	docker compose logs -f
