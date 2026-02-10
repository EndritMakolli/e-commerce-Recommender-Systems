from django.urls import path
from base.views import price_alert_views as views

urlpatterns = [
    # Price Alerts
    path('create/', views.createPriceAlert, name='create-price-alert'),
    path('list/', views.getUserPriceAlerts, name='user-price-alerts'),
    path('delete/<str:pk>/', views.deletePriceAlert, name='delete-price-alert'),
    
    # Price History
    path('history/<str:pk>/', views.getProductPriceHistory, name='product-price-history'),
    
    # Smart Pricing
    path('smart-pricing/<str:pk>/', views.getSmartPricingRecommendation, name='smart-pricing'),
]
