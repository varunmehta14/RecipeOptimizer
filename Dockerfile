# Stage 1: Base Python
FROM python:3.11-slim as python-base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY app/backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Build frontend
FROM node:20-alpine as frontend-builder

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
FROM python-base as final

# Copy backend code
COPY app/backend /app/backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/static

# Create necessary directories
RUN mkdir -p /app/chroma_db

# Environment variables
ENV PYTHONPATH=/app
ENV CHROMA_DIR=/app/chroma_db

# Default SQLite database
ENV DATABASE_URL=sqlite+aiosqlite:///./recipes.db

# Optional Google API key - must be provided at runtime
ENV GOOGLE_API_KEY=""

# Create volume mount points
VOLUME ["/app/chroma_db", "/app/data"]

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/openapi.json || exit 1

# Command
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"] 