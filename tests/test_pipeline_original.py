import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.pipeline.orchestrator import run_pipeline

@pytest.mark.asyncio
async def test_lower_sugar_goal():
    """Test that the pipeline correctly reduces sugar when that's the goal."""
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