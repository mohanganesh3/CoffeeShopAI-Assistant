import json
import pandas as pd
import os
from .utils import get_chatbot_response
import google.generativeai as genai
import logging
from copy import deepcopy
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
load_dotenv()

class RecommendationAgent():
    def __init__(self, apriori_recommendation_path, popular_recommendation_path):
        try:
            self.model_name = os.getenv("GEMINI_MODEL_NAME") 
            if not self.model_name:
                raise ValueError("GEMINI_MODEL_NAME not found in environment variables")
                
            self.client = genai.GenerativeModel(self.model_name)

            # Load recommendation data
            try:
                with open(apriori_recommendation_path, 'r') as file:
                    self.apriori_recommendations = json.load(file)
            except Exception as e:
                logger.error(f"Error loading apriori recommendations: {str(e)}")
                self.apriori_recommendations = {}

            try:
                self.popular_recommendations = pd.read_csv(popular_recommendation_path)
                self.products = self.popular_recommendations['product'].tolist()
                self.product_categories = self.popular_recommendations['product_category'].tolist()
            except Exception as e:
                logger.error(f"Error loading popularity recommendations: {str(e)}")
                self.popular_recommendations = pd.DataFrame()
                self.products = []
                self.product_categories = []
                
        except Exception as e:
            logger.error(f"Error initializing RecommendationAgent: {str(e)}")
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
                return self._get_error_response("I couldn't understand your request. Could you please try again?")

            # Classify the recommendation type
            recommendation_class = self.recommendation_classification(messages)
            if not recommendation_class:
                return self._get_error_response("I'm having trouble understanding what kind of recommendation you need. Could you please try asking in a different way?")

            # Get recommendations based on type
            recommendations = []
            recommendation_type = recommendation_class.get('recommendation_type')
            parameters = recommendation_class.get('parameters', [])

            if recommendation_type == "apriori":
                recommendations = self.get_apriori_recommendation(parameters)
            elif recommendation_type == "popular":
                recommendations = self.get_popular_recommendation()
            elif recommendation_type == "popular by category":
                recommendations = self.get_popular_by_category_recommendation(parameters)
            
            if not recommendations:
                return self._get_error_response("I couldn't find any recommendations based on your request. Could you please try asking in a different way?")
            
            # Format recommendations for response
            recommendations_str = ", ".join(recommendations)
            
            # Create the prompt
            system_prompt = """You are a helpful AI assistant for a coffee shop application which serves drinks and pastries.
            Your task is to recommend items to the user based on their input message. Be friendly and concise.
            Present the recommendations in an unordered list with a very small description for each item."""

            prompt = f"""Based on the user's request: "{user_message}"

            Please recommend these items: {recommendations_str}

            Remember to be friendly and present the recommendations in a clear, appealing way."""

            # Get response
            response_text = get_chatbot_response(
                self.client,
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )

            return {
                "role": "assistant",
                "content": response_text,
                "memory": {"agent": "recommendation_agent"}
            }

        except Exception as e:
            logger.error(f"Error in recommendation agent: {str(e)}")
            return self._get_error_response("I apologize, but I encountered an error. Could you please try again?")

    def recommendation_classification(self, messages):
        """Classify the type of recommendation needed."""
        try:
            # Get the last user message
            user_message = ""
            for msg in reversed(messages):
                if msg.get('role') == 'user':
                    user_message = msg.get('content', '')
                    break

            if not user_message:
                return None

            system_prompt = f"""You are a helpful AI assistant for a coffee shop application which serves drinks and pastries. 
            We have 3 types of recommendations:

            1. Apriori Recommendations: Based on items frequently bought together
            2. Popular Recommendations: Based on overall item popularity
            3. Popular Recommendations by Category: Based on popularity within a specific category

            Available items: {", ".join(self.products)}
            Available categories: {", ".join(self.product_categories)}

            Your output MUST be a valid JSON string with this exact format:
            {{
                "chain of thought": "your analysis of the recommendation type needed",
                "recommendation_type": "apriori OR popular OR popular by category",
                "parameters": []  // List of items for apriori, categories for popular by category, empty for popular
            }}
            """

            prompt = f"Classify this recommendation request: {user_message}"
            
            # Get response
            response_text = get_chatbot_response(
                self.client,
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            try:
                output = json.loads(response_text)
                if not all(key in output for key in ["chain of thought", "recommendation_type", "parameters"]):
                    raise ValueError("Missing required fields in response")
                return output
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response from model: {response_text}")
                return None
                
        except Exception as e:
            logger.error(f"Error in recommendation classification: {str(e)}")
            return None

    def get_apriori_recommendation(self, items, max_recommendations=3):
        """Get recommendations based on items frequently bought together."""
        try:
            recommendations = set()
            for item in items:
                if item in self.apriori_recommendations:
                    # Extract just the product names from the recommendations
                    item_recommendations = [rec['product'] for rec in self.apriori_recommendations[item]]
                    recommendations.update(item_recommendations)
            
            # Remove items already in the input list
            recommendations = recommendations - set(items)
            
            return list(recommendations)[:max_recommendations]
        except Exception as e:
            logger.error(f"Error getting apriori recommendations: {str(e)}")
            return []

    def get_popular_recommendation(self, max_recommendations=3):
        """Get overall popular recommendations."""
        try:
            if not self.popular_recommendations.empty:
                return self.popular_recommendations['product'].head(max_recommendations).tolist()
            return []
        except Exception as e:
            logger.error(f"Error getting popular recommendations: {str(e)}")
            return []

    def get_popular_by_category_recommendation(self, categories, max_recommendations=3):
        """Get popular recommendations within specified categories."""
        try:
            if not self.popular_recommendations.empty:
                recommendations = []
                for category in categories:
                    category_items = self.popular_recommendations[
                        self.popular_recommendations['product_category'] == category
                    ]['product'].head(max_recommendations).tolist()
                    recommendations.extend(category_items)
                return recommendations[:max_recommendations]
            return []
        except Exception as e:
            logger.error(f"Error getting category recommendations: {str(e)}")
            return []

    def get_recommendations_from_order(self, messages, order):
        """Get recommendations based on current order."""
        try:
            products = [item['item'] for item in order]
            recommendations = self.get_apriori_recommendation(products)
            
            if not recommendations:
                # Get popular recommendations instead
                recommendations = self.get_popular_recommendation(max_recommendations=2)
                
                if not recommendations:
                    return {
                        "role": "assistant",
                        "content": "Would you like anything else with your order? We have a variety of pastries and drinks that might interest you!",
                        "memory": {"agent": "recommendation_agent"}
                    }
            
            recommendations_str = ", ".join(recommendations)
            
            system_prompt = """You are a helpful AI assistant for a coffee shop application.
            Your task is to recommend additional items that would go well with the customer's current order.
            Be friendly, enthusiastic, and explain why these items would complement their order.
            Focus on creating an appealing combination of items.
            DO NOT list or summarize their current order - just focus on the recommendations."""

            prompt = f"""Based on their order of: {', '.join(products)}
            
            Please recommend these additional items: {recommendations_str}
            
            Make your response friendly and explain why these items would go well with their current order.
            Keep it concise but enticing.
            DO NOT repeat their current order or show prices - just focus on the recommendations."""

            response_text = get_chatbot_response(
                self.client,
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )

            return {
                "role": "assistant",
                "content": response_text,
                "memory": {"agent": "recommendation_agent"}
            }

        except Exception as e:
            logger.error(f"Error getting order recommendations: {str(e)}")
            return {
                "role": "assistant",
                "content": "Would you like to try one of our fresh pastries with your order? They go perfectly with our drinks!",
                "memory": {"agent": "recommendation_agent"}
            }

    def _get_error_response(self, message):
        """Generate a standard error response."""
        return {
            "role": "assistant",
            "content": message,
            "memory": {"agent": "recommendation_agent"}
        }


