# Recipe Optimizer AI

A modern web application that uses AI to transform recipes to meet specific dietary goals while preserving flavor and culinary intent.

## Overview

Recipe Optimizer AI helps users modify their recipes to meet various dietary requirements such as making them gluten-free, reducing sugar, or creating vegan alternatives. The application leverages AI to analyze recipes and suggest intelligent substitutions and modifications.

![Recipe Optimizer Screenshot](./screenshot.png)

## Features

- **Recipe Input**: Users can paste recipe text or upload a PDF containing a recipe
- **Optimization Goals**: Choose from predefined goals or specify custom dietary requirements
- **AI-Powered Transformation**: Intelligently modifies recipes while preserving taste and cooking techniques
- **Detailed Comparisons**: Side-by-side comparison with highlighted changes between original and optimized recipes
- **Nutritional Analysis**: View the nutritional impact of the modifications
- **Recipe Database**: Browse previously optimized recipes and their transformations
- **Performance Metrics**: Track AI processing times and usage statistics

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **UI Components**: Custom components with accessibility focus
- **State Management**: React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with responsive design
- **Routing**: React Router for navigation
- **Diff Visualization**: Custom component using the `diff` library

## Architecture

The application follows a clean, component-based architecture:

```
src/
├── components/         # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── DiffText.tsx    # Text comparison component
│   └── ...
├── lib/                # Utilities and API functions
│   ├── api.ts          # API interface definitions and functions
│   └── utils.ts        # Helper utilities
├── pages/              # Main application pages
│   ├── Home.tsx        # Landing page with recipe input
│   ├── Result.tsx      # Displays optimization results
│   └── Database.tsx    # Displays previously processed recipes
└── App.tsx             # Main application component with routing
```

### Application Flow

1. User inputs a recipe and selects an optimization goal
2. The application sends the recipe and goal to the backend API
3. The backend processes the recipe using AI
4. Results are displayed with highlighted differences between original and optimized recipes
5. Nutritional changes and badges are shown to indicate key modifications
6. Users can explore previous optimizations in the database section

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/recipe-optimizer.git
   cd recipe-optimizer/app/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build, run:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Backend Integration

The frontend communicates with a backend API that handles:

- Recipe processing via AI models
- PDF parsing
- Database storage
- Vector embeddings for recipe analysis

Make sure the backend API is running at `http://localhost:8000` or configure the proxy settings in `vite.config.ts`.

## Design Decisions

### Why React + TypeScript?

We chose React for its component-based architecture and TypeScript for type safety, which helps catch errors early in the development process.

### Why Tailwind CSS?

Tailwind CSS allows for rapid UI development with a utility-first approach. It provides flexibility while maintaining a consistent design system.

### Component Structure

We've separated concerns by creating specialized components:
- `DiffText`: Handles the comparison visualization between original and optimized recipes
- `RecipePanel`: Displays structured recipe information
- `ProcessingFlow`: Shows the AI processing pipeline with visual feedback

### API Design

The API interface is centralized in `api.ts` with TypeScript interfaces that match the backend models, ensuring type safety across the application.

## Challenges and Solutions

### Challenge: Accurately displaying text differences

**Solution**: Implemented a custom `DiffText` component using the `diff` library that works at the word level rather than character level for better readability.

### Challenge: Handling complex recipe structures

**Solution**: Created a structured data model that accurately represents recipe components (ingredients, steps, nutrition) while maintaining flexibility.

### Challenge: Responsive design across devices

**Solution**: Used Tailwind CSS's responsive utilities and custom breakpoints to ensure the UI works well on mobile, tablet, and desktop screens.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any inquiries, please contact [your-email@example.com](mailto:your-email@example.com) 