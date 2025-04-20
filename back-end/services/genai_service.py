import os
import json
from google import genai
from google.genai import types
from google.api_core import exceptions as google_exceptions
from fastapi import HTTPException, status # Added status for clarity
from typing import List, Dict, Any, Union

# --- Configuration ---
genai_api_key: str = os.getenv("GENAI_API_KEY")
if not genai_api_key:
    raise ValueError("GENAI_API_KEY environment variable not set for genai_service.")

# --- GenAI Client Initialization ---
try:
    client = genai.Client(api_key=genai_api_key)
except Exception as e:
    raise RuntimeError(f"Failed to initialize GenAI client: {e}") from e

# --- Helper Function ---
def format_genai_contents(contents: List[Dict[str, str]]) -> List[types.Content]:
    """Formats a list of chat messages into GenAI Content objects."""
    res: List[types.Content] = []
    for content in contents:
        role = content.get("role")
        text = content.get("text")
        if not role or not text:
            # Log warning or skip? Skipping for now.
            print(f"Warning: Skipping malformed content item: {content}")
            continue
        res.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=text)],
            )
        )
    return res

# --- Service Functions ---

async def generate_chat_response(
    model_name: str,
    system_instruction_text: str,
    history_contents_dicts: List[Dict[str, str]], # Renamed for clarity
    new_user_text: str
) -> str:
    """
    Generates a chat response using the GenAI API.

    Args:
        model_name: The name of the GenAI model to use.
        system_instruction_text: The system instruction text.
        history_contents_dicts: List of previous chat messages (dictionaries).
        new_user_text: The new user message text.

    Returns:
        The generated text response from the model.

    Raises:
        HTTPException: If there is an API error or configuration issue.
    """
    try:
        # Format history and add the new user message
        contents: List[types.Content] = format_genai_contents(history_contents_dicts)
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=new_user_text)],
            )
        )

        # Prepare configuration
        config = types.GenerateContentConfig(
            response_mime_type="text/plain",
            system_instruction=[types.Part.from_text(text=system_instruction_text)],
        )

        # Make the API call
        response = client.generate_content( # Use generate_content, not client.models...
            model=model_name,
            config=config,
            contents=contents
        )
        return response.text

    except google_exceptions.GoogleAPIError as e:
        # Handle API-specific errors (e.g., quota issues, invalid arguments)
        print(f"GenAI API Error in generate_chat_response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GenAI API Error: {e}",
        ) from e
    except Exception as e:
        # Handle other potential errors during processing
        print(f"Unexpected error in generate_chat_response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
        ) from e

async def parse_text_with_options(
    model_name: str,
    system_instruction_text: str,
    text_to_parse: str
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Parses text using the GenAI API, expecting JSON output.

    Args:
        model_name: The name of the GenAI model to use.
        system_instruction_text: The system instruction text.
        text_to_parse: The text content to be parsed by the model.

    Returns:
        The parsed JSON object (either a dictionary or a list of dictionaries).

    Raises:
        HTTPException: If there is an API error, JSON decoding error, or other issue.
    """
    try:
        # Prepare configuration
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            system_instruction=[types.Part.from_text(text=system_instruction_text)],
        )

        # Make the API call
        response = client.generate_content( # Use generate_content, not client.models...
            model=model_name,
            config=config,
            contents=text_to_parse # Input is just the text string for this endpoint
        )

        # Parse the JSON response
        return json.loads(response.text)

    except google_exceptions.GoogleAPIError as e:
        print(f"GenAI API Error in parse_text_with_options: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GenAI API Error: {e}",
        ) from e
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error in parse_text_with_options: {e}")
        print(f"Raw response text: {response.text if 'response' in locals() else 'Response object not available'}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decode JSON response from GenAI: {e}",
        ) from e
    except Exception as e:
        print(f"Unexpected error in parse_text_with_options: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
        ) from e
