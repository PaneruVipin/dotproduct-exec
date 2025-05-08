from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction, MonthlyBudget
from datetime import date
from .models import MonthlyBudget

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = Category
        fields = '__all__'
        exclude = ['user']

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = Transaction
        fields = '__all__'
        exclude = ['user']
        
class MonthlyBudgetSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    month = serializers.DateField(read_only=True)  # Only auto-set in create

    class Meta:
        model = MonthlyBudget
        fields = ['id', 'user', 'month', 'amount']
        read_only_fields = ['id', 'user', 'month']

    def to_internal_value(self, data):
        # Force 'month' to current month in POST
        if self.instance is None:  # Creation
            data = data.copy()
            data['month'] = date.today().replace(day=1).isoformat()
        return super().to_internal_value(data)

    def validate(self, attrs):
        user = self.context['request'].user
        today = date.today().replace(day=1)

        # If creating, ensure this user doesn't already have a budget for this month
        if self.instance is None:
            exists = MonthlyBudget.objects.filter(user=user, month=today).exists()
            if exists:
                raise serializers.ValidationError("You already have a budget for this month.")

        # If updating, restrict changes to current month only
        if self.instance:
            if self.instance.month != today:
                raise serializers.ValidationError("You can only update the current month's budget.")

        return attrs

    def create(self, validated_data):
        validated_data['month'] = date.today().replace(day=1)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Only 'amount' should be allowed in updates
        instance.amount = validated_data.get('amount', instance.amount)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id",'first_name','last_name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data['email']
        password = validated_data['password']
        user = User.objects.create_user(
            username=email,  # username is same as email
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']