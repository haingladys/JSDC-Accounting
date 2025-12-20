from django.shortcuts import get_object_or_404, render, redirect
from django.utils import timezone
from decimal import Decimal
from ..models import Expense

def expenses(request):
    if request.method == "POST":
        expense_id = request.POST.get('expense_id')
        try:
            unit_price = Decimal(request.POST.get('unit_price', '0'))
            quantity = Decimal(request.POST.get('quantity', '0'))
        except (ValueError, TypeError):
            unit_price = Decimal('0')
            quantity = Decimal('0')

        data = {
            'date': request.POST.get('date'),
            'category': request.POST.get('category'),
            'unit_price': unit_price,
            'quantity': quantity,
            'unit': request.POST.get('unit'),
            'description': request.POST.get('description'),
            'payment_method': request.POST.get('payment_method'),
        }

        if expense_id:
            Expense.objects.filter(id=expense_id).update(**data)
        else:
            Expense.objects.create(**data)
        return redirect('expenses')

    all_expenses = Expense.objects.all().order_by('-date')
    context = {
        'expenses': all_expenses,
        'today_date': timezone.now().date().isoformat(),
        'categories': [c[0] for c in Expense.CATEGORY_CHOICES],
        'units': [u[0] for u in Expense.UNIT_CHOICES],
        'payment_methods': [p[0] for p in Expense.PAYMENT_METHOD_CHOICES],
    }
    return render(request, 'fine/expenses.html', context)

def delete_expense(request, pk):
    if request.method == "POST":
        expense = get_object_or_404(Expense, pk=pk)
        expense.delete()
    return redirect('expenses')