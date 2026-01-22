from django.contrib import admin
from .models import Expense, Income, Purchase

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('date', 'category', 'total_amount', 'payment_method')
    list_filter = ('category', 'date')

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('date', 'description', 'amount', 'payment_mode', 'status')
    list_filter = ('status', 'date')

# fine/admin.py

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    # Change 'category' to 'cat' here
    list_display = ('date', 'vendor', 'cat', 'bill_no', 'total_amount', 'status')
    # Also check list_filter or search_fields if they exist
    list_filter = ('cat', 'status', 'vendor')