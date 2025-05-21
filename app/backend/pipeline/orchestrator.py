import os
import json
import asyncio
import time
from typing import Dict, Any, List, Tuple
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.vectorstores import Chroma
from langchain_core.documents import Document
from sqlalchemy.ext.asyncio import AsyncSession

from .chains import parse_chain, router_chain
from .enrichers import nutrition_chain, allergen_chain, flavor_chain
from .evaluator import evaluator_loop
from app.backend.models import RecipeRaw, LLMRun, ProcessResponse, RecipeContent, OptimizedRecipe, Badges, MacroDelta
from .token_counter import LangchainTokenCounter, get_token_count, reset_token_count

# Fix for Python None vs JSON null handling
def fix_none_values(json_str: str) -> str:
    """
    Replace Python None with JSON null in string representation.
    Handles various formats of None in the string.
    """
    # Common patterns for None values in JSON strings
    replacements = [
        (': None', ': null'),          # For key-value pairs
        ('=None', '=null'),            # For equals assignments
        (': None,', ': null,'),        # For key-value pairs with comma
        ('"unit": None', '"unit": null'),  # Specific to the unit field
        ('"notes": None', '"notes": null'),  # Specific to the notes field
        ('None}', 'null}'),            # For None at the end of objects
        ('None,', 'null,'),            # For None in lists/arrays
        ('None]', 'null]'),            # For None at the end of arrays
    ]
    
    result = json_str
    for old, new in replacements:
        result = result.replace(old, new)
    
    return result

# Load environment variables
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-1.5-flash")
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=MODEL_NAME,
    convert_system_message_to_human=True,
    temperature=0.5,
)

# Initialize embeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Initialize Chroma client
vectorstore = Chroma(
    collection_name="recipes",
    persist_directory=CHROMA_DIR,
    embedding_function=embeddings,
)

# Orchestrator Agent
orchestrator_prompt = ChatPromptTemplate.from_template("""
System: You are a recipe optimization expert that can modify recipes to meet specific dietary goals while preserving flavor and culinary intent.

User: Transform this recipe to meet the following goal. 

Original Recipe:
{recipe_json}

Goal:
{goal}

Diet Category:
{diet_label}

Nutrition Information:
{nutrition_info}

Allergen Information:
{allergen_info}

Flavor Profile:
{flavor_profile}

Transform the recipe to meet the goal while:
1. Maintaining the original flavor profile as much as possible
2. Using practical, accessible ingredient substitutions
3. Keeping the same basic structure and cooking methods
4. Improving nutritional profile to align with the goal

Return a complete modified recipe in the same JSON format as the original with these requirements:
1. Include all fields from the original (title, ingredients, steps, etc.)
2. Add an 'improvements' array with bullet points describing your key modifications
3. Ensure all ingredient substitutions maintain cooking functionality (e.g. binding, leavening)
4. If substantially changing the recipe, rename the title appropriately

Output as valid JSON.
""")

orchestrator_chain = orchestrator_prompt | llm | JsonOutputParser()

# Log LLM run to database
async def log_llm_run(session: AsyncSession, 
                    recipe_id: int, 
                    step_name: str, 
                    prompt: str, 
                    response: Dict[str, Any], 
                    latency_ms: int,
                    tokens_used: int = 0) -> None:
    """
    Log an LLM run to the database
    """
    llm_run = LLMRun(
        recipe_id=recipe_id,
        step_name=step_name,
        prompt=prompt,
        response=response,
        latency_ms=latency_ms,
        tokens_used=tokens_used
    )
    session.add(llm_run)
    await session.flush()

# Calculate nutritional delta
def calculate_macro_delta(original: Dict[str, Any], optimized: Dict[str, Any]) -> MacroDelta:
    """
    Calculate the difference in nutritional values between original and optimized recipes
    """
    orig_nutrition = original.get("nutrition", {})
    opt_nutrition = optimized.get("nutrition", {})
    
    if not orig_nutrition or not opt_nutrition:
        return MacroDelta()
    
    delta = MacroDelta(
        calories=opt_nutrition.get("calories", 0) - orig_nutrition.get("calories", 0),
        protein_g=opt_nutrition.get("protein_g", 0) - orig_nutrition.get("protein_g", 0),
        fat_g=opt_nutrition.get("fat_g", 0) - orig_nutrition.get("fat_g", 0),
        carbs_g=opt_nutrition.get("carbs_g", 0) - orig_nutrition.get("carbs_g", 0),
        sugar_g=opt_nutrition.get("sugar_g", 0) - orig_nutrition.get("sugar_g", 0),
        fiber_g=opt_nutrition.get("fiber_g", 0) - orig_nutrition.get("fiber_g", 0),
        sodium_mg=opt_nutrition.get("sodium_mg", 0) - orig_nutrition.get("sodium_mg", 0)
    )
    
    return delta

# Store recipe in vector database
async def store_in_vectordb(original_recipe: Dict[str, Any], optimized_recipe: Dict[str, Any], goal: str) -> None:
    """
    Store the recipe pair in the vector database
    """
    # Create documents
    original_text = json.dumps(original_recipe)
    optimized_text = json.dumps(optimized_recipe)
    
    # Create metadata
    metadata = {
        "goal": goal,
        "diet_label": optimized_recipe.get("diet_label", ""),
        "title": original_recipe.get("title", ""),
        "optimized_title": optimized_recipe.get("title", "")
    }
    
    # Store original recipe
    original_doc = Document(
        page_content=original_text,
        metadata={**metadata, "type": "original"}
    )
    
    # Store optimized recipe
    optimized_doc = Document(
        page_content=optimized_text,
        metadata={**metadata, "type": "optimized"}
    )
    
    # Add to vectorstore
    vectorstore.add_documents([original_doc, optimized_doc])
    vectorstore.persist()

async def run_pipeline(recipe_text: str, goal: str, db_session: AsyncSession) -> ProcessResponse:
    """
    Run the complete recipe optimization pipeline
    
    Args:
        recipe_text: The raw recipe text
        goal: The user's optimization goal
        db_session: Database session for logging
        
    Returns:
        A ProcessResponse with the original and optimized recipes
    """
    # Store raw recipe in database
    recipe_record = RecipeRaw(raw_text=recipe_text, goal=goal)
    db_session.add(recipe_record)
    await db_session.flush()
    recipe_id = recipe_record.id
    
    # Step A: Parse recipe
    start_time = time.time()
    try:
        parse_result = await parse_chain.with_callbacks(
            callbacks=[LangchainTokenCounter()]
        ).ainvoke({"recipe_text": recipe_text})
        parsed_recipe = parse_result
        token_count = get_token_count() or 0
        reset_token_count()
    except Exception as e:
        # First try with None value fix if it's a JSON parsing error
        if "JSONDecodeError" in str(e) or "Invalid json output" in str(e) or "OutputParserException" in str(e):
            try:
                # Extract the raw JSON string from the exception message
                raw_output = str(e)
                if "```json" in raw_output:
                    json_str = raw_output.split("```json")[1].split("```")[0].strip()
                    # Apply the None value fix
                    fixed_json_str = fix_none_values(json_str)
                    # Parse manually
                    parsed_recipe = json.loads(fixed_json_str)
                else:
                    # Fallback to manual parse chain call
                    parsed_recipe = await parse_chain.ainvoke({"recipe_text": recipe_text})
            except Exception as inner_e:
                # If that still fails, try the standard approach
                parsed_recipe = await parse_chain.ainvoke({"recipe_text": recipe_text})
        else:
            # For other exceptions, use the standard approach
            parsed_recipe = await parse_chain.ainvoke({"recipe_text": recipe_text})
        token_count = len(recipe_text) // 4  # Estimate tokens if counting failed
    
    parse_latency = int((time.time() - start_time) * 1000)
    await log_llm_run(db_session, recipe_id, "parse", recipe_text, parsed_recipe, parse_latency, token_count)
    
    # Step B: Run router to determine diet label
    start_time = time.time()
    recipe_goal_json = json.dumps({"recipe": parsed_recipe, "goal": goal})
    try:
        router_result = await router_chain.with_callbacks(
            callbacks=[LangchainTokenCounter()]
        ).ainvoke({
            "recipe_json": parsed_recipe,
            "goal": goal
        })
        token_count = get_token_count() or 0
        reset_token_count()
    except Exception as e:
        # First try with None value fix if it's a JSON parsing error
        if "JSONDecodeError" in str(e) or "Invalid json output" in str(e) or "OutputParserException" in str(e):
            try:
                # Extract the raw JSON string from the exception message
                raw_output = str(e)
                if "```json" in raw_output:
                    json_str = raw_output.split("```json")[1].split("```")[0].strip()
                    # Apply the None value fix
                    fixed_json_str = fix_none_values(json_str)
                    # Parse manually
                    router_result = json.loads(fixed_json_str)
                else:
                    # Fallback to manual router chain call
                    router_result = await router_chain.ainvoke({
                        "recipe_json": parsed_recipe,
                        "goal": goal
                    })
            except Exception as inner_e:
                # If that still fails, try the standard approach
                router_result = await router_chain.ainvoke({
                    "recipe_json": parsed_recipe,
                    "goal": goal
                })
        else:
            # For other exceptions, use the standard approach
            router_result = await router_chain.ainvoke({
                "recipe_json": parsed_recipe,
                "goal": goal
            })
        token_count = len(recipe_goal_json) // 4  # Estimate tokens if counting failed
    
    router_latency = int((time.time() - start_time) * 1000)
    await log_llm_run(db_session, recipe_id, "router", recipe_goal_json, router_result, router_latency, token_count)
    
    diet_label = router_result.get("diet_label", "balanced")
    
    # Step C: Run enrichers in parallel
    start_time = time.time()
    recipe_json = json.dumps(parsed_recipe)
    token_estimate = len(recipe_json) // 4
    
    nutrition_task = nutrition_chain.ainvoke({"recipe_json": parsed_recipe})
    allergen_task = allergen_chain.ainvoke({"recipe_json": parsed_recipe})
    flavor_task = flavor_chain.ainvoke({"recipe_json": parsed_recipe})
    
    # Wait for all enrichers to complete
    nutrition_info, allergen_info, flavor_profile = await asyncio.gather(
        nutrition_task, allergen_task, flavor_task
    )
    
    enrichers_latency = int((time.time() - start_time) * 1000)
    
    # Log enricher results
    await log_llm_run(db_session, recipe_id, "nutrition", recipe_json, nutrition_info, enrichers_latency, token_estimate)
    await log_llm_run(db_session, recipe_id, "allergen", recipe_json, allergen_info, enrichers_latency, token_estimate)
    await log_llm_run(db_session, recipe_id, "flavor", recipe_json, flavor_profile, enrichers_latency, token_estimate)
    
    # Enhance parsed recipe with nutrition
    parsed_recipe_enhanced = {**parsed_recipe, "nutrition": nutrition_info}
    
    # Step D: Run orchestrator agent to create initial optimized recipe
    start_time = time.time()
    orchestrator_input = {
        "recipe_json": parsed_recipe_enhanced,
        "goal": goal,
        "diet_label": diet_label,
        "nutrition_info": nutrition_info,
        "allergen_info": allergen_info,
        "flavor_profile": flavor_profile
    }
    orchestrator_json = json.dumps({
        "recipe": parsed_recipe_enhanced, 
        "goal": goal,
        "diet_label": diet_label
    })
    
    try:
        optimized_recipe = await orchestrator_chain.with_callbacks(
            callbacks=[LangchainTokenCounter()]
        ).ainvoke(orchestrator_input)
        token_count = get_token_count() or 0
        reset_token_count()
    except Exception as e:
        # First try with None value fix if it's a JSON parsing error
        if "JSONDecodeError" in str(e) or "Invalid json output" in str(e) or "OutputParserException" in str(e):
            try:
                # Extract the raw JSON string from the exception message
                raw_output = str(e)
                if "```json" in raw_output:
                    json_str = raw_output.split("```json")[1].split("```")[0].strip()
                    # Apply the None value fix
                    fixed_json_str = fix_none_values(json_str)
                    # Parse manually
                    optimized_recipe = json.loads(fixed_json_str)
                else:
                    # Fallback to manual orchestrator chain call
                    optimized_recipe = await orchestrator_chain.ainvoke(orchestrator_input)
            except Exception as inner_e:
                # If that still fails, try the standard approach
                optimized_recipe = await orchestrator_chain.ainvoke(orchestrator_input)
        else:
            # For other exceptions, use the standard approach
            optimized_recipe = await orchestrator_chain.ainvoke(orchestrator_input)
        token_count = len(orchestrator_json) // 3  # Estimate tokens if counting failed
    
    orchestrator_latency = int((time.time() - start_time) * 1000)
    await log_llm_run(db_session, recipe_id, "orchestrator", orchestrator_json, optimized_recipe, orchestrator_latency, token_count)
    
    # Add nutrition info to optimized recipe if not present
    if "nutrition" not in optimized_recipe:
        optimized_recipe["nutrition"] = nutrition_info
    
    # Step E: Run evaluator loop to refine recipe
    start_time = time.time()
    evaluator_input = json.dumps({
        "original": parsed_recipe_enhanced,
        "optimized": optimized_recipe,
        "goal": goal
    })
    token_estimate = len(evaluator_input) // 4
    
    final_recipe = await evaluator_loop(parsed_recipe_enhanced, optimized_recipe, goal)
    evaluator_latency = int((time.time() - start_time) * 1000)
    await log_llm_run(db_session, recipe_id, "evaluator", evaluator_input, final_recipe, evaluator_latency, token_estimate)
    
    # Store in vector database for future reference
    await store_in_vectordb(parsed_recipe_enhanced, final_recipe, goal)
    
    # Ensure ingredient quantities are strings to avoid validation errors
    def normalize_recipe(recipe_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert all ingredient quantities to strings for consistency"""
        if not recipe_data or "ingredients" not in recipe_data:
            return recipe_data
            
        normalized_recipe = {**recipe_data}
        normalized_ingredients = []
        
        for ingredient in recipe_data["ingredients"]:
            normalized_ingredient = {**ingredient}
            # Convert quantity to string if it's a number
            if "quantity" in normalized_ingredient and normalized_ingredient["quantity"] is not None:
                if isinstance(normalized_ingredient["quantity"], (int, float)):
                    normalized_ingredient["quantity"] = str(normalized_ingredient["quantity"])
            normalized_ingredients.append(normalized_ingredient)
            
        normalized_recipe["ingredients"] = normalized_ingredients
        
        # Fix for servings field - handle string values that should be integers
        if "servings" in normalized_recipe and normalized_recipe["servings"] is not None:
            if isinstance(normalized_recipe["servings"], str):
                # Try to extract a number from the string (e.g., "2 cups" → 2)
                numeric_match = re.match(r'^(\d+)', normalized_recipe["servings"])
                if numeric_match:
                    normalized_recipe["servings"] = int(numeric_match.group(1))
                else:
                    # If we can't extract a number, remove the field to avoid validation errors
                    normalized_recipe.pop("servings")
        
        return normalized_recipe
    
    # Normalize both recipes to ensure all quantities are strings
    parsed_recipe_normalized = normalize_recipe(parsed_recipe_enhanced)
    final_recipe_normalized = normalize_recipe(final_recipe)
    
    # Calculate nutritional delta
    macro_delta = calculate_macro_delta(parsed_recipe_enhanced, final_recipe)
    
    # Construct response
    response = ProcessResponse(
        original=RecipeContent(**parsed_recipe_normalized),
        optimized=OptimizedRecipe(**final_recipe_normalized),
        diet_label=diet_label,
        badges=Badges(
            allergens=allergen_info.get("allergens", []),
            macros_delta=macro_delta
        )
    )
    
    return response 