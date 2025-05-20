import os
import json
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
    temperature=0.2,
)

# Recipe Parser - Fixed template without broken variables
parse_prompt = ChatPromptTemplate.from_template(
    "System: You are a recipe parsing expert that converts raw text recipes into structured JSON.\\n\\n"
    "User: I need you to parse the following recipe text into a structured JSON format. "
    "Extract the title, ingredients list (with quantities, units, and name as separate fields), "
    "and steps as an ordered list. If present, also extract cooking time (minutes) and servings.\\n\\n"
    "Recipe:\\n{recipe_text}\\n\\n"
    "The output should conform to this JSON structure:\\n"
    "{{\\n"  # Escaped opening brace
    '  "title": "Recipe Title",\\n'
    '  "ingredients": [\\n'
    '    {{ "name": "Ingredient", "quantity": "1", "unit": "cup", "notes": "optional notes" }}\\n'  # Escaped braces for object
    "  ],\\n"
    '  "steps": ["Step 1 description", "Step 2 description"],\\n'
    '  "cooking_time": 30,\\n'
    '  "servings": 4\\n'
    "}}\\n\\n"  # Escaped closing brace
    "Parse the recipe text strictly, keeping all the original information intact. Be precise with ingredient quantities and units."
)

parse_chain = parse_prompt | llm | JsonOutputParser()

# Router Chain - Fixed template format
router_prompt = ChatPromptTemplate.from_template(
    "System: You are a diet classification expert that analyzes recipes and goals to determine the appropriate dietary category.\\n\\n"
    "User: Analyze the following recipe and the user's goal to determine which diet category this recipe falls into after optimization.\\n\\n"
    "Recipe JSON:\\n{recipe_json}\\n\\n"
    "User's Goal:\\n{goal}\\n\\n"
    "Determine the most appropriate diet label for the optimized version of this recipe (based on the goal).\\n"
    "Choose only ONE from: \\\"gluten-free\\\", \\\"dairy-free\\\", \\\"vegan\\\", \\\"vegetarian\\\", \\\"keto\\\", \\\"low-carb\\\", \\\"low-sugar\\\", \\\"low-fat\\\", \\\"high-protein\\\", \\\"paleo\\\", or \\\"balanced\\\".\\n\\n"
    "Your output should be a valid JSON with only the diet_label field.\\n"
    # Corrected escaping for example output in router_prompt as well
    "Example output: {{ \\\"diet_label\\\": \\\"gluten-free\\\" }}"
)

router_chain = router_prompt | llm | JsonOutputParser()