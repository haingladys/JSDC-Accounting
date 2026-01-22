# expense_views.py - Updated for direct total amount entry and soft delete support
from django.shortcuts import get_object_or_404, render, redirect
from django.utils import timezone
from decimal import Decimal
from ..models import Expense, Income
from django.http import JsonResponse
from datetime import datetime
import calendar
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json


def expenses(request):
    """
    Main view to list, filter, and record expenses.
    Handles direct total_amount entry and removes unit-based logic.
    """
    if request.method == "POST":
        expense_id = request.POST.get('expense_id')
        category = request.POST.get('category', '').strip()

        # Capture total_amount directly from the form
        try:
            total_amount = Decimal(request.POST.get('total_amount', '0'))
        except (ValueError, TypeError):
            total_amount = Decimal('0')

        # Prepare data for model saving
        data = {
            'date': request.POST.get('date'),
            'voucher_no': request.POST.get('voucher_no'),
            'category': category,
            'total_amount': total_amount,
            'description': request.POST.get('description', ''),
            'payment_method': request.POST.get('payment_method'),
            'employee_name': request.POST.get('employee_name', ''),
        }

        # Handle payroll connection if provided
        payroll_id = request.POST.get('payroll_id')
        if payroll_id:
            from ..models import Payroll
            try:
                payroll = Payroll.all_objects.get(id=payroll_id, record_state='active')
                data['payroll'] = payroll
                if not data['employee_name']:
                    data['employee_name'] = payroll.employee_name
            except Payroll.DoesNotExist:
                pass

        if expense_id:
            # Update existing expense (including soft deleted ones)
            expense = get_object_or_404(Expense.all_objects, id=expense_id)

            # Restore if it was previously soft-deleted
            if expense.record_state == 'deleted':
                expense.record_state = 'active'
                expense.deleted_at = None

            # Update fields dynamically
            for key, value in data.items():
                setattr(expense, key, value)
            expense.save()
        else:
            # Create new expense record
            Expense.objects.create(**data)

        return redirect('expenses')

    # --- GET: Handle Listing and Filtering ---
    # Get active expenses by default
    all_expenses = Expense.objects.all().order_by('-date')

    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    category_filter = request.GET.get('category')
    show_deleted = request.GET.get('show_deleted', 'false').lower() == 'true'

    if show_deleted:
        all_expenses = Expense.all_objects.all().order_by('-date')

    # Date range filtering
    if start_date and end_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            all_expenses = all_expenses.filter(date__range=[start_date_obj, end_date_obj])
        except ValueError:
            today = timezone.now().date()
            start_date = today.replace(day=1).isoformat()
            end_date = today.replace(day=calendar.monthrange(today.year, today.month)[1]).isoformat()

    # Category filtering logic
    if category_filter:
        if category_filter == '!Salary':
            all_expenses = all_expenses.exclude(category='Salary')
        else:
            all_expenses = all_expenses.filter(category=category_filter)

    # Calculate totals based on filtered results
    if not show_deleted:
        total_expenses = sum(exp.total_amount for exp in all_expenses)
        payroll_expenses = sum(exp.total_amount for exp in all_expenses.filter(category='Salary'))
        other_expenses = total_expenses - payroll_expenses
    else:
        total_expenses = payroll_expenses = other_expenses = 0

    # Default date values if not provided
    if not start_date or not end_date:
        today = timezone.now().date()
        start_date = today.replace(day=1).isoformat()
        end_date = today.replace(day=calendar.monthrange(today.year, today.month)[1]).isoformat()

    context = {
        'expenses': all_expenses,
        'total_expenses': total_expenses,
        'payroll_expenses': payroll_expenses,
        'other_expenses': other_expenses,
        'start_date': start_date,
        'end_date': end_date,
        'today_date': timezone.now().date().isoformat(),
        'categories': [choice[0] for choice in Expense.CATEGORY_CHOICES],
        'payment_methods': [p[0] for p in Expense.PAYMENT_METHOD_CHOICES],
        # UNIT_CHOICES removed to fix AttributeError
        'show_deleted': show_deleted,
    }
    return render(request, 'fine/expenses.html', context)


def delete_expense(request, pk):
    """Soft delete an expense record."""
    if request.method == "POST":
        expense = get_object_or_404(Expense.all_objects, pk=pk)
        if expense.record_state == 'active':
            expense.soft_delete()
    return redirect('expenses')


@csrf_exempt
@require_POST
def restore_expense(request):
    """Restore a soft deleted expense record."""
    try:
        data = json.loads(request.body)
        expense_id = data.get('id')
        expense = get_object_or_404(Expense.all_objects, id=expense_id)

        if expense.record_state != 'deleted':
            return JsonResponse({'success': False, 'message': 'Record is not deleted'}, status=400)

        expense.restore()
        return JsonResponse({'success': True, 'message': 'Expense restored successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


def get_expense_report(request):
    """Generate JSON data for expense and income reports."""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    expenses_qs = Expense.objects.all()
    income_qs = Income.objects.all()

    if start_date and end_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            expenses_qs = expenses_qs.filter(date__range=[start_date_obj, end_date_obj])
            income_qs = income_qs.filter(date__range=[start_date_obj, end_date_obj])
        except ValueError:
            pass

    report_data = []
    for exp in expenses_qs:
        report_data.append({
            'date': exp.date.strftime('%Y-%m-%d'),
            'category': exp.category,
            'amount': float(exp.total_amount),
            'type': 'expense'
        })

    for inc in income_qs:
        report_data.append({
            'date': inc.date.strftime('%Y-%m-%d'),
            'category': 'General Income',
            'amount': float(inc.amount),
            'type': 'income'
        })

    return JsonResponse({'success': True, 'data': report_data})