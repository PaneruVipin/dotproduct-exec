from rest_framework import  serializers, viewsets, permissions, generics
from django.contrib.auth.models import User
from .models import Category, Transaction, MonthlyBudget
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    MonthlyBudgetSerializer,
    RegisterSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from datetime import date

class MonthlyBudgetPagination(PageNumberPagination):
    page_size = 2 # You can set the page size you want
    page_size_query_param = 'page_size'
    max_page_size = 100  # The maximum number of results per page

class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MonthlyBudgetPagination

    def get_queryset(self):
        user = self.request.user
        return MonthlyBudget.objects.filter(user=user).order_by('-month') 
    @action(detail=False, methods=['get'], url_path='current-month')
    def get_current_month_budget(self, request):
        user = request.user
        current_month = date.today().replace(day=1)  # Get the first day of the current month
        try:
            current_budget = MonthlyBudget.objects.get(user=user, month=current_month)
            serializer = self.get_serializer(current_budget)
            return Response(serializer.data)
        except MonthlyBudget.DoesNotExist:
            return Response({"detail": "No budget found for the current month."}, status=status.HTTP_404_NOT_FOUND)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]



class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)