import os
from typing import Dict, Any, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-1.5-flash")
MAX_ITER = int(os.getenv("MAX_ITER", "3"))

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model=MODEL_NAME,
    convert_system_message_to_human=True,
    temperature=0.3,
)

# Evaluator Prompt
evaluator_prompt = ChatPromptTemplate.from_template("""
System: You are a recipe optimization evaluator that critically assesses how well a recipe meets a specific goal.

User: Evaluate how well the optimized recipe meets the user's goal. Score it from 1-10 and suggest improvements.

Original Recipe:
{original_recipe}

Optimized Recipe:
{optimized_recipe}

User's Goal:
{goal}

Evaluate based on:
1. How well the optimized recipe meets the user's goal (primary criterion)
2. Preservation of original flavor profile and culinary intent
3. Feasibility and practicality of suggested ingredient substitutions
4. Overall improvement in nutrition/health aspects (if applicable)

Return your evaluation as a JSON with the following fields:
- score: numerical score from 1-10 (10 being perfect)
- rationale: brief explanation of score
- improvement_suggestions: specific suggestions for further improvement (if score < 8)

Example output:
{{  
  "score": 7,
  "rationale": "The recipe successfully replaces dairy but some flavor lost in substitution",
  "improvement_suggestions": ["Add nutritional yeast for umami", "Increase spices to compensate"]
}}
""")

evaluator_chain = evaluator_prompt | llm | JsonOutputParser()

# Optimizer Prompt
optimizer_prompt = ChatPromptTemplate.from_template("""
System: You are a culinary expert specializing in recipe optimization and modification.

User: Revise this recipe to better meet the user's goal, incorporating the specific improvement suggestions.

Original Recipe:
{original_recipe}

Current Recipe Version:
{current_recipe}

Goal:
{goal}

Improvement Suggestions:
{improvement_suggestions}

Evaluation Feedback:
{evaluator_feedback}

Create an improved recipe that better addresses the user's goal and incorporates the suggested improvements.
Return the modified recipe in the same JSON format as the original with these requirements:
1. Maintain the overall structure of the original recipe
2. Focus modifications on ingredients and steps that directly relate to the goal
3. Add an 'improvements' array listing specific changes you made and why
4. Be practical with substitutions - use commonly available ingredients
5. Keep the original title unless it no longer matches the modified recipe

Return a valid JSON object with the complete recipe.
""")

optimizer_chain = optimizer_prompt | llm | JsonOutputParser()

async def evaluator_loop(original_recipe: Dict[str, Any], 
                         optimized_recipe: Dict[str, Any], 
                         goal: str) -> Dict[str, Any]:
    """
    Run the evaluation-optimization loop until the score is sufficient or max iterations reached.
    
    Args:
        original_recipe: The original parsed recipe
        optimized_recipe: The initial optimized recipe
        goal: The user's optimization goal
        
    Returns:
        The final optimized recipe
    """
    current_recipe = optimized_recipe
    
    for i in range(MAX_ITER):
        # Evaluate current recipe
        evaluation = await evaluator_chain.ainvoke({
            "original_recipe": original_recipe,
            "optimized_recipe": current_recipe,
            "goal": goal
        })
        
        # If score is good enough, return this recipe
        if evaluation["score"] >= 8:
            return current_recipe
            
        # Otherwise run optimizer
        current_recipe = await optimizer_chain.ainvoke({
            "original_recipe": original_recipe,
            "current_recipe": current_recipe,
            "goal": goal,
            "improvement_suggestions": evaluation.get("improvement_suggestions", []),
            "evaluator_feedback": evaluation.get("rationale", "")
        })
    
    # Return the best we have after MAX_ITER
    return current_recipe