import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

# Import the run_pipeline function that we want to test
from app.backend.pipeline.orchestrator import run_pipeline

# Define mock response fixtures - we'll use these as return values for our patched LLM chains
MOCK_PARSED_RECIPE = {
    "title": "Blueberry Muffins",
    "ingredients": [
        {"name": "all-purpose flour", "quantity": "2", "unit": "cups", "notes": ""},
        {"name": "baking powder", "quantity": "1", "unit": "tablespoon", "notes": ""},
        {"name": "salt", "quantity": "1/2", "unit": "teaspoon", "notes": ""},
        {"name": "granulated sugar", "quantity": "1", "unit": "cup", "notes": ""},
        {"name": "unsalted butter", "quantity": "1/2", "unit": "cup", "notes": "melted"},
        {"name": "eggs", "quantity": "2", "unit": "large", "notes": ""},
        {"name": "milk", "quantity": "1", "unit": "cup", "notes": ""},
        {"name": "vanilla extract", "quantity": "1", "unit": "teaspoon", "notes": ""},
        {"name": "fresh blueberries", "quantity": "1 1/2", "unit": "cups", "notes": ""}
    ],
    "steps": [
        "Preheat oven to 375°F. Line a 12-cup muffin tin with paper liners.",
        "In a large bowl, whisk together flour, baking powder, and salt.",
        "In another bowl, mix sugar and melted butter, then add eggs, milk, and vanilla.",
        "Fold wet ingredients into dry ingredients, then gently fold in blueberries.",
        "Fill muffin cups 2/3 full and bake for 20-25 minutes until golden.",
        "Cool for 5 minutes before removing from tin."
    ],
    "cooking_time": 25,
    "servings": 12
}

MOCK_DIET_LABEL_SUGAR = {"diet_label": "low-sugar"}
MOCK_DIET_LABEL_PROTEIN = {"diet_label": "high-protein"}

MOCK_NUTRITION_INFO = {
    "calories": 280,
    "protein_g": 4.2,
    "fat_g": 12.5,
    "carbs_g": 38.6,
    "sugar_g": 24.3,  # High sugar content in original
    "fiber_g": 1.2,
    "sodium_mg": 220
}

MOCK_ALLERGEN_INFO = {
    "allergens": ["Dairy", "Eggs", "Wheat"]
}

MOCK_FLAVOR_PROFILE = {
    "primary_flavors": ["sweet", "buttery"],
    "flavor_balance": "Predominantly sweet with buttery richness",
    "key_flavor_ingredients": ["sugar", "butter", "vanilla extract", "blueberries"]
}

# The optimized recipe with reduced sugar
MOCK_OPTIMIZED_RECIPE_SUGAR = {
    "title": "Reduced-Sugar Blueberry Muffins",
    "ingredients": [
        {"name": "all-purpose flour", "quantity": "2", "unit": "cups", "notes": ""},
        {"name": "baking powder", "quantity": "1", "unit": "tablespoon", "notes": ""},
        {"name": "salt", "quantity": "1/2", "unit": "teaspoon", "notes": ""},
        {"name": "granulated sugar", "quantity": "1/3", "unit": "cup", "notes": ""},  # Reduced
        {"name": "applesauce", "quantity": "1/4", "unit": "cup", "notes": "unsweetened"},  # Added
        {"name": "unsalted butter", "quantity": "1/4", "unit": "cup", "notes": "melted"},  # Reduced
        {"name": "eggs", "quantity": "2", "unit": "large", "notes": ""},
        {"name": "milk", "quantity": "1", "unit": "cup", "notes": ""},
        {"name": "vanilla extract", "quantity": "1", "unit": "teaspoon", "notes": ""},
        {"name": "cinnamon", "quantity": "1", "unit": "teaspoon", "notes": ""},  # Added
        {"name": "fresh blueberries", "quantity": "1 1/2", "unit": "cups", "notes": ""}
    ],
    "steps": [
        "Preheat oven to 375°F. Line a 12-cup muffin tin with paper liners.",
        "In a large bowl, whisk together flour, baking powder, salt, and cinnamon.",
        "In another bowl, mix sugar, applesauce, and melted butter, then add eggs, milk, and vanilla.",
        "Fold wet ingredients into dry ingredients, then gently fold in blueberries.",
        "Fill muffin cups 2/3 full and bake for 20-25 minutes until golden.",
        "Cool for 5 minutes before removing from tin."
    ],
    "cooking_time": 25,
    "servings": 12,
    "nutrition": {
        "calories": 220,
        "protein_g": 4.0,
        "fat_g": 7.2,
        "carbs_g": 35.5,
        "sugar_g": 12.8,  # Reduced sugar content
        "fiber_g": 1.8,
        "sodium_mg": 220
    },
    "improvements": [
        "Reduced sugar from 1 cup to 1/3 cup",
        "Added unsweetened applesauce to maintain moisture with less fat and sugar",
        "Reduced butter from 1/2 cup to 1/4 cup",
        "Added cinnamon to enhance sweetness perception without adding sugar",
        "Overall sugar content reduced by approximately 47% per serving",
        "Calories reduced by about 21% per serving"
    ],
    "diet_label": "low-sugar"
}

# The optimized recipe with increased protein
MOCK_OPTIMIZED_RECIPE_PROTEIN = {
    "title": "High-Protein Blueberry Muffins",
    "ingredients": [
        {"name": "all-purpose flour", "quantity": "1", "unit": "cup", "notes": ""},
        {"name": "almond flour", "quantity": "1/2", "unit": "cup", "notes": ""},  # Added
        {"name": "whey protein powder", "quantity": "1/2", "unit": "cup", "notes": "vanilla"},  # Added
        {"name": "baking powder", "quantity": "1", "unit": "tablespoon", "notes": ""},
        {"name": "salt", "quantity": "1/2", "unit": "teaspoon", "notes": ""},
        {"name": "granulated sugar", "quantity": "2/3", "unit": "cup", "notes": ""},  # Reduced
        {"name": "unsalted butter", "quantity": "1/2", "unit": "cup", "notes": "melted"},
        {"name": "eggs", "quantity": "3", "unit": "large", "notes": ""},  # Increased
        {"name": "Greek yogurt", "quantity": "1/2", "unit": "cup", "notes": "plain"},  # Added
        {"name": "milk", "quantity": "1/2", "unit": "cup", "notes": ""},  # Reduced
        {"name": "vanilla extract", "quantity": "1", "unit": "teaspoon", "notes": ""},
        {"name": "fresh blueberries", "quantity": "1 1/2", "unit": "cups", "notes": ""},
        {"name": "chopped walnuts", "quantity": "1/2", "unit": "cup", "notes": ""}  # Added
    ],
    "steps": [
        "Preheat oven to 375°F. Line a 12-cup muffin tin with paper liners.",
        "In a large bowl, whisk together all-purpose flour, almond flour, protein powder, baking powder, and salt.",
        "In another bowl, mix sugar and melted butter, then add eggs one at a time, mixing well.",
        "Stir in Greek yogurt, milk, and vanilla extract until combined.",
        "Fold wet ingredients into dry ingredients, then gently fold in blueberries and walnuts.",
        "Fill muffin cups 2/3 full and bake for 20-25 minutes until golden.",
        "Cool for 5 minutes before removing from tin."
    ],
    "cooking_time": 25,
    "servings": 12,
    "nutrition": {
        "calories": 310,
        "protein_g": 12.5,  # Increased protein content
        "fat_g": 16.8,
        "carbs_g": 28.3,
        "sugar_g": 18.5,
        "fiber_g": 2.4,
        "sodium_mg": 240
    },
    "improvements": [
        "Added whey protein powder for a significant protein boost",
        "Added almond flour which contributes protein and healthy fats",
        "Increased eggs from 2 to 3 for additional protein",
        "Added Greek yogurt which adds protein while maintaining moisture",
        "Added walnuts for protein, healthy fats, and texture",
        "Overall protein content increased by approximately 198% per serving"
    ],
    "diet_label": "high-protein"
}

# Add fixture to ensure each test has its own event loop
@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test."""
    import asyncio
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest.mark.asyncio
async def test_lower_sugar_goal_mocked():
    """Test that the pipeline correctly reduces sugar when that's the goal, using mocks."""
    # Sample recipe for testing - simple muffin recipe with high sugar
    recipe_text = """
    Blueberry Muffins
    
    Ingredients:
    - 2 cups all-purpose flour
    - 1 tablespoon baking powder
    - 1/2 teaspoon salt
    - 1 cup granulated sugar
    - 1/2 cup unsalted butter, melted
    - 2 large eggs
    - 1 cup milk
    - 1 teaspoon vanilla extract
    - 1 1/2 cups fresh blueberries
    
    Instructions:
    1. Preheat oven to 375°F. Line a 12-cup muffin tin with paper liners.
    2. In a large bowl, whisk together flour, baking powder, and salt.
    3. In another bowl, mix sugar and melted butter, then add eggs, milk, and vanilla.
    4. Fold wet ingredients into dry ingredients, then gently fold in blueberries.
    5. Fill muffin cups 2/3 full and bake for 20-25 minutes until golden.
    6. Cool for 5 minutes before removing from tin.
    """
    
    # Mock database session
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.flush = AsyncMock()
    mock_session.add = MagicMock()
    
    # Create AsyncMock objects that will return our predefined mock responses
    mock_parse = AsyncMock()
    mock_parse.ainvoke.return_value = MOCK_PARSED_RECIPE
    
    mock_router = AsyncMock()
    mock_router.ainvoke.return_value = MOCK_DIET_LABEL_SUGAR
    
    mock_nutrition = AsyncMock()
    mock_nutrition.ainvoke.return_value = MOCK_NUTRITION_INFO
    
    mock_allergen = AsyncMock()
    mock_allergen.ainvoke.return_value = MOCK_ALLERGEN_INFO
    
    mock_flavor = AsyncMock()
    mock_flavor.ainvoke.return_value = MOCK_FLAVOR_PROFILE
    
    mock_orchestrator = AsyncMock()
    mock_orchestrator.ainvoke.return_value = MOCK_OPTIMIZED_RECIPE_SUGAR
    
    async def mock_evaluator_func(original, optimized, goal):
        # Return the optimized recipe directly, assuming it's already good enough
        return MOCK_OPTIMIZED_RECIPE_SUGAR
    
    # Set up patches for all LLM chains and functions
    with patch('app.backend.pipeline.chains.parse_chain', mock_parse), \
         patch('app.backend.pipeline.chains.router_chain', mock_router), \
         patch('app.backend.pipeline.enrichers.nutrition_chain', mock_nutrition), \
         patch('app.backend.pipeline.enrichers.allergen_chain', mock_allergen), \
         patch('app.backend.pipeline.enrichers.flavor_chain', mock_flavor), \
         patch('app.backend.pipeline.orchestrator.orchestrator_chain', mock_orchestrator), \
         patch('app.backend.pipeline.orchestrator.evaluator_loop', mock_evaluator_func), \
         patch('app.backend.pipeline.orchestrator.store_in_vectordb', AsyncMock()):
    
        # Run pipeline with goal to reduce sugar
        result = await run_pipeline(
            recipe_text=recipe_text,
            goal="make this recipe lower in sugar",
            db_session=mock_session
        )
        
        # Verify the result
        assert result.original.title == "Blueberry Muffins"
        assert result.diet_label.lower() in ["low-sugar", "low-carb"]
        
        # Check that original recipe has sugar info
        assert result.original.nutrition and result.original.nutrition.sugar_g is not None
        
        # Check that optimized recipe has sugar info
        assert result.optimized.nutrition and result.optimized.nutrition.sugar_g is not None
        
        # Check that sugar has been reduced
        original_sugar = result.original.nutrition.sugar_g or 0
        optimized_sugar = result.optimized.nutrition.sugar_g or 0
        assert optimized_sugar < original_sugar
        
        # Verify improvement notes mention sugar reduction
        sugar_related = any("sugar" in improvement.lower() for improvement in result.optimized.improvements)
        assert sugar_related is True

@pytest.mark.asyncio
async def test_increase_protein_goal_mocked():
    """Test that the pipeline correctly increases protein when that's the goal, using mocks."""
    # Sample recipe for testing - simple muffin recipe
    recipe_text = """
    Blueberry Muffins
    
    Ingredients:
    - 2 cups all-purpose flour
    - 1 tablespoon baking powder
    - 1/2 teaspoon salt
    - 1 cup granulated sugar
    - 1/2 cup unsalted butter, melted
    - 2 large eggs
    - 1 cup milk
    - 1 teaspoon vanilla extract
    - 1 1/2 cups fresh blueberries
    
    Instructions:
    1. Preheat oven to 375°F. Line a 12-cup muffin tin with paper liners.
    2. In a large bowl, whisk together flour, baking powder, and salt.
    3. In another bowl, mix sugar and melted butter, then add eggs, milk, and vanilla.
    4. Fold wet ingredients into dry ingredients, then gently fold in blueberries.
    5. Fill muffin cups 2/3 full and bake for 20-25 minutes until golden.
    6. Cool for 5 minutes before removing from tin.
    """
    
    # Mock database session
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.flush = AsyncMock()
    mock_session.add = MagicMock()
    
    # Create AsyncMock objects that will return our predefined mock responses
    mock_parse = AsyncMock()
    mock_parse.ainvoke.return_value = MOCK_PARSED_RECIPE
    
    mock_router = AsyncMock()
    mock_router.ainvoke.return_value = MOCK_DIET_LABEL_PROTEIN
    
    mock_nutrition = AsyncMock()
    mock_nutrition.ainvoke.return_value = MOCK_NUTRITION_INFO
    
    mock_allergen = AsyncMock()
    mock_allergen.ainvoke.return_value = MOCK_ALLERGEN_INFO
    
    mock_flavor = AsyncMock()
    mock_flavor.ainvoke.return_value = MOCK_FLAVOR_PROFILE
    
    mock_orchestrator = AsyncMock()
    mock_orchestrator.ainvoke.return_value = MOCK_OPTIMIZED_RECIPE_PROTEIN
    
    async def mock_evaluator_func(original, optimized, goal):
        # Return the optimized recipe directly, assuming it's already good enough
        return MOCK_OPTIMIZED_RECIPE_PROTEIN
    
    # Set up patches for all LLM chains and functions
    with patch('app.backend.pipeline.chains.parse_chain', mock_parse), \
         patch('app.backend.pipeline.chains.router_chain', mock_router), \
         patch('app.backend.pipeline.enrichers.nutrition_chain', mock_nutrition), \
         patch('app.backend.pipeline.enrichers.allergen_chain', mock_allergen), \
         patch('app.backend.pipeline.enrichers.flavor_chain', mock_flavor), \
         patch('app.backend.pipeline.orchestrator.orchestrator_chain', mock_orchestrator), \
         patch('app.backend.pipeline.orchestrator.evaluator_loop', mock_evaluator_func), \
         patch('app.backend.pipeline.orchestrator.store_in_vectordb', AsyncMock()):
    
        # Run pipeline with goal to increase protein
        result = await run_pipeline(
            recipe_text=recipe_text,
            goal="make this recipe higher in protein",
            db_session=mock_session
        )
        
        # Verify the result
        assert result.original.title == "Blueberry Muffins"
        assert result.diet_label.lower() == "high-protein"
        
        # Check that original recipe has protein info
        assert result.original.nutrition and result.original.nutrition.protein_g is not None
        
        # Check that optimized recipe has protein info
        assert result.optimized.nutrition and result.optimized.nutrition.protein_g is not None
        
        # Check that protein has been increased
        original_protein = result.original.nutrition.protein_g or 0
        optimized_protein = result.optimized.nutrition.protein_g or 0
        assert optimized_protein > original_protein
        
        # Verify improvement notes mention protein increase
        protein_related = any("protein" in improvement.lower() for improvement in result.optimized.improvements)
        assert protein_related is True 