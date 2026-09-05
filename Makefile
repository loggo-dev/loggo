.PHONY: help dev setup

help:
	@echo "make dev    - install deps if needed and start the Next.js dev server"
	@echo "make setup  - wipe the local database and reseed it with demo data (demo@loggo.dev)"

node_modules: package.json
	npm install
	@touch node_modules

.env:
	cp .env.example .env

dev: node_modules .env
	npm run dev

setup: node_modules .env
	npx tsx scripts/seed-demo.ts
