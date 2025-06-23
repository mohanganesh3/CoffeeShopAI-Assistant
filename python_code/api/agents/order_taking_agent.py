import os
import json
from .utils import get_chatbot_response, double_check_json_output
import google.generativeai as genai
import logging
from copy import deepcopy
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
load_dotenv()

class OrderTakingAgent():
    def __init__(self, recommendation_agent):
        try:
            self.model_name = os.getenv("GEMINI_MODEL_NAME") 
            if not self.model_name:
                raise ValueError("GEMINI_MODEL_NAME not found in environment variables")
                
            self.client = genai.GenerativeModel(self.model_name)
            self.recommendation_agent = recommendation_agent
            
        except Exception as e:
            logger.error(f"Error initializing OrderTakingAgent: {str(e)}")
            raise
    
    def get_response(self, messages):
        try:
            messages = deepcopy(messages)
            
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
                        "agent": "order_taking_agent",
                        "step number": "1",
                        "order": [],
                        "asked_recommendation_before": False
                    }
                }

            # Get current order status from previous messages
            current_order = []
            asked_recommendation_before = False
            current_step = "1"
            
            for message in reversed(messages):
                if (message.get('role') == 'assistant' and 
                    message.get('memory', {}).get('agent') == 'order_taking_agent'):
                    current_order = message['memory'].get('order', [])
                    asked_recommendation_before = message['memory'].get('asked_recommendation_before', False)
                    current_step = message['memory'].get('step number', '1')
                    break

            # Create the prompt with current order status
            system_prompt = f"""You are a customer support Bot for a coffee shop called "Merry's way"

            Here is the menu for this coffee shop:
            Cappuccino - $4.50
            Jumbo Savory Scone - $3.25
            Latte - $4.75
            Chocolate Chip Biscotti - $2.50
            Espresso shot - $2.00
            Hazelnut Biscotti - $2.75
            Chocolate Croissant - $3.75
            Dark chocolate (Drinking Chocolate) - $5.00
            Cranberry Scone - $3.50
            Croissant - $3.25
            Almond Croissant - $4.00
            Ginger Biscotti - $2.50
            Oatmeal Scone - $3.25
            Ginger Scone - $3.50
            Chocolate syrup - $1.50
            Hazelnut syrup - $1.50
            Carmel syrup - $1.50
            Sugar Free Vanilla syrup - $1.50
            Dark chocolate (Packaged Chocolate) - $3.00

            Current order status:
            Step number: {current_step}
            Current order: {json.dumps(current_order, indent=2)}

            Things to NOT DO:
            * DON'T ask how to pay by cash or Card.
            * Don't tell the user to go to the counter
            * Don't tell the user to go to place to get the order
            * DON'T include items from the current order in your response's order list - only include NEW items being ordered

            Your task is as follows:
            1. Take the User's Order
            2. Validate that all their items are in the menu
            3. If an item is not in the menu let the user know and repeat back the remaining valid order
            4. Ask them if they need anything else
            5. If they do then repeat starting from step 3
            6. If they don't want anything else:
               a. List down all the items and their prices
               b. Calculate the total
               c. Thank the user for the order and close the conversation

            IMPORTANT RESPONSE FORMAT:
            Your output MUST be a raw JSON string with NO markdown formatting or code blocks.
            Do NOT wrap the JSON in ```json or ``` markers.
            Just return the raw JSON with this exact format:
            {{
                "chain of thought": "your analysis of the order status and next steps",
                "step number": "current step number (1-6)",
                "order": [
                    {{"item": "item name", "quantity": number, "price": price}}
                ],
                "response": "your response to the user"
            }}

            Note: The order list in your response should ONLY include NEW items being ordered, not items from the current order.
            The current order will be combined with your new items automatically.
            DO NOT include the order summary in your response - it will be added automatically."""

            # Create the prompt
            full_prompt = f"{system_prompt}\n\nUser message: {user_message}"
            
            # Get response
            response_text = get_chatbot_response(self.client, [{"role": "user", "content": full_prompt}])
            
            try:
                # Parse and validate response
                output = json.loads(response_text)
                
                if not all(key in output for key in ["chain of thought", "step number", "order", "response"]):
                    raise ValueError("Missing required fields in response")
                
                # Process order if needed
                if isinstance(output["order"], str):
                    output["order"] = json.loads(output["order"])
                
                # Combine with current order
                combined_order = self._combine_orders(current_order, output["order"])
                
                # Get recommendations if appropriate
                response = output['response']
                
                if not asked_recommendation_before and combined_order:
                    try:
                        recommendation_output = self.recommendation_agent.get_recommendations_from_order(messages, combined_order)
                        response = f"{response}\n\n{recommendation_output['content']}"
                        asked_recommendation_before = True
                    except Exception as e:
                        logger.error(f"Error getting recommendations: {str(e)}")
                
                return {
                    "role": "assistant",
                    "content": response,
                    "memory": {
                        "agent": "order_taking_agent",
                        "step number": output["step number"],
                        "order": combined_order,
                        "asked_recommendation_before": asked_recommendation_before
                    }
                }
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON response from model: {str(e)}")
                return self._get_error_response()
                
        except Exception as e:
            logger.error(f"Error in order taking agent: {str(e)}")
            return self._get_error_response()

    def _get_last_order_status(self, messages):
        """Extract the last order status from message history."""
        try:
            for message in reversed(messages):
                if (message.get('role') == 'assistant' and 
                    message.get('memory', {}).get('agent') == 'order_taking_agent'):
                    
                    step_number = message['memory'].get('step number', '1')
                    order = message['memory'].get('order', [])
                    
                    return f"""
                    step number: {step_number}
                    order: {json.dumps(order, indent=2)}
                    """
            return "step number: 1\norder: []"
            
        except Exception as e:
            logger.error(f"Error getting last order status: {str(e)}")
            return "step number: 1\norder: []"

    def _was_recommendation_asked(self, messages):
        """Check if recommendations were already asked in this conversation."""
        try:
            for message in reversed(messages):
                if (message.get('role') == 'assistant' and 
                    message.get('memory', {}).get('agent') == 'order_taking_agent'):
                    return message['memory'].get('asked_recommendation_before', False)
            return False
        except Exception as e:
            logger.error(f"Error checking recommendation status: {str(e)}")
            return False

    def _get_error_response(self):
        """Generate a standard error response."""
        return {
            "role": "assistant",
            "content": "I apologize, but I encountered an error processing your order. Could you please try again?",
            "memory": {
                "agent": "order_taking_agent",
                "step number": "1",
                "order": [],
                "asked_recommendation_before": False
            }
        }

    def _combine_orders(self, current_order, new_order):
        """Combine current order with new order items."""
        try:
            # If either order is empty, return the non-empty one
            if not current_order:
                return new_order
            if not new_order:
                return current_order
                
            # Create a dictionary to track items by name
            order_dict = {}
            
            # Add current order items
            for item in current_order:
                name = item['item']
                order_dict[name] = {
                    'item': name,
                    'quantity': int(item['quantity']),
                    'price': float(item['price'])
                }
            
            # Add or update with new order items
            for item in new_order:
                name = item['item']
                quantity = int(item['quantity'])
                price = float(item['price'])
                
                if name in order_dict:
                    # Only update quantity if it's a new order
                    order_dict[name]['quantity'] += quantity
                else:
                    order_dict[name] = {
                        'item': name,
                        'quantity': quantity,
                        'price': price
                    }
            
            # Convert back to list
            return list(order_dict.values())
            
        except Exception as e:
            logger.error(f"Error combining orders: {str(e)}")
            # Return whichever order is valid
            return current_order if current_order else new_order

    
