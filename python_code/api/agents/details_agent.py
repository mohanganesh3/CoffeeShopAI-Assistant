from dotenv import load_dotenv
import os
from .utils import get_chatbot_response, get_embedding
import google.generativeai as genai
import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from copy import deepcopy
from pinecone import Pinecone

logger = logging.getLogger(__name__)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
load_dotenv()

class DetailsAgent():
    def __init__(self):
        try:
            self.model_name = os.getenv("GEMINI_MODEL_NAME") 
            self.client = genai.GenerativeModel(self.model_name)
            
            self.embedding_model_name = os.getenv("EMBEDDING_MODEL_NAME")
            self.embedding_client = GoogleGenerativeAIEmbeddings(model=self.embedding_model_name) 
            
            pinecone_api_key = os.getenv("PINECONE_API_KEY")
            if not pinecone_api_key:
                raise ValueError("PINECONE_API_KEY not found in environment variables")
                
            self.pc = Pinecone(api_key=pinecone_api_key)
            self.index_name = os.getenv("PINECONE_INDEX_NAME")
            if not self.index_name:
                raise ValueError("PINECONE_INDEX_NAME not found in environment variables")
                
        except Exception as e:
            logger.error(f"Error initializing DetailsAgent: {str(e)}")
            raise
    
    def get_closest_results(self, index_name, input_embeddings, top_k=2):
        """Get closest results from Pinecone with error handling."""
        try:
            index = self.pc.Index(index_name)
            
            results = index.query(
                namespace="ns1",
                vector=input_embeddings,
                top_k=top_k,
                include_values=False,
                include_metadata=True
            )

            return results
        except Exception as e:
            logger.error(f"Error getting closest results: {str(e)}")
            return {"matches": []}

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
                    "memory": {"agent": "details_agent"}
                }

            # Get embeddings
            embedding = get_embedding(self.embedding_client, user_message)
            if not embedding:
                return {
                    "role": "assistant",
                    "content": "I apologize, but I'm having trouble processing your request. Could you please try again?",
                    "memory": {"agent": "details_agent"}
                }

            # Get relevant context
            result = self.get_closest_results(self.index_name, embedding[0])
            source_knowledge = "\n".join([x['metadata']['text'].strip()+'\n' for x in result['matches']])

            if not source_knowledge:
                return {
                    "role": "assistant",
                    "content": "I apologize, but I couldn't find the information you're looking for. Could you please try asking in a different way?",
                    "memory": {"agent": "details_agent"}
                }

            # Create the prompt
            system_prompt = """You are a customer support agent for a coffee shop called Merry's way. 
            You should answer every question as if you are a waiter and provide the necessary information 
            to the user regarding their questions. Be friendly and professional."""

            prompt = f"""Using the context below, answer the user's question:

            Context:
            {source_knowledge}

            User Question: {user_message}

            Remember to be friendly and professional in your response, like a helpful waiter."""

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
                "memory": {"agent": "details_agent"}
            }

        except Exception as e:
            logger.error(f"Error in details agent: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error. Could you please try again?",
                "memory": {"agent": "details_agent"}
            }

    
