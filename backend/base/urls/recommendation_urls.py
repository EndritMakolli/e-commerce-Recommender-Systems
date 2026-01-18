from django.urls import path
from base.views.recommendation_views import getRecommendations, getMyRecommendationsDynamic, getRelatedProducts

urlpatterns = [
    path("", getRecommendations, name="recommendations"),
    path("my/", getMyRecommendationsDynamic, name="recommendations-my"),
    path("related/<str:pk>/", getRelatedProducts, name="recommendations-related"),
]
