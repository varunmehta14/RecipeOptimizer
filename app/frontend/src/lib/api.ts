import axios from 'axios';

/**
 * API Interface Module
 * 
 * This module provides type definitions and functions for interacting with the backend API.
 * It includes TypeScript interfaces that match the backend models, ensuring type safety
 * across the application.
 */

/**
 * Represents a recipe ingredient with quantities and units
 */
export interface Ingredient {
  /** The name of the ingredient */
  name: string;
  /** The quantity (amount) of the ingredient, may be a fraction or decimal */
  quantity?: string;
  /** The unit of measurement (e.g., cup, tbsp, g) */
  unit?: string;
  /** Additional information about the ingredient */
  notes?: string;
}

/**
 * Represents the nutritional information for a recipe
 */
export interface Nutrition {
  /** Total calories per serving */
  calories?: number;
  /** Protein content in grams */
  protein_g?: number;
  /** Fat content in grams */
  fat_g?: number;
  /** Carbohydrate content in grams */
  carbs_g?: number;
  /** Sugar content in grams */
  sugar_g?: number;
  /** Fiber content in grams */
  fiber_g?: number;
  /** Sodium content in milligrams */
  sodium_mg?: number;
}

/**
 * Represents the change in nutritional values between original and optimized recipes
 */
export interface MacroDelta {
  /** Change in calories per serving */
  calories: number;
  /** Change in protein content in grams */
  protein_g: number;
  /** Change in fat content in grams */
  fat_g: number;
  /** Change in carbohydrate content in grams */
  carbs_g: number;
  /** Change in sugar content in grams */
  sugar_g: number;
  /** Change in fiber content in grams */
  fiber_g: number;
  /** Change in sodium content in milligrams */
  sodium_mg: number;
}

/**
 * Contains information about allergens and nutritional changes
 */
export interface Badges {
  /** List of allergens present in or removed from the recipe */
  allergens: string[];
  /** Nutritional changes between original and optimized recipes */
  macros_delta: MacroDelta;
}

/**
 * Core structure of a recipe including title, ingredients, and preparation steps
 */
export interface RecipeContent {
  /** Recipe title */
  title: string;
  /** List of ingredients with their quantities and units */
  ingredients: Ingredient[];
  /** Ordered list of preparation steps */
  steps: string[];
  /** Nutritional information per serving */
  nutrition?: Nutrition;
  /** Total cooking time in minutes */
  cooking_time?: number;
  /** Number of servings the recipe yields */
  servings?: number | string;
}

/**
 * Extended recipe with optimization improvements
 */
export interface OptimizedRecipe extends RecipeContent {
  /** List of specific improvements or changes made to the recipe */
  improvements: string[];
}

/**
 * Request payload for recipe processing
 */
export interface ProcessRequest {
  /** Raw text of the recipe to be processed */
  recipe_text: string;
  /** The optimization goal (e.g., "make gluten-free", "reduce sugar") */
  goal: string;
}

/**
 * Response from the recipe processing endpoint
 */
export interface ProcessResponse {
  /** The original parsed recipe */
  original: RecipeContent;
  /** The optimized version of the recipe */
  optimized: OptimizedRecipe;
  /** Label describing the dietary profile of the optimized recipe */
  diet_label: string;
  /** Information about allergens and nutritional changes */
  badges: Badges;
}

// Database types

/**
 * Basic information about a stored recipe
 */
export interface RecipeEntry {
  /** Unique identifier */
  id: number;
  /** Preview of the raw recipe text */
  raw_text_preview: string;
  /** The optimization goal that was applied */
  goal: string;
  /** Timestamp of creation */
  created_at: string;
}

/**
 * Detailed information about a stored recipe
 */
export interface RecipeDetail {
  /** Unique identifier */
  id: number;
  /** Complete raw recipe text */
  raw_text: string;
  /** The optimization goal that was applied */
  goal: string;
  /** Timestamp of creation */
  created_at: string;
  /** List of LLM processing steps performed on this recipe */
  llm_runs: LLMRunEntry[];
}

/**
 * Information about an LLM processing step
 */
export interface LLMRunEntry {
  /** Unique identifier */
  id: number;
  /** Reference to the recipe this run is associated with */
  recipe_id: number;
  /** Name of the processing step */
  step_name: string;
  /** Number of tokens used in this processing step */
  tokens_used: number;
  /** Processing time in milliseconds */
  latency_ms: number;
  /** Timestamp of creation */
  created_at: string;
}

/**
 * Information about a Chroma vector database collection
 */
export interface ChromaCollection {
  /** Collection identifier */
  id: string;
  /** Collection name */
  name: string;
}

/**
 * Information about a vector embedding stored in Chroma
 */
export interface ChromaEmbedding {
  /** Embedding identifier */
  id: string;
  /** Additional metadata associated with the embedding */
  metadata: Record<string, any>;
}

/** Base URL for API endpoints */
const API_BASE_URL = '/api';

/**
 * Custom error class for API-related errors
 * Includes HTTP status code for more detailed error handling
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Process a recipe through the AI optimization pipeline
 * 
 * @param request - The recipe text and optimization goal
 * @returns Promise resolving to the processing response with original and optimized recipes
 */
export const processRecipe = async (request: ProcessRequest): Promise<ProcessResponse> => {
  const response = await axios.post(`${API_BASE_URL}/process`, request);
  return response.data;
};

/**
 * Get a list of all recipes stored in the database
 * 
 * @returns Promise resolving to an array of recipe entries
 */
export const getRecipes = async (): Promise<RecipeEntry[]> => {
  const response = await axios.get(`${API_BASE_URL}/db/recipes`);
  return response.data;
};

/**
 * Get detailed information about a specific recipe
 * 
 * @param recipeId - The ID of the recipe to retrieve
 * @returns Promise resolving to detailed recipe information
 */
export const getRecipeDetail = async (recipeId: number): Promise<RecipeDetail> => {
  const response = await axios.get(`${API_BASE_URL}/db/recipe/${recipeId}`);
  return response.data;
};

/**
 * Get a list of LLM processing runs
 * 
 * @param limit - Maximum number of runs to retrieve (default: 20)
 * @returns Promise resolving to an array of LLM run entries
 */
export const getLLMRuns = async (limit = 20): Promise<LLMRunEntry[]> => {
  const response = await axios.get(`${API_BASE_URL}/db/llm-runs`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Get a list of collections from the Chroma vector database
 * 
 * @returns Promise resolving to an array of collection information
 */
export const getChromaCollections = async (): Promise<ChromaCollection[]> => {
  const response = await axios.get(`${API_BASE_URL}/db/chroma-collections`);
  return response.data;
};

/**
 * Get a list of embeddings from the Chroma vector database
 * 
 * @param limit - Maximum number of embeddings to retrieve (default: 20)
 * @returns Promise resolving to an array of embedding information
 */
export const getChromaEmbeddings = async (limit = 20): Promise<ChromaEmbedding[]> => {
  const response = await axios.get(`${API_BASE_URL}/db/chroma-embeddings`, {
    params: { limit }
  });
  return response.data;
}; 