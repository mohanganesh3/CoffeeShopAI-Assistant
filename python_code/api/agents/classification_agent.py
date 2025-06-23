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

class ClassificationAgent():
    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL_NAME") 
        self.client = genai.GenerativeModel(self.model_name)
    
    def get_response(self, messages):
        try:
            messages = deepcopy(messages)

            system_prompt = """You are a helpful AI assistant for a coffee shop application.
            Your task is to determine what agent should handle the user input. You have 3 agents to choose from:
            
            1. details_agent: This agent is responsible for answering questions about the coffee shop, like location, delivery places, working hours, details about menu items. Or listing items in the menu items. Or by asking what we have.
            2. order_taking_agent: This agent is responsible for taking orders from the user. It's responsible to have a conversation with the user about the order until it's complete. This includes handling order completion phrases like "that's all", "I'm done", "that's it", etc.
            3. recommendation_agent: This agent is responsible for giving recommendations to the user about what to buy. If the user asks for a recommendation, this agent should be used.

            Your output MUST be a valid JSON string with this exact format:
            {
                "chain of thought": "your analysis of which agent should handle this request",
                "decision": "details_agent OR order_taking_agent OR recommendation_agent",
                "message": ""
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
                        "agent": "classification_agent",
                        "classification_decision": "details_agent"
                    }
                }

            # Create the prompt
            full_prompt = f"{system_prompt}\n\nUser message to classify: {user_message}"
            
            # Get response
            response_text = get_chatbot_response(self.client, [{"role": "user", "content": full_prompt}])
            
            try:
                # Try to parse the response as JSON
                output = json.loads(response_text)
                
                # Validate required fields and decision value
                if not all(key in output for key in ["chain of thought", "decision", "message"]):
                    raise ValueError("Missing required fields in response")
                
                if output["decision"] not in ["details_agent", "order_taking_agent", "recommendation_agent"]:
                    raise ValueError(f"Invalid decision value: {output['decision']}")
                
                return {
                    "role": "assistant",
                    "content": "",
                    "memory": {
                        "agent": "classification_agent",
                        "classification_decision": output["decision"]
                    }
                }
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response from model: {response_text}")
                return {
                    "role": "assistant",
                    "content": "I apologize, but I encountered an error. Could you please try again?",
                    "memory": {
                        "agent": "classification_agent",
                        "classification_decision": "details_agent"
                    }
                }
                
        except Exception as e:
            logger.error(f"Error in classification agent: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error. Could you please try again?",
                "memory": {
                    "agent": "classification_agent",
                    "classification_decision": "details_agent"
                }
            }

    def postprocess(self,output):
        output = json.loads(output)

        dict_output = {
            "role": "assistant",
            "content": output['message'],
            "memory": {"agent":"classification_agent",
                       "classification_decision": output['decision']
                      }
        }
        return dict_output

    
