"""
AI Integration utilities for the chatbot
Supports OpenAI API, Hugging Face, and local LLM models
"""

import os
from typing import List, Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)


class AIIntegration:
    """Base class for AI integrations"""

    def __init__(self):
        self.model_type = os.getenv('AI_MODEL_TYPE', 'openai')  # openai, huggingface, local
        self.api_key = os.getenv('AI_API_KEY', '')
        
        # Log for debugging
        if not self.api_key or self.api_key == 'your_openai_api_key_here':
            logger.warning(f"AI_API_KEY not properly configured. Model type: {self.model_type}")

    def generate_response(self, messages: List[Dict], context: Dict = None) -> str:
        """Generate a response from the AI model"""
        raise NotImplementedError


class OpenAIIntegration(AIIntegration):
    """Integration with OpenAI GPT models"""

    def __init__(self):
        super().__init__()
        try:
            from openai import OpenAI
            if not self.api_key:
                raise ValueError("AI_API_KEY environment variable is not set")
            self.client = OpenAI(api_key=self.api_key)
        except ImportError:
            raise ImportError("Please install openai package: pip install openai")
        except ValueError as ve:
            logger.error(f"OpenAI configuration error: {str(ve)}")
            raise

    def generate_response(self, messages: List[Dict], context: Dict = None) -> str:
        """
        Generate response using OpenAI API
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            context: Optional context dict with user info, browsing history, etc.
        
        Returns:
            Generated response string
        """
        try:
            # Add system context to guide the AI
            system_message = self._build_system_prompt(context)
            
            conversation = [
                {"role": "system", "content": system_message},
                *messages
            ]

            model = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
            logger.debug(f"Calling OpenAI with model: {model}")
            
            response = self.client.chat.completions.create(
                model=model,
                messages=conversation,
                temperature=0.7,
                max_tokens=500,
            )

            return response.choices[0].message.content

        except Exception as e:
            error_msg = f"OpenAI API Error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return f"Sorry, I encountered an error: {str(e)[:100]}. Please check your API key and try again."

    def _build_system_prompt(self, context: Dict = None) -> str:
        """Build a system prompt with e-commerce context"""
        base_prompt = """You are a helpful e-commerce customer service assistant. Your role is to:
1. Help customers find products that match their needs
2. Answer questions about products, prices, and availability
3. Provide personalized product recommendations based on customer preferences
4. Help with orders and shipping information
5. Be friendly, professional, and concise

Be conversational but brief. If a customer asks about a specific product, provide helpful information.
If relevant, suggest similar products that might interest them."""

        if context:
            if context.get('browsing_history'):
                base_prompt += f"\n\nThe customer has recently viewed these product categories: {', '.join(context['browsing_history'][:5])}"
            if context.get('product_interests'):
                interests = ', '.join(context['product_interests'].keys())
                base_prompt += f"\n\nThe customer is interested in: {interests}"
            if context.get('username'):
                base_prompt += f"\n\nYou're chatting with: {context['username']}"

        return base_prompt


class GeminiIntegration(AIIntegration):
    """Integration with Google Gemini AI using the new google-genai package"""

    def __init__(self):
        super().__init__()
        try:
            import google.genai as genai
            if not self.api_key:
                raise ValueError("AI_API_KEY environment variable is not set")
            self.client = genai.Client(api_key=self.api_key)
        except ImportError:
            # Fallback to google-generativeai if google-genai not available
            try:
                import google.generativeai as genai
                if not self.api_key:
                    raise ValueError("AI_API_KEY environment variable is not set")
                genai.configure(api_key=self.api_key)
                self.client = None
                self.legacy_model = genai.GenerativeModel('gemini-2.0-flash')
                self.use_legacy = True
            except:
                raise ImportError("Please install: pip install google-genai")
        self.use_legacy = False

    def generate_response(self, messages: List[Dict], context: Dict = None) -> str:
        """Generate response using Google Gemini AI"""
        try:
            # Build system context
            system_prompt = self._build_system_prompt(context)
            
            # Format conversation for Gemini
            conversation_text = system_prompt + "\n\n"
            for msg in messages[-10:]:  # Last 10 messages
                role = "User" if msg.get('role') == 'user' else "Assistant"
                conversation_text += f"{role}: {msg.get('content', '')}\n"
            
            conversation_text += "Assistant: "
            
            # Generate response
            if self.use_legacy:
                response = self.legacy_model.generate_content(conversation_text)
                return response.text
            else:
                response = self.client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=conversation_text
                )
                return response.text

        except Exception as e:
            error_msg = f"Gemini API Error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return f"Sorry, I encountered an error: {str(e)[:100]}. Please check your API key and try again."

    def _build_system_prompt(self, context: Dict = None) -> str:
        """Build a system prompt with e-commerce context"""
        base_prompt = """You are a helpful e-commerce customer service assistant. Your role is to:
1. Help customers find products that match their needs
2. Answer questions about products, prices, and availability
3. Provide personalized product recommendations based on customer preferences
4. Help with orders and shipping information
5. Be friendly, professional, and concise

Be conversational but brief. If a customer asks about a specific product, provide helpful information.
If relevant, suggest similar products that might interest them."""

        if context:
            if context.get('browsing_history'):
                base_prompt += f"\n\nThe customer has recently viewed these product categories: {', '.join(context['browsing_history'][:5])}"
            if context.get('product_interests'):
                interests = ', '.join(context['product_interests'].keys())
                base_prompt += f"\n\nThe customer is interested in: {interests}"
            if context.get('username'):
                base_prompt += f"\n\nYou're chatting with: {context['username']}"

        return base_prompt


class HuggingFaceInferenceIntegration(AIIntegration):
    """Integration with Hugging Face Inference API (FREE - RECOMMENDED!)"""

    def __init__(self):
        super().__init__()
        self.client = None
        self.use_local = True  # Default to local
        
        try:
            from huggingface_hub import InferenceClient
            if self.api_key and self.api_key != 'YOUR_HUGGINGFACE_API_TOKEN_HERE':
                self.client = InferenceClient(api_key=self.api_key)
                self.use_local = False
        except ImportError:
            logger.warning("huggingface-hub not available, using local responses")
        except Exception as e:
            logger.warning(f"Could not initialize HF client, using local: {e}")

    def generate_response(self, messages: List[Dict], context: Dict = None) -> str:
        """Generate response using Hugging Face Inference API or local fallback"""
        try:
            if self.use_local or not self.client:
                return self._generate_local_response(messages, context)
            
            # Build system context
            system_prompt = self._build_system_prompt(context)
            
            # Format conversation for the model
            conversation = system_prompt + "\n\n"
            for msg in messages[-10:]:  # Last 10 messages
                role = "User" if msg.get('role') == 'user' else "Assistant"
                conversation += f"{role}: {msg.get('content', '')}\n"
            
            # Use text generation with a free model
            response = self.client.text_generation(
                prompt=conversation,
                max_new_tokens=200,
                temperature=0.7
            )
            
            return response

        except Exception as e:
            error_msg = f"Hugging Face API Error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return self._generate_local_response(messages, context)

    def _generate_local_response(self, messages: List[Dict], context: Dict = None) -> str:
        """Generate a response using local logic (no API needed)"""
        if not messages:
            return "Hello! How can I help you today?"
        
        last_message = messages[-1].get('content', '').lower()
        
        # Smart responses based on keywords matching suggested questions
        responses = {
            'track': "You can track your order in your account dashboard under 'Orders'. We'll send you email updates with tracking information. What's your order number?",
            'popular': "Our most popular items right now include: Gaming Laptops (Alienware), 4K Monitors (curved ultrawide), Premium Earbuds (AirPods, Sony), and Gaming Headsets. What interests you?",
            'recommend': "I'd love to recommend products! Tell me what you're looking for - are you interested in laptops, monitors, earbuds, or gaming gear? What's your budget?",
            'return': "Our return policy allows returns within 30 days of purchase with original packaging. Items must be in unused condition. Contact support for return authorization.",
            'discount': "We have ongoing discounts on selected items! Check our 'Deals' section for the latest offers. First-time customers may get a 10% discount code.",
            'account': "Creating an account is easy! Click 'Register' at the top of the page. You'll need an email and password. Once registered, you can track orders and save favorites.",
            'payment': "We accept: Credit Cards (Visa, Mastercard, Amex), PayPal, Debit Cards, and Apple Pay. All transactions are secure and encrypted.",
            'product': "We have a wide variety of products! We offer gaming laptops, 4K monitors, premium earbuds, and tech accessories. What category interests you?",
            'laptop': "Great choice! We have gaming laptops and professional models. Popular brands: Alienware, Dell, HP. Budget options start at $699, premium at $2000+. What's your budget?",
            'monitor': "Our monitors include ultrawide curved displays, 4K monitors, and gaming monitors. Brands: Alienware, LG, Samsung. Prices range from $300-$2000. What do you need?",
            'earbuds': "We have premium wireless earbuds with noise-cancelling. Brands: AirPods Pro, Sony WF-1000, Samsung Galaxy Buds. Prices $100-$400. Looking for wireless or gaming?",
            'gaming': "For gaming! Do you want a gaming laptop, high refresh rate monitor, gaming headset, or mechanical keyboard?",
            'price': "Prices vary by product. Budget items: $50-$300. Mid-range: $300-$1000. Premium: $1000+. What type of product interests you?",
            'deal': "Check our featured deals! We have limited-time discounts on selected laptops, monitors, and accessories. Visit the 'Deals' section.",
            'buy': "Ready to shop? Browse our catalog, add items to your cart, and proceed to checkout. Free shipping on orders over $50!",
            'help': "I'm here to help! Ask about products, prices, features, orders, or I can recommend items. What do you need?",
            'cheap': "We have affordable options! Budget laptops from $699, monitors from $300, earbuds from $100. What's your budget?",
        }
        
        # Find best matching response
        for keyword, response in responses.items():
            if keyword in last_message:
                return response
        
        # Default helpful response
        return "I'd be happy to help! Could you tell me more about what you're looking for? Are you interested in laptops, monitors, earbuds, or something else? Feel free to ask about prices, shipping, returns, or anything else!"

    def _build_system_prompt(self, context: Dict = None) -> str:
        """Build a system prompt with e-commerce context"""
        base_prompt = """You are a helpful e-commerce customer service assistant. Your role is to:
1. Help customers find products that match their needs
2. Answer questions about products, prices, and availability
3. Provide personalized product recommendations based on customer preferences
4. Help with orders and shipping information
5. Be friendly, professional, and concise

Be conversational but brief. If a customer asks about a specific product, provide helpful information."""

        if context:
            if context.get('browsing_history'):
                base_prompt += f"\n\nCustomer's recent interests: {', '.join(context['browsing_history'][:5])}"
            if context.get('username'):
                base_prompt += f"\nChatting with: {context['username']}"

        return base_prompt


class LocalLLMIntegration(AIIntegration):
    """Integration with local LLM models (Ollama, LLama, etc.)"""

    def __init__(self):
        super().__init__()
        self.base_url = os.getenv('LOCAL_LLM_URL', 'http://localhost:11434')
        self.model = os.getenv('LOCAL_LLM_MODEL', 'llama2')
        try:
            import requests
            self.requests = requests
        except ImportError:
            raise ImportError("Please install requests: pip install requests")

    def generate_response(self, messages: List[Dict], context: Dict = None) -> str:
        """Generate response using local LLM"""
        try:
            system_prompt = self._build_system_prompt(context)
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    *messages
                ],
                "stream": False,
            }

            response = self.requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()['message']['content']
            else:
                return "Sorry, the local AI server is not responding. Please try again."

        except Exception as e:
            print(f"Local LLM Error: {str(e)}")
            return "Sorry, I encountered an error. Please try again."

    def _build_system_prompt(self, context: Dict = None) -> str:
        """Build system prompt for local LLM"""
        return """You are a helpful e-commerce customer service chatbot. Help customers find products, answer questions, and provide recommendations. Be concise and friendly."""


class AIResponseGenerator:
    """Factory class to get the appropriate AI integration"""

    @staticmethod
    def get_integration(model_type: str = None) -> AIIntegration:
        """Get the appropriate AI integration based on model type"""
        model_type = model_type or os.getenv('AI_MODEL_TYPE', 'huggingface')

        if model_type.lower() in ['huggingface', 'hf']:
            return HuggingFaceInferenceIntegration()
        elif model_type.lower() == 'gemini':
            return GeminiIntegration()
        elif model_type.lower() == 'openai':
            return OpenAIIntegration()
        elif model_type.lower() == 'local':
            return LocalLLMIntegration()
        else:
            raise ValueError(f"Unknown AI model type: {model_type}")

    @staticmethod
    def generate_response(
        messages: List[Dict],
        context: Dict = None,
        model_type: str = None
    ) -> str:
        """
        Generate AI response
        
        Args:
            messages: Conversation history
            context: User context (browsing history, preferences)
            model_type: Type of AI model to use
        
        Returns:
            AI-generated response
        """
        try:
            integration = AIResponseGenerator.get_integration(model_type)
            return integration.generate_response(messages, context)
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return "Sorry, I'm having trouble responding right now. Please try again."
