from django.urls import path
from base.views import ai_views as views

urlpatterns = [
    # Visual Search
    path('visual-search/', views.visualSearch, name="visual-search"),
]
