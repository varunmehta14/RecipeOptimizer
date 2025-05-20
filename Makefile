.PHONY: setup setup-backend setup-frontend dev backend frontend test format clean

# Default target
all: setup

# Setup everything
setup: setup-backend setup-frontend

# Set up backend with venv
setup-backend:
	@echo "Setting up backend..."
	cd app/backend && python3 -m venv venv
	cd app/backend && ./activate_venv.sh install || ./venv/bin/pip install -r ../../requirements.txt
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

# Run tests
test:
	@echo "Running tests..."
	cd app/backend && ./venv/bin/pytest ../../tests

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