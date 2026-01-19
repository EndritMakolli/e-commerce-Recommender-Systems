from django.urls import path
from base.views.recommendation_views import (
    getRecommendations,
    getMyRecommendationsDynamic,
    getRelatedProducts,
    getRestockDynamic,
)

urlpatterns = [
    path("", getRecommendations, name="recommendations"),
    path("my/", getMyRecommendationsDynamic, name="recommendations-my"),
    path("restock-dynamic/", getRestockDynamic, name="recommendations-restock-dynamic"),
    path("related/<str:pk>/", getRelatedProducts, name="recommendations-related"),
]
