# Recipe Optimizer AI

An AI-powered application that helps users transform recipes to meet specific dietary goals while preserving flavor and culinary intent. The application uses advanced language models to analyze recipes and suggest intelligent modifications based on user requirements.

## 🌟 Features

- **Recipe Input**: Paste recipe text or upload PDF files
- **Smart Optimization**: AI-powered recipe modifications based on dietary goals
- **Detailed Comparisons**: Side-by-side view of original and modified recipes with highlighted changes
- **Nutritional Analysis**: Track nutritional changes in modified recipes
- **Recipe Database**: Browse and search previously optimized recipes
- **Performance Metrics**: Monitor AI processing times and usage statistics

## 🏗️ Architecture

The application follows a modern microservices architecture:

```
Recipe Optimizer
├── Frontend (React + TypeScript)
│   ├── User Interface
│   ├── Recipe Visualization
│   └── Real-time Updates
└── Backend (Python + FastAPI)
    ├── Recipe Processing
    ├── AI Integration
    └── Database Management
```

### Key Components

- **Frontend**: React application with TypeScript for type safety
- **Backend**: FastAPI server with LangChain for AI processing
- **Database**: SQLite for recipe storage (with optional PostgreSQL support)
- **Vector Store**: Chroma for semantic recipe search
- **AI Models**: Integration with Google's Generative AI models for recipe optimization

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- Git

### Quick Setup with Make

The easiest way to get started is using the provided Makefile:

```bash
# Clone the repository
git clone <repository-url>
cd recipe-optimizer-ai

# Setup everything (creates .env file, sets up backend and frontend)
make setup

# Edit the .env file to add your Google API Key
nano .env  # Or use your preferred editor

# Run the development servers
make dev
```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd app/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   DATABASE_URL=sqlite+aiosqlite:///./recipes.db
   CHROMA_DIR=./chroma_db
   ```

5. Start the backend server:
   ```bash
   uvicorn app.backend.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Docker Setup

You can also run the application using Docker:

1. Create a `.env` file in the project root with your Google API key
2. Build and start the containers:
   ```bash
   make docker-build
   make docker-up
   ```
3. Access the application at `http://localhost:8000`

## 🧪 Running Tests

### Test With Mocks (No API Key Required)

We've created comprehensive mocks that allow testing the pipeline without a Google API key:

```bash
# Run mocked tests
make test-mocked
```

These tests use unittest mocks to simulate responses from the LLM, allowing verification of the pipeline's logic without making actual API calls.

### Test with API Key

To run tests that make actual API calls to Google's Generative AI:

```bash
# Set your API key in the environment or .env file
export GOOGLE_API_KEY=your_api_key_here

# Run all tests
make test
```

### Run Specific Tests

```bash
# Just run the recipe parser test (works without API key)
make test-parse

# Run all tests with mocks
make test-mocked
```

### Docker Testing

You can also run tests inside Docker:

```bash
# Run mocked tests in Docker (no API key needed)
docker-compose run test

# Run with a specific test file
docker-compose run test python -m pytest tests/test_parse.py -v

# Run tests with Google API
docker-compose run -e GOOGLE_API_KEY=your_api_key_here test python -m pytest tests/
```

## 🎯 Usage Examples

### Basic Recipe Optimization

1. Navigate to the home page
2. Paste your recipe text or upload a PDF
3. Select a dietary goal (e.g., "make gluten-free" or "reduce sugar")
4. Click "Optimize Recipe"
5. Review the suggested modifications

### Advanced Features

- **Custom Goals**: Enter specific dietary requirements
- **Nutrition Tracking**: Monitor changes in nutritional content
- **Recipe History**: Access previously optimized recipes
- **Performance Metrics**: View AI processing statistics

## 🛠️ Technical Decisions

### Frontend

1. **React + TypeScript**
   - Strong type safety
   - Better developer experience
   - Catch errors early in development

2. **Tailwind CSS**
   - Rapid UI development
   - Consistent design system
   - Built-in dark mode support

3. **React Query**
   - Efficient data fetching
   - Automatic caching
   - Real-time updates

### Backend

1. **FastAPI**
   - High performance
   - Built-in OpenAPI documentation
   - Native async support

2. **LangChain**
   - Flexible AI model integration
   - Structured output parsing
   - Chain of thought processing

3. **Chroma Vector Store**
   - Efficient similarity search
   - Easy integration with LangChain
   - Supports semantic recipe matching

## 💪 Challenges & Solutions

### 1. Recipe Parsing Complexity

**Challenge**: Recipes come in various formats and structures.

**Solution**: 
- Implemented robust text parsing using AI
- Created structured data models
- Added support for PDF uploads

### 2. AI Output Consistency

**Challenge**: LLM outputs weren't consistently formatted.

**Solution**:
- Implemented strict output parsing
- Added validation layers
- Created fallback mechanisms

### 3. Real-time Updates

**Challenge**: Keeping UI in sync with long-running AI operations.

**Solution**:
- Implemented SSE (Server-Sent Events)
- Added progress indicators
- Created a responsive processing flow

### 4. Performance Optimization

**Challenge**: Large recipes caused performance issues.

**Solution**:
- Implemented lazy loading
- Added request caching
- Optimized database queries

## 📈 Future Improvements

1. **Enhanced AI Models**
   - Support for more specialized dietary requirements
   - Improved flavor profile analysis
   - Better ingredient substitution logic

2. **User Experience**
   - Recipe favorites and sharing
   - Custom dietary profiles
   - Mobile app development

3. **Performance**
   - Implement worker threads for heavy processing
   - Add Redis caching
   - Optimize large recipe handling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📞 Contact

For questions and support, please contact [your-email@example.com](mailto:your-email@example.com)
