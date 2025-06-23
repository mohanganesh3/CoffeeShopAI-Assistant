import os
import logging
from agents import (GuardAgent,
                    ClassificationAgent,
                    DetailsAgent,
                    OrderTakingAgent,
                    RecommendationAgent,
                    AgentProtocol
                    )

logger = logging.getLogger(__name__)

class AgentController():
    def __init__(self):
        try:
            # Get the absolute path to the recommendation files
            current_dir = os.path.dirname(os.path.abspath(__file__))
            apriori_path = os.path.join(current_dir, 'recommendation_objects', 'apriori_recommendations.json')
            popularity_path = os.path.join(current_dir, 'recommendation_objects', 'popularity_recommendation.csv')
            
            # Initialize agents with error handling
            self.guard_agent = GuardAgent()
            self.classification_agent = ClassificationAgent()
            self.recommendation_agent = RecommendationAgent(apriori_path, popularity_path)
            
            self.agent_dict: dict[str, AgentProtocol] = {
                "details_agent": DetailsAgent(),
                "order_taking_agent": OrderTakingAgent(self.recommendation_agent),
                "recommendation_agent": self.recommendation_agent
            }
            logger.info("AgentController initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing AgentController: {str(e)}")
            raise
    
    def get_response(self, input):
        try:
            # Extract User Input
            job_input = input["input"]
            messages = job_input["messages"]
            
            # Log incoming request
            logger.info(f"Processing request with {len(messages)} messages")
            
            # Get GuardAgent's response
            guard_agent_response = self.guard_agent.get_response(messages)
            if guard_agent_response["memory"]["guard_decision"] == "not allowed":
                logger.info("Request blocked by GuardAgent")
                return guard_agent_response
            
            # Get ClassificationAgent's response
            classification_agent_response = self.classification_agent.get_response(messages)
            chosen_agent = classification_agent_response["memory"]["classification_decision"]
            logger.info(f"Request classified to agent: {chosen_agent}")
            
            # Get the chosen agent's response
            agent = self.agent_dict[chosen_agent]
            response = agent.get_response(messages)
            
            return response
            
        except KeyError as e:
            logger.error(f"Invalid input format: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error with the input format. Please try again.",
                "memory": {"error": str(e)}
            }
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error. Please try again.",
                "memory": {"error": str(e)}
            }
