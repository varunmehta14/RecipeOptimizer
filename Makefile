.PHONY: setup setup-backend setup-frontend dev backend frontend test test-parse test-mocked test-all format clean docker-build docker-up docker-down create-env

# Default target
all: setup

# Setup everything
setup: create-env setup-backend setup-frontend

# Create .env file if it doesn't exist
create-env:
	@if [ ! -f .env ]; then \
		echo "Creating .env file..."; \
		echo "# Google API Key for Generative AI" > .env; \
		echo "GOOGLE_API_KEY=your_google_api_key_here" >> .env; \
		echo "# Database settings" >> .env; \
		echo "DATABASE_URL=sqlite+aiosqlite:///./recipes.db" >> .env; \
		echo "# Chroma settings" >> .env; \
		echo "CHROMA_DIR=./chroma_db" >> .env; \
		echo ".env file created. Please update with your actual API key."; \
	else \
		echo ".env file already exists, skipping."; \
	fi

# Set up backend with venv
setup-backend:
	@echo "Setting up backend..."
	cd app/backend && python3 -m venv venv
	cd app/backend && (./activate_venv.sh install || ./venv/bin/pip install -r requirements.txt)
	@echo "Backend setup complete."

# Set up frontend
setup-frontend:
	@echo "Setting up frontend..."
	cd app/frontend && npm install
	@echo "Frontend setup complete."

# Run development servers
dev: backend frontend

# Run backend server
backend:
	@echo "Starting backend server..."
	cd app/backend && ./venv/bin/uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend dev server
frontend:
	@echo "Starting frontend dev server..."
	cd app/frontend && npm run dev

# Run all tests
test-all:
	@echo "Running all tests..."
	cd app/backend && ./venv/bin/pytest ../../tests/

# Run just the parse test (works without API key)
test-parse:
	@echo "Running recipe parser test..."
	cd app/backend && ./venv/bin/pytest ../../tests/test_parse.py -v

# Run mocked tests (work without API key)
test-mocked:
	@echo "Running mocked tests..."
	cd app/backend && ./venv/bin/pytest ../../tests/test_pipeline_mocked.py -v

# Run tests with Google API key
test:
	@echo "Running tests with Google API key..."
	cd app/backend && GOOGLE_API_KEY=$${GOOGLE_API_KEY} ./venv/bin/pytest ../../tests/

# Format code
format:
	@echo "Formatting backend code..."
	cd app/backend && ./venv/bin/python -m black .
	@echo "Formatting frontend code..."
	cd app/frontend && npm run lint

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf app/backend/venv
	rm -rf app/frontend/node_modules
	rm -rf app/frontend/dist
	rm -rf __pycache__
	rm -rf app/backend/__pycache__
	rm -rf app/backend/pipeline/__pycache__
	rm -rf chroma_db
	@echo "Cleanup complete."

# Docker commands
docker-build:
	@echo "Building Docker containers..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down 