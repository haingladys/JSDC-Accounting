from django.shortcuts import render
from django.db.models import Sum
from ..models import Expense, Purchase, Income

def dashboard(request):
    # Calculate Total Income
    total_income = Income.objects.aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Calculate Total Expenses
    total_expenses = Expense.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    # Calculate Total Purchases
    total_purchases = Purchase.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    # Calculate Net Balance (Income - (Expenses + Purchases))
    net_balance = total_income - (total_expenses + total_purchases)

    # Fetch 5 Most Recent Expenses for the table
    recent_expenses = Expense.objects.all().order_by('-date')[:5]

    context = {
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_purchases': total_purchases,
        'net_balance': net_balance,
        'recent_expenses': recent_expenses,
    }
    return render(request, 'fine/dashboard.html', context)
