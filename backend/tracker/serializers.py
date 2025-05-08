from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction, MonthlyBudget

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

    class Meta:
        model = MonthlyBudget
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance:  # This means it's an update
            self.fields['month'].read_only = True

    def validate_month(self, value):
        user = self.context['request'].user

        if self.instance and self.instance.month == value:
            return value

        exists = MonthlyBudget.objects.filter(
            user=user,
            month__year=value.year,
            month__month=value.month
        ).exists()

        if exists:
            raise serializers.ValidationError("Budget already exists for this month.")
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

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