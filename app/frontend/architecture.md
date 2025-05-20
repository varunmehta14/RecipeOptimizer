# Recipe Optimizer Architecture

Below is a diagram illustrating the Recipe Optimizer application architecture and data flow.

```mermaid
graph TD
    subgraph Frontend["Frontend (React + TypeScript)"]
        A[Home Page] --> |Input Recipe| B[API Interface]
        B --> |Process Response| C[Result Page]
        D[Database Page] --> B
    end
    
    subgraph Backend["Backend API"]
        E[API Endpoints] --> F[Recipe Processor]
        F --> G[AI Models]
        E --> H[Database Service]
        E --> I[PDF Parser]
        E --> J[Vector Database]
    end
    
    B --> |API Request| E
    E --> |API Response| B
    
    subgraph Components["Key Components"]
        K[DiffText] --> |Visualize Changes| C
        L[RecipePanel] --> |Display Recipe| C
        M[ProcessingFlow] --> |Show Progress| C
        N[Badges] --> |Display Achievements| C
    end
    
    subgraph DataFlow["Data Flow"]
        O[Original Recipe] --> P[AI Processing]
        P --> Q[Optimized Recipe]
        Q --> R[Side-by-Side Comparison]
        Q --> S[Nutritional Analysis]
    end
```

## Data Flow Explanation

1. **User Input**: Users input their recipe text and optimization goal on the Home page
2. **API Request**: The frontend sends the data to the backend via the API interface
3. **AI Processing**: The backend processes the recipe using AI models
4. **Database Storage**: The original recipe, goal, and results are stored in the database
5. **Vector Embeddings**: Recipe data may be stored as vector embeddings for similarity searches
6. **Result Display**: The optimized recipe is displayed alongside the original with differences highlighted
7. **Performance Metrics**: Processing times and token usage are tracked and displayed

This architecture supports both synchronous recipe processing and asynchronous database operations, providing users with an immediate feedback loop while maintaining a history of their optimizations. 