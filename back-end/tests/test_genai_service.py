import unittest
from unittest.mock import patch, MagicMock, AsyncMock # Added AsyncMock for async functions
import os
import sys
from fastapi import HTTPException
import json

# Add the parent directory (back-end) to the sys.path to find the services module
# This is a common pattern when running tests from a subdirectory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Now import the service and its components
# It's important to set GENAI_API_KEY *before* importing the service, as it reads it at import time
os.environ["GENAI_API_KEY"] = "test_api_key_for_unit_tests" # Set a dummy key
try:
    from services import genai_service
    from google.genai import types # Import types for verification
    from google.api_core import exceptions as google_exceptions # Import exceptions for mocking
except ImportError as e:
    print(f"Failed to import genai_service: {e}")
    print(f"sys.path: {sys.path}")
    # If imports fail, the tests below will likely fail or not run.
    # This indicates a problem with the path setup or the service file itself.
    genai_service = None # Avoid NameError later

# --- Test Class ---

# Ensure the service was imported before defining tests
# @unittest.skipIf(genai_service is None, "Skipping tests because genai_service could not be imported.")
class TestGenAIService(unittest.TestCase):

    def setUp(self):
        """Set up for test methods."""
        # Reset environment variables or mocks if needed between tests
        os.environ["GENAI_API_KEY"] = "test_api_key_for_unit_tests"
        # You might need to reload the module if it caches the client,
        # but typically mocking the client instance is sufficient.
        pass

    # --- Tests for format_genai_contents (Step 3) ---

    def test_format_genai_contents_empty(self):
        """Test format_genai_contents with an empty list."""
        if not genai_service: self.skipTest("genai_service not imported")
        result = genai_service.format_genai_contents([])
        self.assertEqual(result, [])

    def test_format_genai_contents_valid(self):
        """Test format_genai_contents with valid input."""
        if not genai_service: self.skipTest("genai_service not imported")
        input_data = [
            {"role": "user", "text": "Hello"},
            {"role": "model", "text": "Hi there!"}
        ]
        result = genai_service.format_genai_contents(input_data)
        self.assertEqual(len(result), 2)
        self.assertIsInstance(result[0], types.Content)
        self.assertEqual(result[0].role, "user")
        self.assertEqual(result[0].parts[0].text, "Hello")
        self.assertIsInstance(result[1], types.Content)
        self.assertEqual(result[1].role, "model")
        self.assertEqual(result[1].parts[0].text, "Hi there!")

    def test_format_genai_contents_missing_keys(self):
        """Test format_genai_contents with items missing keys."""
        if not genai_service: self.skipTest("genai_service not imported")
        input_data = [
            {"role": "user"}, # Missing text
            {"text": "Hi"},   # Missing role
            {"role": "model", "text": "I am fine."}
        ]
        # Expecting it to skip the malformed entries and process the valid one
        result = genai_service.format_genai_contents(input_data)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].role, "model")
        self.assertEqual(result[0].parts[0].text, "I am fine.")

    def test_format_genai_contents_invalid_role(self):
        """Test format_genai_contents handles potentially invalid roles gracefully."""
        # The GenAI library might validate roles, but our function should create the object
        if not genai_service: self.skipTest("genai_service not imported")
        input_data = [{"role": "assistant", "text": "How can I help?"}]
        result = genai_service.format_genai_contents(input_data)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].role, "assistant") # It should still pass the role through

    # --- Tests for generate_chat_response (Step 4 - Basic Mocking) ---

    @patch('services.genai_service.client', new_callable=MagicMock) # Mock the client instance
    def test_generate_chat_response_success(self, mock_client):
        """Test successful chat response generation."""
        if not genai_service: self.skipTest("genai_service not imported")

        # Configure the mock response
        mock_api_response = MagicMock()
        mock_api_response.text = "This is the AI response."
        # Mock the specific method used inside the service function
        mock_client.generate_content = AsyncMock(return_value=mock_api_response)

        # Call the async function using await
        import asyncio
        result = asyncio.run(genai_service.generate_chat_response(
            model_name="test-chat-model",
            system_instruction_text="Be helpful.",
            history_contents_dicts=[{"role": "user", "text": "Hi"}],
            new_user_text="How are you?"
        ))

        # Assertions
        self.assertEqual(result, "This is the AI response.")
        mock_client.generate_content.assert_awaited_once()
        call_args, call_kwargs = mock_client.generate_content.call_args
        self.assertEqual(call_kwargs.get('model'), "test-chat-model")
        # Check contents formatting (simplified check)
        sent_contents = call_kwargs.get('contents')
        self.assertEqual(len(sent_contents), 2)
        self.assertEqual(sent_contents[0].role, "user")
        self.assertEqual(sent_contents[0].parts[0].text, "Hi")
        self.assertEqual(sent_contents[1].role, "user") # Both user messages are appended
        self.assertEqual(sent_contents[1].parts[0].text, "How are you?")
        # Check config (simplified check)
        sent_config = call_kwargs.get('config')
        self.assertEqual(sent_config.response_mime_type, "text/plain")
        self.assertEqual(sent_config.system_instruction[0].text, "Be helpful.")


    @patch('services.genai_service.client', new_callable=MagicMock)
    def test_generate_chat_response_api_error(self, mock_client):
        """Test handling of GoogleAPIError during chat generation."""
        if not genai_service: self.skipTest("genai_service not imported")

        # Configure the mock to raise an API error
        mock_client.generate_content = AsyncMock(side_effect=google_exceptions.GoogleAPIError("Quota exceeded"))

        import asyncio
        # Assert that calling the function raises HTTPException
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(genai_service.generate_chat_response(
                model_name="test-chat-model",
                system_instruction_text="Be helpful.",
                history_contents_dicts=[],
                new_user_text="Test"
            ))
        self.assertEqual(cm.exception.status_code, 500)
        self.assertIn("GenAI API Error: Quota exceeded", cm.exception.detail)
        mock_client.generate_content.assert_awaited_once() # Ensure it was called


    # --- Tests for parse_text_with_options (Step 4 - Basic Mocking) ---

    @patch('services.genai_service.client', new_callable=MagicMock)
    def test_parse_text_with_options_success(self, mock_client):
        """Test successful text parsing."""
        if not genai_service: self.skipTest("genai_service not imported")

        mock_api_response = MagicMock()
        expected_json = [{"text": "Question?", "options": ["A", "B"]}]
        mock_api_response.text = json.dumps(expected_json)
        mock_client.generate_content = AsyncMock(return_value=mock_api_response)

        import asyncio
        result = asyncio.run(genai_service.parse_text_with_options(
            model_name="test-parse-model",
            system_instruction_text="Parse this.",
            text_to_parse="User input text"
        ))

        self.assertEqual(result, expected_json)
        mock_client.generate_content.assert_awaited_once()
        call_args, call_kwargs = mock_client.generate_content.call_args
        self.assertEqual(call_kwargs.get('model'), "test-parse-model")
        self.assertEqual(call_kwargs.get('contents'), "User input text")
        sent_config = call_kwargs.get('config')
        self.assertEqual(sent_config.response_mime_type, "application/json")
        self.assertEqual(sent_config.system_instruction[0].text, "Parse this.")


    @patch('services.genai_service.client', new_callable=MagicMock)
    def test_parse_text_with_options_json_decode_error(self, mock_client):
        """Test handling of JSONDecodeError during parsing."""
        if not genai_service: self.skipTest("genai_service not imported")

        mock_api_response = MagicMock()
        mock_api_response.text = "This is not valid JSON" # Invalid JSON
        mock_client.generate_content = AsyncMock(return_value=mock_api_response)

        import asyncio
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(genai_service.parse_text_with_options(
                model_name="test-parse-model",
                system_instruction_text="Parse this.",
                text_to_parse="User input text"
            ))
        self.assertEqual(cm.exception.status_code, 500)
        self.assertIn("Failed to decode JSON response from GenAI", cm.exception.detail)
        mock_client.generate_content.assert_awaited_once()


    @patch('services.genai_service.client', new_callable=MagicMock)
    def test_parse_text_with_options_api_error(self, mock_client):
        """Test handling of GoogleAPIError during parsing."""
        if not genai_service: self.skipTest("genai_service not imported")

        mock_client.generate_content = AsyncMock(side_effect=google_exceptions.InternalServerError("Server issue"))

        import asyncio
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(genai_service.parse_text_with_options(
                model_name="test-parse-model",
                system_instruction_text="Parse this.",
                text_to_parse="User input text"
            ))
        self.assertEqual(cm.exception.status_code, 500)
        self.assertIn("GenAI API Error: 500 Server issue", cm.exception.detail) # Check the error message format
        mock_client.generate_content.assert_awaited_once()


if __name__ == '__main__':
    # Ensure the environment variable is set before running tests
    if "GENAI_API_KEY" not in os.environ:
        print("Warning: GENAI_API_KEY not set, tests might fail if service relies on it during import.")
        os.environ["GENAI_API_KEY"] = "dummy_key_for_runner"

    # Discover and run tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
