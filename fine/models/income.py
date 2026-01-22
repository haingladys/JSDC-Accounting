from django.db import models
from django.utils import timezone

class Income(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Credit Card', 'Credit Card'),
        ('Bank Transfer', 'Bank Transfer'),
        ('Swiggy', 'Swiggy'),
        ('Zomato', 'Zomato'),
    ]

    STATUS_CHOICES = [
        ('Received', 'Received'),
        ('Pending', 'Pending'),
    ]

    date = models.DateField(default=timezone.now)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=50, choices=PAYMENT_MODE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Received')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inc: {self.description} - ₹{self.amount}"