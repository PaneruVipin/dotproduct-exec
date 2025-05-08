import django_filters
from .models import Transaction

class TransactionFilter(django_filters.FilterSet):
    amount_min = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    amount_max = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")
    category = django_filters.NumberFilter(field_name="category_id")

    class Meta:
        model = Transaction
        fields = ["category", "amount_min", "amount_max", "date_from", "date_to"]
