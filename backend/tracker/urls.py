from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    TransactionViewSet,
    MonthlyBudgetViewSet,
    RegisterUserView,
    UserProfileView,
    MonthlyStatsAPIView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'monthly-budgets', MonthlyBudgetViewSet, basename='monthlybudget')

urlpatterns = router.urls + [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path("stats/", MonthlyStatsAPIView.as_view(), name="monthly-stats"),
]
