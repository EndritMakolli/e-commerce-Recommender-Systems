from django.contrib import admin
from .models import ChatSession, Message, ChatContext


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'created_at', 'updated_at', 'is_active']
    list_filter = ['created_at', 'is_active']
    search_fields = ['user__username', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'sender', 'content_preview', 'timestamp', 'is_helpful']
    list_filter = ['sender', 'timestamp', 'is_helpful']
    search_fields = ['content', 'session__title']
    readonly_fields = ['id', 'timestamp']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ChatContext)
class ChatContextAdmin(admin.ModelAdmin):
    list_display = ['user', 'last_updated']
    search_fields = ['user__username']
    readonly_fields = ['last_updated']
