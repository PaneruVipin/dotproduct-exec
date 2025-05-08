from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class TimeStampedSoftDeleteModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()

class Category(TimeStampedSoftDeleteModel):
    CATEGORY_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=7, choices=CATEGORY_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Transaction(TimeStampedSoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)

    def __str__(self):
        return f'{self.category.name} - {self.amount}'


class MonthlyBudget(TimeStampedSoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ['user', 'month']
