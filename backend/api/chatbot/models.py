from django.db import models
from django.contrib.auth.models import User
from base.models import Product
import uuid


class ChatSession(models.Model):
    """Represents a chat conversation session"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Message(models.Model):
    """Stores individual chat messages"""
    SENDER_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    related_products = models.ManyToManyField(Product, blank=True, related_name='chat_messages')
    is_helpful = models.BooleanField(null=True, blank=True)  # For feedback

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"


class ChatContext(models.Model):
    """Stores context information about user preferences and browsing history"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='chat_context')
    browsing_history = models.JSONField(default=list)  # List of product IDs viewed
    product_interests = models.JSONField(default=dict)  # Categories user is interested in
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Context for {self.user.username}"
