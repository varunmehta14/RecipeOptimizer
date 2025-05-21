# Recipe Optimization Pipeline Architecture (app/backend/pipeline)

This document outlines the architecture of the backend recipe optimization pipeline.

## Pipeline Diagrams

The following diagrams visualize the sequence of operations, the role of each function and chain, the data they process, and how they interact.

### Detailed Recipe Optimization Pipeline

![Detailed Recipe Optimization Pipeline](pipeline.png)

### Recipe Optimization Workflow

![Recipe Optimization Workflow](workflow.png)

## Explanation of the Diagrams

These diagrams visualize the recipe optimization pipeline found in `app/backend/pipeline`.

1.  **Packages (Files):** Each major Python file (`orchestrator.py`, `chains.py`, `enrichers.py`, `evaluator.py`, `token_counter.py`) is represented as a package (the large rounded rectangles).
2.  **Components & Classes (Functions/Chains):**
    *   Key functions within `orchestrator.py` like `run_pipeline()`, `log_llm_run()`, `calculate_macro_delta()`, `fix_none_values()` and `store_in_vectordb()` are shown as components.
    *   Each LangChain "chain" (e.g., `parse_chain`, `nutrition_chain`, `orchestrator_chain`, `evaluator_chain`, `optimizer_chain`) is also a component. These components are where the primary logic and LLM interactions happen.
    *   `LangchainTokenCounter` is shown as a class in `token_counter.py`.
3.  **LLM Interaction:** The "LLM (Google Gemini)" cloud symbol indicates that many components interact with the language model. Specific chains that use the LLM are linked to it.
4.  **Databases:**
    *   `Relational DB`: Used by `log_llm_run()` to store records of each LLM operation.
    *   `Vector DB (Chroma)`: Used by `store_in_vectordb()` to save the original and final optimized recipes for potential future use (e.g., similarity searches).
5.  **User Input & Output:** The process starts with "User Input" (Raw Recipe Text, Goal) feeding into `run_pipeline()`, and `run_pipeline()` ultimately produces a "ProcessResponse" (containing the optimized recipe).
6.  **Data Flow (Arrows & Notes):**
    *   Arrows show the direction of data or control flow.
    *   Notes on the arrows (e.g., "Input: Raw Text", "Output: Parsed Recipe (JSON)") describe the data being passed.
7.  **Error Handling:**
    *   The newly added `fix_none_values()` function is shown with connections to various LLM chains.
    *   Notes indicate how this function is used to handle JSON parsing errors by converting Python's `None` values to JSON `null` values.
8.  **Main Sequence in `run_pipeline()`:**
    *   **Step 1 (SQLDB):** The raw input is saved.
    *   **Step 2 (ParseChain):** Raw recipe text is converted to structured JSON.
    *   **Step 3 (RouterChain):** The recipe and goal are analyzed to determine a `diet_label`.
    *   **Step 4 (Enrichers - Parallel):** `nutrition_chain`, `allergen_chain`, and `flavor_chain` run concurrently to add detailed information (nutrition, allergens, flavor) to the parsed recipe.
    *   **Step 5 (MainOrchestratorChain):** An initial optimized recipe is generated based on all gathered information and the user's goal.
    *   **Step 6 (EvaluatorLoop):** This is a critical iterative step:
        *   **6a (EvalChain):** The current version of the optimized recipe is evaluated (scored 1-10).
        *   **Conditional Flow:**
            *   If the score is high enough (>=8) or maximum iterations are met, the loop ends, and this recipe is considered final for this stage.
            *   If the score is low and more iterations are allowed, `OptimizerChain` (Step 6b) attempts to revise the recipe based on the evaluator's feedback. The revised recipe then goes back to `EvalChain` for the next iteration.
    *   **Step 7 (CalcDelta):** Nutritional differences between original and final optimized recipes are calculated.
    *   **Step 8 (StoreVector):** Both original and final optimized recipes are stored in the Vector DB.
9.  **Logging (`log_llm_run`)**: After each significant LLM operation (parsing, routing, enriching, optimizing, evaluating), `log_llm_run` is called to record details.
10. **Token Counting (`token_counter.py`)**:
    *   The `LangchainTokenCounter` callback is used with LLM chain invocations.
    *   It automatically tracks token usage for each call (by resetting on start and capturing on end).
    *   `get_token_count()` retrieves this value for logging, and `reset_token_count()` is called by the orchestrator to prepare for the next distinct call.
11. **Captions & Notes:** Short captions under component names and notes (text in beige boxes) provide a quick explanation of each component's primary role, making it easier to grasp their function without digging into the code.

This provides a clear, high-level yet sufficiently detailed overview of how the recipe optimization pipeline works, focusing on the function and interaction of its various parts.

## Summary of Pipeline Components and Their Functions

### `orchestrator.py`
*   **`run_pipeline(recipe_text: str, goal: str, db_session: AsyncSession)`**: Main entry point. Manages the overall flow from raw recipe to final optimized recipe, coordinating calls to other modules and chains.
*   **`orchestrator_chain`**: An LLM chain responsible for the *initial* optimization of the recipe based on parsed data, enrichments, and the user's goal.
*   **`log_llm_run(...)`**: Logs details of each LLM call (prompt, response, latency, tokens) to the relational database.
*   **`calculate_macro_delta(...)`**: Computes the nutritional differences (calories, protein, etc.) between the original and optimized recipes.
*   **`store_in_vectordb(...)`**: Stores the original and final optimized recipes (as JSON `Document` objects) into the Chroma vector database for potential future retrieval or analysis.
*   **`fix_none_values(...)`**: Converts Python's `None` values to JSON's `null` values in string representations.
*   **`normalize_recipe(...)`**: Normalizes recipe data, converting quantities to strings and handling special cases like servings values.

### `chains.py`
*   **`parse_chain`**: An LLM chain that takes raw recipe text and converts it into a structured JSON format (title, ingredients, steps, etc.).
*   **`router_chain`**: An LLM chain that analyzes a parsed recipe (JSON) and a user's goal to determine and assign a specific `diet_label` (e.g., "low-carb", "vegan").

### `enrichers.py` (These chains are run in parallel by the orchestrator)
*   **`nutrition_chain`**: An LLM chain that estimates the nutritional content (calories, macronutrients, sodium) per serving for a given recipe (JSON).
*   **`allergen_chain`**: An LLM chain that identifies common allergens (e.g., dairy, gluten, nuts) present in a given recipe (JSON).
*   **`flavor_chain`**: An LLM chain that analyzes a recipe (JSON) to describe its flavor profile (e.g., primary flavors, balance, key ingredients).

### `evaluator.py`
*   **`evaluator_loop(original_recipe, optimized_recipe, goal)`**: Manages an iterative loop (up to `MAX_ITER` times) to refine an optimized recipe.
*   **`evaluator_chain`**: An LLM chain that assesses an "optimized" recipe against the original and the user's goal. It provides a score (1-10), a rationale for the score, and suggestions for improvement if the score is below a threshold (e.g., < 8).
*   **`optimizer_chain`**: An LLM chain that takes the current version of a recipe, the original recipe, the goal, and the feedback/suggestions from `evaluator_chain`. It then attempts to revise the recipe to better meet the goal and incorporate the suggestions.

### `token_counter.py`
*   **`LangchainTokenCounter(BaseCallbackHandler)`**: A custom LangChain callback class.
    *   `on_llm_start()`: Resets a thread-local token counter.
    *   `on_llm_end()`: Extracts token usage information from the LLM's response and stores it in the thread-local counter.
*   **`get_token_count()`**: Retrieves the token count stored by the callback for the last LLM call in the current thread.
*   **`reset_token_count()`**: Resets the thread-local token counter to zero.

## Recent Error Handling Improvements

The pipeline has been enhanced with robust JSON parsing error handling to address issues where Python's `None` values in LLM outputs cause JSON parsing failures:

1. **New `fix_none_values()` Function**: Converts Python's `None` values to JSON's `null` in string representations.

2. **Enhanced Error Recovery Process**:
   - When a JSON parsing error occurs, the system attempts to extract the raw JSON from the error message
   - The extracted JSON is processed with `fix_none_values()` to repair any `None` values
   - The system then attempts to parse the fixed JSON
   - Multiple fallback mechanisms ensure the pipeline continues even if errors occur

3. **Consistent Data Handling**:
   - Added type handling for the `servings` field to accept both string and integer values
   - Implemented normalization in `RecipeContent` model for string servings fields
   - Updated frontend to properly display both string and numeric servings values

These improvements significantly enhance the robustness of the pipeline when processing real-world recipe data with varying formats and structures.