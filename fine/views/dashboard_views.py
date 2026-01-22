# dashboard_views.py
from django.shortcuts import render
from django.db.models import Sum, Count
from ..models import Expense, Purchase, Income
from ..utils.period_utils import get_selected_period, get_period_options
from django.http import JsonResponse
from datetime import datetime, timedelta
import json
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.db.models.functions import TruncDate
from dateutil.relativedelta import relativedelta


def dashboard(request):
    # Get selected period from request
    selected_date, selected_year, selected_month, period_str = get_selected_period(request)
    
    # Calculate Total Income for selected period
    total_income = Income.objects.filter(
        date__year=selected_year,
        date__month=selected_month
    ).aggregate(total_income=Sum('amount'))['total_income'] or 0
    
    # Calculate Total Expenses for selected period
    total_expenses = Expense.objects.filter(
        date__year=selected_year,
        date__month=selected_month
    ).aggregate(total_expenses=Sum('total_amount'))['total_expenses'] or 0
    
    # Calculate Total Purchases for selected period
    total_purchases = Purchase.objects.filter(
        date__year=selected_year,
        date__month=selected_month
    ).aggregate(total_purchases=Sum('total_amount'))['total_purchases'] or 0
    
    # Calculate Net Balance (Income - (Expenses + Purchases))
    net_balance = total_income - (total_expenses + total_purchases)

    # Fetch 5 Most Recent Expenses for the selected period
    recent_expenses = Expense.objects.filter(
        date__year=selected_year,
        date__month=selected_month
    ).order_by('-date')[:5]

    # Get period options for dropdown
    period_options = get_period_options(selected_year, selected_month)
    
    # Get month overview data for pie chart
    month_overview = {
        'income': float(total_income),
        'expense': float(total_expenses),
        'purchase': float(total_purchases)
    }

    context = {
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_purchases': total_purchases,
        'net_balance': net_balance,
        'recent_expenses': recent_expenses,
        # Period data
        'selected_period': period_str,
        'selected_period_display': selected_date.strftime('%B %Y'),
        'period_options': period_options,
        # Add current period for JavaScript
        'current_period': period_str,
    }
    return render(request, 'fine/dashboard.html', context)


def get_chart_data(request):
    """
    API endpoint to fetch chart data. 
    Handles both fixed periods (weekly/monthly/yearly) AND custom date ranges.
    """
    period = request.GET.get('period', 'monthly')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    selected_period = request.GET.get('selected_period')

    response_data = {
        'success': True,
        'line_chart': {},
        'month_overview': {}
    }

    # CASE 1: Custom Date Range (Syncs both charts)
    if start_date_str and end_date_str:
        try:
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            # 1. Sync Line Chart (Daily breakdown for the range)
            response_data['line_chart'] = get_custom_range_line_data(start_date, end_date)
            
            # 2. Sync Pie/Overview Chart (Category breakdown for the range)
            response_data['month_overview'] = get_custom_range_overview(start_date, end_date)
            
            return JsonResponse(response_data)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    # CASE 2: Standard Period Handling (Existing Logic)
    if selected_period:
        try:
            year, month = map(int, selected_period.split('-'))
            base_date = datetime(year, month, 1)
        except:
            base_date = datetime.now()
    else:
        base_date = datetime.now()

    
    if period == 'weekly':
        response_data['line_chart'] = get_weekly_data(base_date)
        response_data['month_overview'] = get_weekly_overview_data(base_date)
    elif period == 'monthly':
        response_data['line_chart'] = get_monthly_data(base_date)
        response_data['month_overview'] = get_month_overview_data(base_date.year, base_date.month)
    elif period == 'yearly':
        response_data['line_chart'] = get_yearly_data()
        response_data['month_overview'] = get_yearly_overview_data()

    return JsonResponse(response_data)

def get_custom_range_line_data(start_date, end_date):
    """Aggregates totals day-by-day for the line chart."""
    # Fetch data within range
    income_qs = (
        Income.objects
        .filter(date__range=[start_date, end_date])
        .annotate(day=TruncDate('date'))
        .values('day')
        .annotate(total=Sum('amount'))
        .order_by('day')
    )

    expense_qs = (
        Expense.objects
        .filter(date__range=[start_date, end_date])
        .annotate(day=TruncDate('date'))
        .values('day')
        .annotate(total=Sum('total_amount'))
        .order_by('day')
    )

    purchase_qs = (
        Purchase.objects
        .filter(date__range=[start_date, end_date])
        .annotate(day=TruncDate('date'))
        .values('day')
        .annotate(total=Sum('total_amount'))
        .order_by('day')
    )

    # Create a unified list of labels (dates)
    dates = sorted(list(set(
        [i['day'] for i in income_qs] + 
        [e['day'] for e in expense_qs] + 
        [p['day'] for p in purchase_qs]
    )))

    labels = [d.strftime('%d %b') for d in dates]
    
    # Map data to the unified labels
    income_map = {i['day']: float(i['total']) for i in income_qs}
    expense_map = {e['day']: float(e['total']) for e in expense_qs}
    purchase_map = {p['day']: float(p['total']) for p in purchase_qs}

    # If no data is found, return empty lists
    if not dates:
        return {
            'labels': [],
            'income': [],
            'expenses': [],
            'purchases': [],
            'is_empty': True
        }

    return {
        'labels': labels,
        'income': [income_map.get(d, 0) for d in dates],
        'expenses': [expense_map.get(d, 0) for d in dates],
        'purchases': [purchase_map.get(d, 0) for d in dates]
    }

def get_custom_range_overview(start_date, end_date):
    """Aggregates totals by category for the pie charts within a range."""
    income_total = Income.objects.filter(date__range=[start_date, end_date]).aggregate(total=Sum('amount'))['total'] or 0
    expense_total = Expense.objects.filter(date__range=[start_date, end_date]).aggregate(total=Sum('total_amount'))['total'] or 0
    purchase_total = Purchase.objects.filter(date__range=[start_date, end_date]).aggregate(total=Sum('total_amount'))['total'] or 0

    return {
        'income': {'total': float(income_total), 'labels': ['Income'], 'data': [float(income_total)]},
        'expense': {'total': float(expense_total), 'labels': ['Expenses'], 'data': [float(expense_total)]},
        'purchase': {'total': float(purchase_total), 'labels': ['Purchases'], 'data': [float(purchase_total)]}
    }


def get_weekly_data(base_date):
    """Get weekly data within the selected month only"""
    labels = []
    income_data = []
    expense_data = []
    purchase_data = []
    
    # Get first and last day of the selected month
    first_day = base_date.replace(day=1)
    if base_date.month == 12:
        last_day = base_date.replace(year=base_date.year+1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = base_date.replace(month=base_date.month+1, day=1) - timedelta(days=1)
    
    # Calculate total days in month
    total_days = (last_day - first_day).days + 1
    
    # If month has less than 28 days, show all data as one "week"
    if total_days < 28:
        num_weeks = 1
    else:
        # Divide month into ~4 weeks
        num_weeks = 4
    
    days_per_week = total_days / num_weeks
    
    for i in range(num_weeks):
        week_start = first_day + timedelta(days=int(days_per_week * i))
        if i == num_weeks - 1:
            week_end = last_day  # Last week goes to end of month
        else:
            week_end = first_day + timedelta(days=int(days_per_week * (i + 1)) - 1)
        
        # Format label
        labels.append(f"{week_start.strftime('%b %d')} - {week_end.strftime('%d')}")
        
        # Get income for the week
        income = Income.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        income_data.append(float(income))
        
        # Get expenses for the week
        expense = Expense.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        expense_data.append(float(expense))
        
        # Get purchases for the week
        purchase = Purchase.objects.filter(
            date__gte=week_start,
            date__lte=week_end
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        purchase_data.append(float(purchase))
    
    return {
        'labels': labels,
        'income': income_data,
        'expenses': expense_data,
        'purchases': purchase_data
    }

def get_monthly_data(base_date):
    """Get monthly data for the last 6 months - FIXED"""
    labels = []
    income_data = []
    expense_data = []
    purchase_data = []
    
    for i in range(5, -1, -1):
        # FIXED: Calculate month correctly - subtract i months from base_date
        month_date = base_date.replace(day=1) - relativedelta(months=i)
        
        # Format label
        labels.append(month_date.strftime('%b'))
        
        # Get data for the month
        income = Income.objects.filter(
            date__year=month_date.year,
            date__month=month_date.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        income_data.append(float(income))
        
        expense = Expense.objects.filter(
            date__year=month_date.year,
            date__month=month_date.month
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        expense_data.append(float(expense))
        
        purchase = Purchase.objects.filter(
            date__year=month_date.year,
            date__month=month_date.month
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        purchase_data.append(float(purchase))
    
    return {
        'labels': labels,
        'income': income_data,
        'expenses': expense_data,
        'purchases': purchase_data
    }


def get_yearly_data():
    """Get yearly data for the last 5 years"""
    labels = []
    income_data = []
    expense_data = []
    purchase_data = []
    
    current_year = datetime.now().year
    
    for year in range(current_year-4, current_year+1):
        labels.append(str(year))
        
        income = Income.objects.filter(
            date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0
        income_data.append(float(income))
        
        expense = Expense.objects.filter(
            date__year=year
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        expense_data.append(float(expense))
        
        purchase = Purchase.objects.filter(
            date__year=year
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        purchase_data.append(float(purchase))
    
    return {
        'labels': labels,
        'income': income_data,
        'expenses': expense_data,
        'purchases': purchase_data
    }


def get_month_overview_data(year, month):
    """Get month overview data for pie chart"""
    try:
        # Get totals for the month
        income_total = float(Income.objects.filter(
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0)
        
        expense_total = float(Expense.objects.filter(
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        purchase_total = float(Purchase.objects.filter(
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        return {
            'income': {
                'labels': ['Income'],
                'data': [income_total],
                'total': income_total
            },
            'expense': {
                'labels': ['Expenses'],
                'data': [expense_total],
                'total': expense_total
            },
            'purchase': {
                'labels': ['Purchases'],
                'data': [purchase_total],
                'total': purchase_total
            }
        }
    except Exception as e:
        print(f"Error in get_month_overview_data: {e}")
        return {
            'income': {'labels': [], 'data': [], 'total': 0},
            'expense': {'labels': [], 'data': [], 'total': 0},
            'purchase': {'labels': [], 'data': [], 'total': 0}
        }
    
    
def get_weekly_overview_data(base_date):
    """Get overview data for the current week within selected month"""
    # Get first and last day of the selected month
    first_day = base_date.replace(day=1)
    if base_date.month == 12:
        last_day = base_date.replace(year=base_date.year+1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = base_date.replace(month=base_date.month+1, day=1) - timedelta(days=1)
    
    try:
        # Aggregate totals for the entire month (weekly view shows weekly breakdown but pie shows month total)
        income_total = float(Income.objects.filter(
            date__gte=first_day,
            date__lte=last_day
        ).aggregate(total=Sum('amount'))['total'] or 0)
        
        expense_total = float(Expense.objects.filter(
            date__gte=first_day,
            date__lte=last_day
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        purchase_total = float(Purchase.objects.filter(
            date__gte=first_day,
            date__lte=last_day
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        return {
            'income': {
                'labels': ['Income'],
                'data': [income_total],
                'total': income_total
            },
            'expense': {
                'labels': ['Expenses'],
                'data': [expense_total],
                'total': expense_total
            },
            'purchase': {
                'labels': ['Purchases'],
                'data': [purchase_total],
                'total': purchase_total
            }
        }
    except Exception as e:
        print(f"Error in get_weekly_overview_data: {e}")
        return {
            'income': {'labels': [], 'data': [], 'total': 0},
            'expense': {'labels': [], 'data': [], 'total': 0},
            'purchase': {'labels': [], 'data': [], 'total': 0}
        }

def get_yearly_overview_data():
    """Get overview data for the last 5 years (matching yearly line chart scope)"""
    current_year = datetime.now().year
    start_year = current_year - 4
    
    try:
        # Aggregate totals for the last 5 years
        income_total = float(Income.objects.filter(
            date__year__gte=start_year,
            date__year__lte=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0)
        
        expense_total = float(Expense.objects.filter(
            date__year__gte=start_year,
            date__year__lte=current_year
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        purchase_total = float(Purchase.objects.filter(
            date__year__gte=start_year,
            date__year__lte=current_year
        ).aggregate(total=Sum('total_amount'))['total'] or 0)
        
        return {
            'income': {
                'labels': ['Income'],
                'data': [income_total],
                'total': income_total
            },
            'expense': {
                'labels': ['Expenses'],
                'data': [expense_total],
                'total': expense_total
            },
            'purchase': {
                'labels': ['Purchases'],
                'data': [purchase_total],
                'total': purchase_total
            }
        }
    except Exception as e:
        print(f"Error in get_yearly_overview_data: {e}")
        return {
            'income': {'labels': [], 'data': [], 'total': 0},
            'expense': {'labels': [], 'data': [], 'total': 0},
            'purchase': {'labels': [], 'data': [], 'total': 0}
        }