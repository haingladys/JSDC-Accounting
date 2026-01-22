from django.db import models
from django.utils import timezone


class Cat(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Purchase(models.Model):
    # Status choices matching the options in your HTML modal
    STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
        ('Due', 'Due'),
    ]

    # Payment mode choices matching your modal dropdown
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Card', 'Card'),
        ('Net Banking', 'Net Banking'),
    ]

    date = models.DateField(default=timezone.now)
    vendor = models.CharField(max_length=100)
    cat = models.ForeignKey(Cat, on_delete=models.PROTECT)
    bill_no = models.CharField(max_length=50)

    # Adding 'default=0' allows migrations to run smoothly for existing rows
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    payment_mode = models.CharField(
        max_length=50,
        choices=PAYMENT_CHOICES,
        default='Cash'
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='Paid'
    )

    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pur: {self.vendor} - ₹{self.total_amount}"