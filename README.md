# Recipe Optimizer

A multi-step LLM workflow that optimizes recipes based on user-specified goals, using LangChain, LangGraph, and Gemini 1.5 Flash.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/recipe-optimizer.git
cd recipe-optimizer

# Copy example environment file and add your Google API key
cp .env.example .env

# Edit .env file to add your Google API key
# GOOGLE_API_KEY=your_key_here

# Set up both backend and frontend
make setup

# Start both the backend and frontend servers
make dev
```

Visit http://localhost:5173 to view the app.

## 📂 Directory Structure

```
/app
  /backend              # FastAPI backend with LangChain/LangGraph
    /pipeline           # AI pipeline components
    /venv               # Python virtual environment
  /frontend             # React TypeScript frontend
/tests                  # pytest tests
```

## 🔧 Development Setup

### Backend (Python 3.11+)

Using the virtual environment:

```bash
# Activate the virtual environment
cd app/backend
source ./activate_venv.sh  # Linux/macOS
.\activate_venv.bat       # Windows

# Install requirements (if not already installed)
source ./activate_venv.sh install  # Linux/macOS
.\activate_venv.bat install       # Windows

# Run the backend server
uvicorn app.backend.main:app --reload
```

### Frontend (Node.js 18+)

```bash
cd app/frontend
npm install
npm run dev
```

## 🌐 LangGraph Workflow

The optimization pipeline follows Anthropic's "Building Effective Agents" patterns:

1. **Parser**: Converts raw text recipes into structured JSON
2. **Router**: Classifies the recipe and goal into a diet label
3. **Parallel Enrichers**: Add nutrition, allergen, and flavor information
4. **Orchestrator**: Creates an initial optimized recipe
5. **Evaluator Loop**: Iteratively improves the recipe until it meets the goal

## 🔄 Database Options

By default, the app uses SQLite and on-disk Chroma:

```
DATABASE_URL=sqlite+aiosqlite:///./recipes.db
CHROMA_DIR=./chroma_db
```

To use PostgreSQL:

```bash
# Start Postgres container
docker compose up db -d

# Update .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/recipes
```

## 🛠️ Commands

```bash
# Set up project
make setup

# Run development servers
make dev           # Run both backend and frontend
make backend       # Run just the backend 
make frontend      # Run just the frontend

# Testing and formatting
make test          # Run pytest tests
make format        # Format code

# Clean up environment
make clean
```

## 🧪 Testing

The test suite verifies:

1. Recipe parser extracts correct JSON structure
2. The pipeline reduces sugar content when that's the goal
3. API endpoints work as expected

```bash
make test
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| GOOGLE_API_KEY | Your Google API key | (required) |
| MODEL_NAME | Gemini model to use | gemini-1.5-flash |
| DATABASE_URL | Database connection URL | sqlite+aiosqlite:///./recipes.db |
| CHROMA_DIR | Vector DB storage location | ./chroma_db |
| MAX_ITER | Max evaluator loop iterations | 3 | 