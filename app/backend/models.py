from datetime import datetime
from typing import List, Optional, Dict, Any, Union

from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# SQLAlchemy Models
class RecipeRaw(Base):
    __tablename__ = "recipes_raw"
    
    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text)
    goal = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    llm_runs = relationship("LLMRun", back_populates="recipe")

class LLMRun(Base):
    __tablename__ = "llm_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes_raw.id"))
    step_name = Column(String(100))
    prompt = Column(Text)
    response = Column(JSON)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    recipe = relationship("RecipeRaw", back_populates="llm_runs")

# Pydantic Models
class Ingredient(BaseModel):
    name: str
    quantity: Optional[Union[str, int, float]] = None
    unit: Optional[str] = None
    notes: Optional[str] = None

class Nutrition(BaseModel):
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugar_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sodium_mg: Optional[float] = None

class MacroDelta(BaseModel):
    calories: float = 0
    protein_g: float = 0
    fat_g: float = 0
    carbs_g: float = 0
    sugar_g: float = 0
    fiber_g: float = 0
    sodium_mg: float = 0

class Badges(BaseModel):
    allergens: List[str] = []
    macros_delta: MacroDelta = Field(default_factory=MacroDelta)

class RecipeContent(BaseModel):
    title: str
    ingredients: List[Ingredient]
    steps: List[str]
    nutrition: Optional[Nutrition] = None
    cooking_time: Optional[int] = None
    servings: Optional[int] = None
    
class OptimizedRecipe(RecipeContent):
    improvements: List[str] = []

class ProcessRequest(BaseModel):
    recipe_text: str
    goal: str

class ProcessResponse(BaseModel):
    original: RecipeContent
    optimized: OptimizedRecipe
    diet_label: str
    badges: Badges 