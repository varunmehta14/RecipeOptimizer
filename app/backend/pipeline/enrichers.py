import os
from typing import Dict, Any, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-1.5-flash")

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=MODEL_NAME,
    convert_system_message_to_human=True,
    temperature=0.1,
)

# Nutrition Enricher
nutrition_prompt = ChatPromptTemplate.from_template("""
System: You are a culinary nutritionist that analyzes recipes to extract precise nutritional information.

User: Analyze this recipe and estimate the nutritional content per serving. 

Recipe:
{recipe_json}

Return a JSON object with the following nutritional values per serving:
- calories (kcal)
- protein_g (grams of protein)
- fat_g (grams of total fat)
- carbs_g (grams of total carbohydrates)
- sugar_g (grams of sugar)
- fiber_g (grams of fiber)
- sodium_mg (milligrams of sodium)

Output should be valid JSON with only these fields. Be realistic with your estimates.
Example output: 
{{
  "calories": 320,
  "protein_g": 12.5,
  "fat_g": 18.2,
  "carbs_g": 28.4,
  "sugar_g": 6.7,
  "fiber_g": 3.2,
  "sodium_mg": 420
}}
""")

nutrition_chain = nutrition_prompt | llm | JsonOutputParser()

# Allergen Enricher
allergen_prompt = ChatPromptTemplate.from_template("""
System: You are an expert in food allergies and dietary restrictions.

User: Analyze this recipe and identify any common allergens or dietary restrictions it contains.

Recipe:
{recipe_json}

Identify which of these common allergens/restrictions are present in the recipe:
- Gluten
- Dairy
- Eggs
- Nuts (specify which ones)
- Soy
- Fish
- Shellfish
- Wheat

Return a JSON array containing only the allergens that are present.
Example output: 
{{
  "allergens": ["Dairy", "Eggs", "Nuts (Almonds)"]
}}
""")

allergen_chain = allergen_prompt | llm | JsonOutputParser()

# Flavor Profile Enricher
flavor_prompt = ChatPromptTemplate.from_template("""
System: You are a culinary expert specializing in flavor profiles and taste analysis.

User: Analyze this recipe and describe its flavor profile.

Recipe:
{recipe_json}

Identify the primary flavor notes (sweet, salty, umami, sour, bitter, spicy) and any key flavor
characteristics that define this dish. Consider ingredients and cooking methods.

Return a JSON object with the following fields:
- primary_flavors: Array of the dominant flavor notes
- flavor_balance: Text description of how flavors interact
- key_flavor_ingredients: Array of ingredients contributing most to flavor

Example output:
{{
  "primary_flavors": ["sweet", "spicy"],
  "flavor_balance": "Predominantly sweet with moderate heat",
  "key_flavor_ingredients": ["honey", "cayenne pepper", "ginger"]
}}
""")

flavor_chain = flavor_prompt | llm | JsonOutputParser() 