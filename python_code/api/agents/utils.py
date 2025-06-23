import google.generativeai as genai
import os
import dotenv
import logging
import json
import re

dotenv.load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

logger = logging.getLogger(__name__)

def clean_json_response(response_text):
    """Clean JSON response by removing markdown code blocks and extra whitespace."""
    try:
        # Remove markdown code block markers if present
        cleaned = re.sub(r'^```\w*\n|```$', '', response_text, flags=re.MULTILINE).strip()
        
        # Try to parse it as JSON
        try:
            return json.dumps(json.loads(cleaned))
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON after cleaning: {cleaned}")
            return json.dumps({
                "chain of thought": "Error occurred during JSON processing",
                "decision": "not allowed",
                "message": "Error: Invalid JSON format"
            })
    except Exception as e:
        logger.error(f"Error cleaning JSON response: {str(e)}")
        return json.dumps({
            "chain of thought": "Error occurred during JSON processing",
            "decision": "not allowed",
            "message": f"Error: {str(e)}"
        })

def format_message_for_gemini(message):
    """Format a message for Gemini API."""
    try:
        if isinstance(message, dict):
            return message.get('content', '')
        elif isinstance(message, str):
            return message
        else:
            logger.error(f"Invalid message format: {message}")
            return ''
    except Exception as e:
        logger.error(f"Error formatting message: {str(e)}")
        return ''

def get_chatbot_response(client, messages, temperature=0):
    """Get response from the chatbot with proper error handling and message formatting."""
    try:
        # Format messages for Gemini
        formatted_messages = []
        for message in messages:
            content = format_message_for_gemini(message)
            if content:
                formatted_messages.append(content)
        
        if not formatted_messages:
            logger.error("No valid messages to process")
            return "Error: No valid messages to process"
        
        # Combine all messages into a single prompt
        combined_prompt = "\n".join(formatted_messages)
        
        # Generate response
        response = client.generate_content(
            contents=combined_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2000,
            ),
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        )
        
        # Clean the response if it looks like JSON
        if response.text.strip().startswith('{') or response.text.strip().startswith('```'):
            return clean_json_response(response.text)
        return response.text
        
    except Exception as e:
        logger.error(f"Error in get_chatbot_response: {str(e)}")
        return json.dumps({
            "chain of thought": "Error occurred during processing",
            "decision": "not allowed",
            "message": f"Error: {str(e)}"
        })

def get_embedding(embedding_client, text_input):
    """Get embeddings with error handling."""
    try:
        output = embedding_client.embed_query(text_input)
        return output
    except Exception as e:
        logger.error(f"Error in get_embedding: {str(e)}")
        return None

def double_check_json_output(client, json_string):
    """Validate and correct JSON output with error handling."""
    try:
        # First try to parse it as JSON
        try:
            json.loads(json_string)
            return json_string
        except json.JSONDecodeError:
            pass

        # If parsing failed, try to fix it
        prompt = """You will check this json string and correct any mistakes that will make it invalid. 
        Then you will return ONLY the corrected JSON string with NO markdown formatting or code blocks.
        If the JSON is correct just return it as is.
        Do NOT add any explanation or text outside the JSON.
        Do NOT wrap the JSON in code blocks or markdown.
        Just return the raw JSON string.

        Input JSON:
        """ + json_string

        response = client.generate_content(
            contents=prompt,
            generation_config=genai.GenerationConfig(
                temperature=0,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2000,
            ),
        )

        # Clean and validate the response
        cleaned_response = clean_json_response(response.text)
        
        # Try to parse the cleaned response
        try:
            json.loads(cleaned_response)
            return cleaned_response
        except json.JSONDecodeError:
            logger.error(f"Failed to fix JSON: {json_string}")
            return json.dumps({
                "chain of thought": "Error occurred during JSON processing",
                "decision": "not allowed",
                "message": "Error: Invalid JSON format"
            })
            
    except Exception as e:
        logger.error(f"Error in double_check_json_output: {str(e)}")
        return json.dumps({
            "chain of thought": "Error occurred during JSON processing",
            "decision": "not allowed",
            "message": f"Error: {str(e)}"
        })