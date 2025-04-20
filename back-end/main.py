from fastapi import FastAPI, Request, HTTPException, status # Added HTTPException, status
from uvicorn import run
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Dict, Any

# --- Configuration Loading ---

# Read API key (needed by service, but read here for potential future use or validation)
# genai_api_key: str = os.getenv("GENAI_API_KEY") # No longer needed directly in main.py
# if not genai_api_key:
#     raise ValueError("GENAI_API_KEY environment variable not set.")

# Read allowed origins from environment variable, default if not set
allowed_origins_str: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:4200,https://localhost:4200")
allow_origins: List[str] = [origin.strip() for origin in allowed_origins_str.split(',')]

# Read model names from environment variables, default if not set
chat_model_name: str = os.getenv("CHAT_MODEL_NAME", "gemini-2.0-flash")
parse_model_name: str = os.getenv("PARSE_MODEL_NAME", "gemini-2.0-flash-lite")

# Load system instructions from files
def load_instruction(filepath: str) -> str:
    try:
        # Construct path relative to this file's directory
        dir_path = os.path.dirname(os.path.realpath(__file__))
        full_path = os.path.join(dir_path, filepath)
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        # Provide a more informative error if the file is missing
        raise RuntimeError(f"System instruction file not found at expected path: {full_path}")
    except Exception as e:
        raise RuntimeError(f"Error loading system instruction from {full_path}: {e}")

# Relative paths from main.py's location
chat_system_instruction_text: str = load_instruction("prompts/chat_system_instruction.txt")
parse_system_instruction_text: str = load_instruction("prompts/parse_system_instruction.txt")


# --- GenAI Service Import ---
# Ensure the service file is in the python path or use relative import if structured as a package
try:
    from services.genai_service import generate_chat_response, parse_text_with_options
except ImportError as e:
    raise RuntimeError(f"Could not import from services.genai_service. Ensure it's in the Python path or structured correctly. Error: {e}")


# --- FastAPI App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"], # Allow all standard methods
    allow_headers=["*"], # Allow all headers
)


# --- API Endpoints ---

@app.post("/chat")
async def generate(req: Request):
    """
    Handles chat requests by calling the GenAI service.
    """
    try:
        payload: Dict[str, Any] = await req.json() # Use await req.json() for parsing
        history_contents = payload.get("contents")
        new_text = payload.get("text")

        if not isinstance(history_contents, list) or not isinstance(new_text, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload format: 'contents' must be a list and 'text' must be a string."
            )

        # Call the service function
        response_text = await generate_chat_response(
            model_name=chat_model_name,
            system_instruction_text=chat_system_instruction_text,
            history_contents_dicts=history_contents,
            new_user_text=new_text
        )
        # Return plain text response
        # Use Response class for explicit media type if needed, but FastAPI handles text fine
        return response_text
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON received in request body."
        )
    except HTTPException as e:
        # Re-raise HTTPExceptions raised by the service or validation
        raise e
    except Exception as e:
        # Catch-all for unexpected errors in the endpoint logic itself
        print(f"Unexpected error in /chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {e}"
        )


@app.post("/parse")
async def parse(req: Request):
    """
    Handles text parsing requests by calling the GenAI service.
    """
    try:
        payload: Dict[str, Any] = await req.json() # Use await req.json()
        text_to_parse = payload.get("text")

        if not isinstance(text_to_parse, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload format: 'text' must be a string."
            )

        # Call the service function
        parsed_data = await parse_text_with_options(
            model_name=parse_model_name,
            system_instruction_text=parse_system_instruction_text,
            text_to_parse=text_to_parse
        )
        # Return the parsed JSON data
        return parsed_data
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON received in request body."
        )
    except HTTPException as e:
        # Re-raise HTTPExceptions raised by the service or validation
        raise e
    except Exception as e:
        # Catch-all for unexpected errors in the endpoint logic itself
        print(f"Unexpected error in /parse endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {e}"
        )


# --- Main Execution Guard ---
if __name__ == "__main__":
    # Default host and port, can be overridden by environment variables if needed
    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", "8000"))
    print(f"Starting server on {app_host}:{app_port}")
    run(app, host=app_host, port=app_port)
