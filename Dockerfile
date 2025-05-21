# Stage 1: Base Python
FROM python:3.11-slim AS python-base

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY app/backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first to leverage Docker cache
COPY app/frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY app/frontend/ ./

# Build frontend
RUN npm run build


# Stage 3: Final image
FROM python-base AS final

# Set working directory for final image
WORKDIR /RecipeOptimizer

# Copy entire app (backend + frontend) into project root
COPY app /RecipeOptimizer/app

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /RecipeOptimizer/app/static

# Create necessary directories
RUN mkdir -p /RecipeOptimizer/chroma_db

# Environment variables
ENV PYTHONPATH=/RecipeOptimizer
ENV CHROMA_DIR=/RecipeOptimizer/chroma_db
ENV DATABASE_URL=sqlite+aiosqlite:///./recipes.db
ENV GOOGLE_API_KEY=""

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/openapi.json || exit 1

# Default command
CMD ["uvicorn", "app.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]