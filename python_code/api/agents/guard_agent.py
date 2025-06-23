from dotenv import load_dotenv
import os
import json
from copy import deepcopy
from .utils import get_chatbot_response
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
load_dotenv()

class GuardAgent():
    def __init__(self):
        try:
            self.model_name = os.getenv("GEMINI_MODEL_NAME") 
            if not self.model_name:
                raise ValueError("GEMINI_MODEL_NAME not found in environment variables")
                
            self.client = genai.GenerativeModel(self.model_name)
            
        except Exception as e:
            logger.error(f"Error initializing GuardAgent: {str(e)}")
            raise
    
    def get_response(self, messages):
        try:
            messages = deepcopy(messages)

            system_prompt = """You are a helpful AI assistant for a coffee shop application which serves drinks and pastries.
            Your task is to determine whether the user is asking something relevant to the coffee shop or not.
            
            The user is allowed to:
            1. Ask questions about the coffee shop, like location, working hours, menu items and coffee shop related questions.
            2. Ask questions about menu items, they can ask for ingredients in an item and more details about the item.
            3. Make an order, modify an order, or complete/finish an order (including phrases like "that's all", "I'm done", "that's it", etc.)
            4. Ask about recommendations of what to buy.
            5. Respond to questions about their order or confirm their choices.

            The user is NOT allowed to:
            1. Ask questions about anything else other than our coffee shop.
            2. Ask questions about the staff or how to make a certain menu item.

            IMPORTANT RESPONSE FORMAT:
            Your output MUST be a raw JSON string with NO markdown formatting or code blocks.
            Do NOT wrap the JSON in ```json or ``` markers.
            Just return the raw JSON with this exact format:
            {
                "chain of thought": "your analysis of the user's request",
                "decision": "allowed OR not allowed",
                "message": "error message if not allowed, empty if allowed"
            }
            """

            # Get the last user message
            user_message = ""
            for msg in reversed(messages):
                if msg.get('role') == 'user':
                    user_message = msg.get('content', '')
                    break

            if not user_message:
                return {
                    "role": "assistant",
                    "content": "I couldn't understand your request. Could you please try again?",
                    "memory": {
                        "agent": "guard_agent",
                        "guard_decision": "not allowed"
                    }
                }

            # Create the prompt
            full_prompt = f"{system_prompt}\n\nUser message to evaluate: {user_message}"
            
            # Get response
            response_text = get_chatbot_response(self.client, [{"role": "user", "content": full_prompt}])
            
            try:
                # Try to parse the response as JSON
                output = json.loads(response_text)
                
                # Validate required fields
                if not all(key in output for key in ["chain of thought", "decision", "message"]):
                    raise ValueError("Missing required fields in response")
                
                return {
                    "role": "assistant",
                    "content": output["message"] if output["decision"] == "not allowed" else "",
                    "memory": {
                        "agent": "guard_agent",
                        "guard_decision": output["decision"]
                    }
                }
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response from model: {response_text}")
                return {
                    "role": "assistant",
                    "content": "I apologize, but I encountered an error. Could you please try again?",
                    "memory": {
                        "agent": "guard_agent",
                        "guard_decision": "not allowed"
                    }
                }
                
        except Exception as e:
            logger.error(f"Error in guard agent: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error. Could you please try again?",
                "memory": {
                    "agent": "guard_agent",
                    "guard_decision": "not allowed"
                }
            }

    def postprocess(self,output):
        output = json.loads(output)

        dict_output = {
            "role": "assistant",
            "content": output['message'],
            "memory": {"agent":"guard_agent",
                       "guard_decision": output['decision']
                      }
        }
        return dict_output



    
