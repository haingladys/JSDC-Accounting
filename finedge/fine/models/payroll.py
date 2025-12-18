# models/payroll.py
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from .base import SoftDeleteModel
from django.utils import timezone


class Payroll(SoftDeleteModel):
    PAYROLL_STATUS_CHOICES = (
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    )
    
    employee_name = models.CharField(max_length=100)
    basic_pay = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    advances = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    spr_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    status = models.CharField(max_length=10, choices=PAYROLL_STATUS_CHOICES, default='unpaid')
    salary_date = models.DateField()
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payroll'
        unique_together = ['employee_name', 'month', 'year', 'record_state']
        ordering = ['-year', '-month', 'employee_name']

    def __str__(self):
        return f"{self.employee_name} - {self.month}/{self.year} - ₹{self.net_salary}"

    def calculate_salary(self):
        """Calculate net salary: basic_pay + spr_amount - advances"""
        self.net_salary = self.basic_pay + self.spr_amount - self.advances
        if self.net_salary < Decimal('0'):
            self.net_salary = Decimal('0')

    def save(self, *args, **kwargs):
        # Set month and year from salary_date if not set
        if not self.month or not self.year:
            self.month = self.salary_date.month
            self.year = self.salary_date.year
        # Calculate salary
        self.calculate_salary()
        super().save(*args, **kwargs)
    
    def soft_delete(self):

        self.record_state = 'deleted'
        self.deleted_at = timezone.now()
        self.save()