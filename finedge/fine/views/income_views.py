from django.shortcuts import get_object_or_404, render, redirect
from django.contrib import messages
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from ..models import Income

def income(request):
    if request.method == "POST":
        data = {
            'date': request.POST.get('date'),
            'description': request.POST.get('description'),
            'amount': request.POST.get('amount'),
            'payment_mode': request.POST.get('payment_mode'),
            'status': request.POST.get('status'),
        }
        Income.objects.create(**data)
        messages.success(request, "Income added successfully!")
        return redirect('income')

    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    daily_total = Income.objects.filter(date=today).aggregate(Sum('amount'))['amount__sum'] or 0
    yesterday_total = Income.objects.filter(date=yesterday).aggregate(Sum('amount'))['amount__sum'] or 0
    weekly_total = Income.objects.filter(date__gte=start_of_week).aggregate(Sum('amount'))['amount__sum'] or 0
    monthly_total = Income.objects.filter(date__gte=start_of_month).aggregate(Sum('amount'))['amount__sum'] or 0
    total_sum = Income.objects.aggregate(Sum('amount'))['amount__sum'] or 0

    def get_trend(current, previous):
        if not previous or previous == 0:
            return 0
        return ((current - previous) / previous) * 100

    context = {
        'income_records': Income.objects.all().order_by('-date'),
        'payment_modes': [c[0] for c in Income.PAYMENT_MODE_CHOICES],
        'status_choices': [s[0] for s in Income.STATUS_CHOICES],
        'today_date': today.isoformat(),
        'daily_total': daily_total,
        'weekly_total': weekly_total,
        'monthly_total': monthly_total,
        'total_sum': total_sum,
        'daily_trend': get_trend(daily_total, yesterday_total),
        'weekly_trend': 0, 
        'monthly_trend': 0,
    }
    return render(request, 'fine/income.html', context)

def delete_income(request, pk):
    if request.method == "POST":
        income_record = get_object_or_404(Income, pk=pk)
        income_record.delete()
        messages.success(request, "Income record deleted successfully!")
    return redirect('income')

def edit_income(request, pk):
    if request.method == "POST":
        income_item = get_object_or_404(Income, pk=pk)
        income_item.date = request.POST.get('date')
        income_item.description = request.POST.get('description')
        income_item.amount = request.POST.get('amount')
        income_item.payment_mode = request.POST.get('payment_mode')
        income_item.status = request.POST.get('status')
        income_item.save()
        messages.success(request, "Income record updated successfully!")
    return redirect('income')