import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv # Add this line
from contextlib import asynccontextmanager
import logging
import tempfile
import shutil
import io
import json
import sqlite3
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.backend.db import get_db_session, create_tables
from app.backend.models import ProcessRequest, ProcessResponse
from app.backend.pipeline import run_pipeline
load_dotenv()
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Try to import PyPDF2 for PDF processing
try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False
    logger.warning("PyPDF2 not installed. PDF upload functionality will be limited.")

# Create startup context
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    await create_tables()
    logger.info("Database tables created")
    
    # Create chroma_db directory if it doesn't exist
    chroma_dir = os.getenv("CHROMA_DIR", "./chroma_db")
    os.makedirs(chroma_dir, exist_ok=True)
    logger.info(f"Chroma directory ensured at {chroma_dir}")
    
    yield
    
    # Cleanup on shutdown if needed
    logger.info("Application shutting down")

app = FastAPI(
    title="Recipe Optimizer API",
    description="API for optimizing recipes based on user goals",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Recipe Optimizer API is running"}

@app.post("/api/process", response_model=ProcessResponse)
async def process_recipe(
    request: ProcessRequest,
    db_session: AsyncSession = Depends(get_db_session)
):
    """
    Process a recipe according to the user's goal
    
    Args:
        request: The ProcessRequest containing the recipe text and goal
        db_session: Database session
        
    Returns:
        ProcessResponse with the original and optimized recipes
    """
    try:
        logger.info(f"Processing recipe with goal: {request.goal}")
        result = await run_pipeline(
            recipe_text=request.recipe_text,
            goal=request.goal,
            db_session=db_session
        )
        return result
    except Exception as e:
        logger.error(f"Error processing recipe: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process recipe: {str(e)}"
        )

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Extract text from an uploaded PDF file
    
    Args:
        file: The uploaded PDF file
        
    Returns:
        Dict containing the extracted text
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted"
        )
    
    if not HAS_PYPDF:
        raise HTTPException(
            status_code=501,
            detail="PDF processing is not available. PyPDF2 library is not installed."
        )
    
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            # Copy the uploaded file content to the temporary file
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Process the PDF with PyPDF2
        text = ""
        with open(temp_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        # Remove the temporary file
        os.unlink(temp_path)
        
        logger.info(f"Successfully extracted text from PDF: {file.filename}")
        return {"text": text.strip()}
        
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}"
        )
    finally:
        # Make sure the file is closed
        file.file.close()

# New models for database API responses
class RecipeEntry(BaseModel):
    id: int
    raw_text_preview: str
    goal: str
    created_at: str

class LLMRunEntry(BaseModel):
    id: int
    recipe_id: int
    step_name: str
    tokens_used: int
    latency_ms: int
    created_at: str

class ChromaCollection(BaseModel):
    id: str
    name: str
    
class ChromaEmbedding(BaseModel):
    id: int
    metadata: Dict[str, Any]

# New API endpoints for database access
@app.get("/api/db/recipes", response_model=List[RecipeEntry])
async def get_recipes(db_session: AsyncSession = Depends(get_db_session)):
    """Get all recipes from the SQLite database"""
    try:
        query = """
        SELECT id, 
               SUBSTR(raw_text, 1, 100) as raw_text_preview, 
               goal, 
               created_at
        FROM recipes_raw
        ORDER BY created_at DESC
        """
        result = await db_session.execute(text(query))
        recipes = [
            RecipeEntry(
                id=row[0],
                raw_text_preview=f"{row[1]}...",
                goal=row[2],
                created_at=row[3]
            )
            for row in result.fetchall()
        ]
        return recipes
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recipes: {str(e)}"
        )

@app.get("/api/db/recipe/{recipe_id}", response_model=Dict[str, Any])
async def get_recipe_detail(recipe_id: int, db_session: AsyncSession = Depends(get_db_session)):
    """Get details of a specific recipe including its LLM runs"""
    try:
        # Get recipe
        recipe_query = """
        SELECT id, raw_text, goal, created_at
        FROM recipes_raw
        WHERE id = :recipe_id
        """
        result = await db_session.execute(text(recipe_query), {"recipe_id": recipe_id})
        recipe = result.fetchone()
        
        if not recipe:
            raise HTTPException(status_code=404, detail=f"Recipe with ID {recipe_id} not found")
        
        # Get LLM runs for this recipe
        llm_query = """
        SELECT id, recipe_id, step_name, tokens_used, latency_ms, created_at
        FROM llm_runs
        WHERE recipe_id = :recipe_id
        ORDER BY created_at
        """
        result = await db_session.execute(text(llm_query), {"recipe_id": recipe_id})
        llm_runs = [
            {
                "id": row[0],
                "recipe_id": row[1],
                "step_name": row[2],
                "tokens_used": row[3],
                "latency_ms": row[4],
                "created_at": row[5]
            }
            for row in result.fetchall()
        ]
        
        return {
            "id": recipe[0],
            "raw_text": recipe[1],
            "goal": recipe[2],
            "created_at": recipe[3],
            "llm_runs": llm_runs
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipe details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recipe details: {str(e)}"
        )

@app.get("/api/db/llm-runs", response_model=List[LLMRunEntry])
async def get_llm_runs(limit: int = 20, db_session: AsyncSession = Depends(get_db_session)):
    """Get recent LLM runs from the SQLite database"""
    try:
        query = """
        SELECT id, recipe_id, step_name, tokens_used, latency_ms, created_at
        FROM llm_runs
        ORDER BY created_at DESC
        LIMIT :limit
        """
        result = await db_session.execute(text(query), {"limit": limit})
        runs = [
            LLMRunEntry(
                id=row[0],
                recipe_id=row[1],
                step_name=row[2],
                tokens_used=row[3],
                latency_ms=row[4],
                created_at=row[5]
            )
            for row in result.fetchall()
        ]
        return runs
    except Exception as e:
        logger.error(f"Error fetching LLM runs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch LLM runs: {str(e)}"
        )

@app.get("/api/db/chroma-collections", response_model=List[ChromaCollection])
async def get_chroma_collections():
    """Get all collections from the Chroma vector database"""
    try:
        chroma_db_path = os.path.join(os.getenv("CHROMA_DIR", "./chroma_db"), "chroma.sqlite3")
        
        if not os.path.exists(chroma_db_path):
            return []
            
        conn = sqlite3.connect(chroma_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM collections")
        collections = [
            ChromaCollection(
                id=row[0],
                name=row[1]
            )
            for row in cursor.fetchall()
        ]
        conn.close()
        return collections
    except Exception as e:
        logger.error(f"Error fetching Chroma collections: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Chroma collections: {str(e)}"
        )

@app.get("/api/db/chroma-embeddings", response_model=List[Dict[str, Any]])
async def get_chroma_embeddings(limit: int = 20):
    """Get embeddings and their metadata from the Chroma vector database"""
    try:
        chroma_db_path = os.path.join(os.getenv("CHROMA_DIR", "./chroma_db"), "chroma.sqlite3")
        
        if not os.path.exists(chroma_db_path):
            return []
        
        conn = sqlite3.connect(chroma_db_path)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        # First, check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        # If embedding_metadata doesn't exist, look for alternatives
        if 'embedding_metadata' not in tables:
            logger.error(f"embedding_metadata table not found. Available tables: {tables}")
            # Simple fallback - return empty list if we can't find the right table
            return []
        
        # Check schema of embedding_metadata table
        cursor.execute("PRAGMA table_info(embedding_metadata)")
        columns = {}
        for col in cursor.fetchall():
            columns[col['name']] = col['type']
            
        logger.info(f"Embedding metadata table schema: {columns}")
        
        # Construct results based on available schema
        results = []
        
        # Simple approach - just read all rows with limit
        cursor.execute(f"SELECT * FROM embedding_metadata LIMIT {limit}")
        rows = cursor.fetchall()
        
        # Group by metadata entries by some identifier
        metadata_groups = {}
        id_field = None
        
        # Determine ID field - could be embedding_id, id, uuid, etc.
        for potential_id in ['embedding_id', 'id', 'uuid', 'document_id']:
            if potential_id in columns:
                id_field = potential_id
                break
                
        # If no ID field found, try to group by any identifier-like field
        if not id_field:
            for col_name in columns.keys():
                if 'id' in col_name.lower():
                    id_field = col_name
                    break
        
        # If still no ID field, use row number as substitute
        if id_field:
            # Group by ID field
            for row in rows:
                group_id = row[id_field]
                if group_id not in metadata_groups:
                    metadata_groups[group_id] = {}
                
                # Add metadata based on available columns
                if 'key' in columns and 'value' in columns:
                    # Standard key-value format
                    key = row['key']
                    value = row['value']
                    metadata_groups[group_id][key] = value
                else:
                    # Just use all columns as metadata
                    for col_name in columns.keys():
                        if col_name != id_field:
                            metadata_groups[group_id][col_name] = row[col_name]
        else:
            # Fallback - create entry for each row
            for i, row in enumerate(rows):
                metadata = {}
                for key in row.keys():
                    metadata[key] = row[key]
                results.append({
                    "id": i + 1,  # Synthetic ID
                    "metadata": metadata
                })
            
            conn.close()
            return results
        
        # Process metadata groups to format for API response
        for group_id, metadata in metadata_groups.items():
            # Try to parse JSON values, especially for document objects
            for key, value in metadata.items():
                if key == 'chroma:document' or (isinstance(value, str) and value.startswith('{')):
                    try:
                        metadata[key] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        # Keep as-is if not valid JSON
                        pass
            
            results.append({
                "id": group_id,
                "metadata": metadata
            })
        
        conn.close()
        return results[:limit]  # Apply limit here to account for grouping
    except Exception as e:
        logger.error(f"Error fetching Chroma embeddings: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Chroma embeddings: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.backend.main:app", host="0.0.0.0", port=8000, reload=True) 