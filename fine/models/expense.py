# fine/models/expense.py
from django.db import models
from django.utils import timezone
from .base import SoftDeleteModel, SoftDeleteManager


class Expense(SoftDeleteModel):
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
        ('Salary', 'Salary'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank Transfer', 'Bank Transfer'),
        ('UPI', 'UPI'),
        ('Credit', 'Credit'),
        ('Salary', 'Salary'),
    ]

    date = models.DateField(default=timezone.now)
    voucher_no = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)

    # User-facing total amount (Mandatory)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Optional legacy fields to prevent IntegrityErrors from existing view logic
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1, blank=True, null=True)
    unit = models.CharField(max_length=20, default='pcs', blank=True, null=True)

    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    payroll = models.ForeignKey(
        'Payroll',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    employee_name = models.CharField(max_length=100, blank=True, null=True)

    # Custom managers for soft delete support
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        # Set default record state to active if not provided
        if not self.record_state:
            self.record_state = 'active'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Exp: {self.category} - ₹{self.total_amount}"