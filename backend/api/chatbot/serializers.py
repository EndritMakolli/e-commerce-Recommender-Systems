from rest_framework import serializers
from .models import ChatSession, Message, ChatContext
from base.serializers import ProductSerializer


class MessageSerializer(serializers.ModelSerializer):
    related_products = ProductSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'related_products', 'is_helpful']
        read_only_fields = ['id', 'timestamp']


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating chat sessions"""
    class Meta:
        model = ChatSession
        fields = ['title']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'title', 'created_at', 'updated_at', 'is_active', 'messages', 'message_count']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_active']

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing chat sessions"""
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_active', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None


class ChatMessageRequestSerializer(serializers.Serializer):
    """Serializer for incoming chat messages"""
    content = serializers.CharField(max_length=5000)
    session_id = serializers.UUIDField(required=False)

    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Message cannot be empty")
        return value


class ChatContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatContext
        fields = ['user', 'browsing_history', 'product_interests', 'last_updated']
        read_only_fields = ['user', 'last_updated']
