from django.db import models
from django.utils import timezone

class Purchase(models.Model):
    VENDOR_CHOICES = [
        ('Ram', 'Ram'),
        ('Veera', 'Veera'),
        ('Local Purchase', 'Local Purchase'),
    ]

    CATEGORY_CHOICES = [
        ('Beeda', 'Beeda'),
        ('Coconut', 'Coconut'),
        ('Milk', 'Milk'),
        ('Vegetables', 'Vegetables'),
        ('Others', 'Others'),
    ]

    UNIT_CHOICES = [
        ('kg', 'kg'),
        ('liters', 'liters'),
        ('pcs', 'pcs'),
    ]

    STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
        ('Credit', 'Credit'),
    ]

    date = models.DateField(default=timezone.now)
    vendor = models.CharField(max_length=100, choices=VENDOR_CHOICES)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    bill_no = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_applicable = models.BooleanField(default=True, verbose_name="GST Applicable")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pur: {self.vendor} - ₹{self.total_amount}"