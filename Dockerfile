# Stage 1: Base Python
FROM python:3.11-slim as python-base

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Build frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend source
COPY app/frontend/ .

# Install dependencies and build
RUN npm install
RUN npm run build

# Stage 3: Final image
FROM python-base as final

# Copy backend code
COPY app/backend /app/app/backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/app/static

# Create directories
RUN mkdir -p /app/chroma_db

# Environment variables
ENV PYTHONPATH=/app
ENV CHROMA_DIR=/app/chroma_db

# Expose port
EXPOSE 8000

# Command
CMD ["uvicorn", "app.backend.main:app", "--host", "0.0.0.0", "--port", "8000"] 