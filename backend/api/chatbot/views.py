from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import ChatSession, Message, ChatContext
from .serializers import (
    ChatSessionSerializer,
    ChatSessionCreateSerializer,
    ChatSessionListSerializer,
    MessageSerializer,
    ChatMessageRequestSerializer,
)
from .utils import AIResponseGenerator
from base.models import Product


class ChatSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chat sessions"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        """Return chat sessions for the current user"""
        return ChatSession.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return ChatSessionListSerializer
        elif self.action == 'create':
            return ChatSessionCreateSerializer
        return ChatSessionSerializer

    def perform_create(self, serializer):
        """Create chat session for current user"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_new_session(self, request):
        """Create a new chat session"""
        title = request.data.get('title', 'New Chat')
        session = ChatSession.objects.create(
            user=request.user,
            title=title
        )
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message and get AI response"""
        session = self.get_object()
        
        serializer = ChatMessageRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message_content = serializer.validated_data['content']

        # Save user message
        user_message = Message.objects.create(
            session=session,
            sender='user',
            content=user_message_content
        )

        # Get chat context for AI
        context = self._get_chat_context(request.user)
        
        # Get conversation history for context
        messages = self._format_messages_for_ai(session)
        
        # Generate AI response
        ai_response = AIResponseGenerator.generate_response(
            messages=messages,
            context=context
        )

        # Save bot message
        bot_message = Message.objects.create(
            session=session,
            sender='bot',
            content=ai_response
        )

        # Try to link relevant products
        self._link_related_products(bot_message, user_message_content)

        # Update session timestamp
        session.save()

        return Response({
            'user_message': MessageSerializer(user_message).data,
            'bot_message': MessageSerializer(bot_message).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a session"""
        session = self.get_object()
        messages = session.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def clear_session(self, request, pk=None):
        """Clear all messages in a session"""
        session = self.get_object()
        session.messages.all().delete()
        return Response({'status': 'Session cleared'})

    @action(detail=False, methods=['get'])
    def active_sessions(self, request):
        """Get all active sessions"""
        sessions = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark a message as helpful/unhelpful"""
        session = self.get_object()
        message_id = request.data.get('message_id')
        is_helpful = request.data.get('is_helpful')

        message = get_object_or_404(Message, id=message_id, session=session)
        message.is_helpful = is_helpful
        message.save()

        return Response({'status': 'Feedback recorded'})

    def _format_messages_for_ai(self, session):
        """Format session messages for AI model"""
        messages = session.messages.all().order_by('timestamp')
        return [
            {
                'role': 'user' if msg.sender == 'user' else 'assistant',
                'content': msg.content
            }
            for msg in messages
        ]

    def _get_chat_context(self, user):
        """Get user context for personalized responses"""
        try:
            chat_context = ChatContext.objects.get(user=user)
            return {
                'username': user.username,
                'browsing_history': chat_context.browsing_history,
                'product_interests': chat_context.product_interests,
            }
        except ChatContext.DoesNotExist:
            return {
                'username': user.username,
                'browsing_history': [],
                'product_interests': {},
            }

    def _link_related_products(self, message, user_input):
        """Link relevant products to the bot's response (only for product-seeking queries)"""
        try:
            user_input_lower = user_input.lower()
            
            # Keywords that indicate user wants to see products
            product_intent_keywords = [
                'show', 'find', 'looking', 'want', 'need', 'buy', 'purchase',
                'recommend', 'suggest', 'best', 'cheap', 'affordable', 
                'laptop', 'monitor', 'phone', 'headphone', 'earbuds', 'keyboard',
                'mouse', 'gaming', 'electronics', 'product', 'shop', 'browse'
            ]
            
            # Keywords that indicate general questions (no products needed)
            no_product_keywords = [
                'price', 'cost', 'how much', 'shipping', 'delivery', 'return',
                'refund', 'warranty', 'deal', 'discount', 'sale', 'offer',
                'payment', 'order', 'track', 'status', 'help', 'support',
                'hours', 'contact', 'location', 'policy'
            ]
            
            # Check if user wants general info only
            has_no_product_intent = any(keyword in user_input_lower for keyword in no_product_keywords)
            if has_no_product_intent and not any(keyword in user_input_lower for keyword in product_intent_keywords):
                # Don't show products for general questions
                return
            
            # Check if user is asking for products
            has_product_intent = any(keyword in user_input_lower for keyword in product_intent_keywords)
            if not has_product_intent:
                # No clear intent to see products
                return
            
            # Extract keywords from user input (remove common words)
            common_words = {'can', 'you', 'help', 'me', 'find', 'a', 'the', 'what', 'is', 'are', 'do', 'does', 'have', 'has', 'i', 'to', 'for', 'and', 'or', 'in', 'on', 'at', 'by', 'with', 'from'}
            keywords = [w for w in user_input_lower.split() if w not in common_words and len(w) > 2]
            
            products = Product.objects.none()
            
            # Try matching with individual keywords
            for keyword in keywords[:5]:  # Use first 5 keywords
                products = products | Product.objects.filter(
                    Q(name__icontains=keyword) |
                    Q(description__icontains=keyword) |
                    Q(category__icontains=keyword)
                )
            
            # Remove duplicates and limit to 6 products
            products = products.distinct()[:6]
            
            # Only show products if we found relevant matches
            if products.exists():
                message.related_products.set(products)

        except Exception as e:
            print(f"Error linking products: {str(e)}")


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading messages"""
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        """Return messages from user's sessions only"""
        user_sessions = ChatSession.objects.filter(user=self.request.user)
        return Message.objects.filter(session__in=user_sessions)

    @action(detail=False, methods=['get'])
    def recent_messages(self, request):
        """Get recent messages across all sessions"""
        messages = self.get_queryset().order_by('-timestamp')[:20]
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
