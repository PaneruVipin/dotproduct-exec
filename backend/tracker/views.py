from rest_framework import  serializers, viewsets, permissions, generics, status
from django.contrib.auth.models import User
from .models import Category, Transaction, MonthlyBudget
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    MonthlyBudgetSerializer,
    RegisterSerializer,
    MonthlyStatsSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from datetime import date
from django.db.models import Sum, F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .filters import TransactionFilter
from rest_framework.decorators import api_view

class MonthlyStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        query_month = request.query_params.get("month")

        try:
            query_date = date.fromisoformat(query_month + "-01") if query_month else date.today().replace(day=1)
        except ValueError:
            return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

        # Budget
        budget = (
            MonthlyBudget.objects.filter(user=user, month=query_date, is_active=True)
            .values_list("amount", flat=True)
            .first()
        ) or 0

        # Transactions for the month
        transactions = (
            Transaction.objects.filter(
                user=user,
                created_at__year=query_date.year,
                created_at__month=query_date.month,
                is_active=True,
                category__is_active=True  # Optional: if you soft-delete categories
            )
            .values(category_type=F("category__type"), category_name=F("category__name"))
            .annotate(total_amount=Sum("amount"))
        )

        income_categories = []
        expense_categories = []
        total_income = 0
        total_expense = 0

        for item in transactions:
            data = {
                "category": item["category_name"],
                "amount": item["total_amount"]
            }
            if item["category_type"] == "income":
                income_categories.append(data)
                total_income += item["total_amount"]
            else:
                expense_categories.append(data)
                total_expense += item["total_amount"]

        return Response({
            "month": query_date.strftime("%Y-%m"),
            "budget": budget,
            "total_income": total_income,
            "total_expense": total_expense,
            "income_categories": income_categories,
            "expense_categories": expense_categories
        })


class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MonthlyBudgetPagination(PageNumberPagination):
    page_size = 10 # You can set the page size you want
    page_size_query_param = 'page_size'
    max_page_size = 100  # The maximum number of results per page

class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MonthlyBudgetPagination

    def get_queryset(self):
        user = self.request.user
        return MonthlyBudget.objects.filter(user=user, is_active=True).order_by('-month') 
    
    @action(detail=False, methods=['get'], url_path='current-month')
    def get_current_month_budget(self, request):
        user = request.user
        current_month = date.today().replace(day=1)  # Get the first day of the current month
        try:
            current_budget = MonthlyBudget.objects.get(user=user, month=current_month, is_active=True)
            serializer = self.get_serializer(current_budget)
            return Response(serializer.data)
        except MonthlyBudget.DoesNotExist:
            return Response({"detail": "No budget found for the current month."}, status=status.HTTP_404_NOT_FOUND)


class CategoryViewSet(SoftDeleteModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user, is_active=True)
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": len(serializer.data),
            "next": None,
            "previous": None,
            "results": serializer.data
        })



class TransactionViewSet(SoftDeleteModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = TransactionFilter
    search_fields = ['description']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user, is_active=True).order_by('-created_at')

class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]



class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
