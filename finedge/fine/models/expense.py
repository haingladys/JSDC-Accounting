from django.db import models
from django.utils import timezone

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Beta & OT', 'Beta & OT'),
        ('Daily Salary', 'Daily Salary'),
        ('Electricity', 'Electricity'),
        ('ESI & PF', 'ESI & PF'),
        ('Petrol & Diesel', 'Petrol & Diesel'),
        ('Phone Bill', 'Phone Bill'),
        ('Pooja', 'Pooja'),
        ('Donation', 'Donation'),
        ('Rental', 'Rental'),
        ('Repair & Maintenance', 'Repair & Maintenance'),
        ('Sweet', 'Sweet'),
        ('Travel Expenses', 'Travel Expenses'),
        ('Vessels', 'Vessels'),
        ('Wages', 'Wages'),
        ('Washing wages', 'Washing wages'),
        ('Water', 'Water'),
        ('New Joinee Advance', 'New Joinee Advance'),
        ('Interest and Bank Loan', 'Interest and Bank Loan'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank Transfer', 'Bank Transfer'),
        ('UPI', 'UPI'),
        ('Credit', 'Credit'),
    ]

    UNIT_CHOICES = [
        ('pcs', 'pcs'),
        ('kg', 'kg'),
        ('liters', 'liters'),
        ('person', 'person'),
    ]

    date = models.DateField(default=timezone.now)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_amount = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Exp: {self.category} - ₹{self.total_amount}"