import json
import pytest

from app.backend.pipeline.chains import parse_chain

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
async def test_recipe_parser():
    """Test that the recipe parser extracts the correct structure."""
    # Sample recipe
    sample_recipe = """
    Classic Chocolate Chip Cookies
    
    Ingredients:
    - 2 1/4 cups all-purpose flour
    - 1 tsp baking soda
    - 1 tsp salt
    - 1 cup (2 sticks) butter, softened
    - 3/4 cup granulated sugar
    - 3/4 cup packed brown sugar
    - 2 large eggs
    - 2 tsp vanilla extract
    - 2 cups semisweet chocolate chips
    
    Instructions:
    1. Preheat oven to 375°F.
    2. Combine flour, baking soda, and salt in a small bowl.
    3. Beat butter, granulated sugar, and brown sugar in a large mixer bowl.
    4. Add eggs one at a time, beating well after each addition. Stir in vanilla.
    5. Gradually beat in flour mixture. Stir in chocolate chips.
    6. Drop by rounded tablespoon onto ungreased baking sheets.
    7. Bake for 9 to 11 minutes or until golden brown.
    8. Let stand for 2 minutes; remove to wire racks to cool completely.
    
    Makes about 5 dozen cookies.
    """
    
    # Parse the recipe
    parsed_recipe = await parse_chain.ainvoke({"recipe_text": sample_recipe})
    
    # Check the structure
    assert isinstance(parsed_recipe, dict)
    assert "title" in parsed_recipe
    assert "ingredients" in parsed_recipe
    assert "steps" in parsed_recipe
    
    # Check title
    assert parsed_recipe["title"] == "Classic Chocolate Chip Cookies"
    
    # Check ingredients
    assert len(parsed_recipe["ingredients"]) == 9
    assert all(isinstance(ingredient, dict) for ingredient in parsed_recipe["ingredients"])
    assert all("name" in ingredient for ingredient in parsed_recipe["ingredients"])
    
    # Check steps
    assert len(parsed_recipe["steps"]) == 8
    assert all(isinstance(step, str) for step in parsed_recipe["steps"])
    
    # Check optional fields
    assert "servings" in parsed_recipe 