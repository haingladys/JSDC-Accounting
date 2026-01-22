# payroll_views.py - Updated to send worked_days to frontend for table display
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.shortcuts import get_object_or_404, render
from django.db.models import Sum
import json
from datetime import datetime
from decimal import Decimal

# Import models
from ..models import Payroll

def get_selected_period(request):
    """Get selected period from request query parameters."""
    period_str = request.GET.get('period', '')
    
    if period_str:
        try:
            year_str, month_str = period_str.split('-')
            year = int(year_str)
            month = int(month_str)
            
            if month < 1 or month > 12:
                raise ValueError("Invalid month")
                
            selected_date = datetime(year, month, 1)
            return selected_date, year, month, period_str
        except (ValueError, AttributeError):
            pass
    
    current_date = datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    period_str = f"{current_year}-{current_month:02d}"
    
    return current_date, current_year, current_month, period_str

def get_period_options(selected_year, selected_month):
    """Generate a list of month-year options for the dropdown."""
    current_date = datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    
    options = []
    
    for offset in range(-12, 4):
        total_months_from_current = current_month + offset
        year = current_year + (total_months_from_current - 1) // 12
        month = ((total_months_from_current - 1) % 12) + 1
        
        if month < 1 or month > 12:
            continue
            
        try:
            period_value = f"{year}-{month:02d}"
            display_text = f"{datetime(year, month, 1).strftime('%B')} {year}"
            is_selected = (year == selected_year and month == selected_month)
            
            options.append({
                'value': period_value,
                'text': display_text,
                'selected': is_selected
            })
        except ValueError:
            continue
    
    def sort_key(x):
        y, m = map(int, x['value'].split('-'))
        return (-y, -m)
    
    options.sort(key=sort_key)
    
    return options

def payroll_list(request):
    """Main payroll page view - Now serves as API endpoint for JavaScript"""
    selected_date, selected_year, selected_month, period_str = get_selected_period(request)
    
    # Filter only active records (Payroll.objects uses SoftDeleteManager)
    payrolls = Payroll.objects.filter(
        month=selected_month,
        year=selected_year
    ).order_by('employee_name')
    
    # Calculate totals for initial display
    total_basic_pay = payrolls.aggregate(total=Sum('basic_pay'))['total'] or Decimal('0')
    total_spr = payrolls.aggregate(total=Sum('spr_amount'))['total'] or Decimal('0')
    total_cash = payrolls.aggregate(total=Sum('cash_amount'))['total'] or Decimal('0')
    total_bank = payrolls.aggregate(total=Sum('bank_transfer_amount'))['total'] or Decimal('0')
    total_net_payable = payrolls.aggregate(total=Sum('net_salary'))['total'] or Decimal('0')
    
    # Get period options for dropdown
    period_options = get_period_options(selected_year, selected_month)
    
    context = {
        # Initial values for summary cards
        'total_salary': total_basic_pay,
        'total_spr': total_spr,
        'total_cash': total_cash,
        'total_bank': total_bank,
        'total_net_payable': total_net_payable,
        'selected_period': period_str,
        'selected_period_display': selected_date.strftime('%B %Y'),
        'period_options': period_options,
        'payment_split_choices': Payroll.PAYMENT_SPLIT_CHOICES,
        'currency_symbol': '₹',
    }
    
    return render(request, 'fine/payroll.html', context)

@csrf_exempt
@require_POST
def save_payroll(request):
    """Save payroll data with payment split"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        month = data.get('month')
        year = data.get('year')
        
        if not all([employee_name, month, year]):
            return JsonResponse({
                'success': False,
                'message': 'Employee name, month, and year are required'
            }, status=400)
        
        # Check if active payroll entry exists
        payroll = Payroll.objects.filter(
            employee_name=employee_name,
            month=month,
            year=year
        ).first()
        
        # If not found in active records, check if there's a soft deleted one to restore
        if not payroll:
            deleted_payroll = Payroll.all_objects.filter(
                employee_name=employee_name,
                month=month,
                year=year,
                record_state='deleted'
            ).first()
            
            if deleted_payroll:
                # Restore the soft deleted record
                deleted_payroll.restore()
                payroll = deleted_payroll
                created = False
            else:
                # Create new entry
                payroll = None
                created = True
        else:
            created = False
        
        if payroll:
            # Update existing entry
            payroll.basic_pay = Decimal(str(data.get('basic_pay', 0)))
            payroll.spr_amount = Decimal(str(data.get('spr_amount', 0)))
            payroll.salary_date = data.get('salary_date')
            payroll.payment_split_type = data.get('payment_split_type', 'full_cash')
            payroll.cash_percentage = Decimal(str(data.get('cash_percentage', 100)))
            payroll.bank_transfer_percentage = Decimal(str(data.get('bank_transfer_percentage', 0)))
            
            # Save will automatically calculate worked days and validate incentives
            payroll.save()
            
            # Update expenses if they exist
            if payroll.expenses_created:
                payroll.create_expenses()
        else:
            # Create new entry
            payroll = Payroll(
                employee_name=employee_name,
                month=month,
                year=year,
                basic_pay=Decimal(str(data.get('basic_pay', 0))),
                spr_amount=Decimal(str(data.get('spr_amount', 0))),
                salary_date=data.get('salary_date'),
                payment_split_type=data.get('payment_split_type', 'full_cash'),
                cash_percentage=Decimal(str(data.get('cash_percentage', 100))),
                bank_transfer_percentage=Decimal(str(data.get('bank_transfer_percentage', 0))),
                is_paid=True
            )
            
            # Save will automatically calculate worked days and validate incentives
            payroll.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Payroll saved successfully',
            'id': payroll.id,
            'created': created,
            'cash_amount': float(payroll.cash_amount),
            'bank_transfer_amount': float(payroll.bank_transfer_amount),
            'net_salary': float(payroll.net_salary),
            'worked_days': float(payroll.worked_days)  # Send worked_days in response
        })
    except ValueError as e:
        # This catches the validation error for incentives
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
    except Exception as e:
        import traceback
        print("Error in save_payroll:", str(e))
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@require_GET
def get_payroll_data(request):
    """Get payroll data with payment split details and attendance calculation"""
    month = request.GET.get('month', datetime.now().month)
    year = request.GET.get('year', datetime.now().year)
    
    # Convert to integers
    month = int(month)
    year = int(year)
    
    print(f"Fetching payroll data for month={month}, year={year}")
    
    # Payroll.objects uses SoftDeleteManager, so only active records
    payrolls = Payroll.objects.filter(month=month, year=year).order_by('employee_name')
    
    print(f"Found {payrolls.count()} payroll records")
    
    data = []
    total_basic_pay = Decimal('0')
    total_spr = Decimal('0')
    total_cash = Decimal('0')
    total_bank = Decimal('0')
    total_net_payable = Decimal('0')
    
    for payroll in payrolls:
        # Calculate worked days from Attendance module
        worked_days = Decimal('0')
        
        try:
            # Import Attendance model inside the function to avoid circular imports
            from ..models import Attendance
            
            # Get attendance records for this employee in the selected month/year
            # Use all_objects to include all attendance records
            attendance_records = Attendance.all_objects.filter(
                employee_name__iexact=payroll.employee_name.strip(),  # Case-insensitive matching
                date__month=month,
                date__year=year,
                record_state='active'  # Only active records
            )
            
            print(f"Employee: {payroll.employee_name}, Attendance records: {attendance_records.count()}")
            
            # Calculate worked days based on status
            for attendance in attendance_records:
                if attendance.status == 'present':
                    worked_days += Decimal('1')
                    print(f"  - {attendance.date}: Present (+1)")
                elif attendance.status == 'half_day':
                    worked_days += Decimal('0.5')
                    print(f"  - {attendance.date}: Half Day (+0.5)")
                elif attendance.status == 'absent':
                    print(f"  - {attendance.date}: Absent (+0)")
                else:
                    print(f"  - {attendance.date}: Unknown status '{attendance.status}'")
            
            print(f"Total worked days: {worked_days}")
            
        except Exception as e:
            print(f"Error calculating worked days for {payroll.employee_name}: {e}")
            import traceback
            traceback.print_exc()
            worked_days = Decimal('0')
        
        # Ensure calculations are up to date
        payroll.calculate_salary()
        
        data.append({
            'id': payroll.id,
            'employee_name': payroll.employee_name,
            'basic_pay': float(payroll.basic_pay),
            'spr_amount': float(payroll.spr_amount),
            'net_salary': float(payroll.net_salary),
            'payment_split_type': payroll.payment_split_type,
            'cash_percentage': float(payroll.cash_percentage),
            'bank_transfer_percentage': float(payroll.bank_transfer_percentage),
            'cash_amount': float(payroll.cash_amount),
            'bank_transfer_amount': float(payroll.bank_transfer_amount),
            'salary_date': payroll.salary_date.strftime('%Y-%m-%d') if payroll.salary_date else None,
            'is_paid': payroll.is_paid,
            'expenses_created': payroll.expenses_created,
            'worked_days': float(worked_days),  # Add worked days to response
        })
        
        total_basic_pay += payroll.basic_pay
        total_spr += payroll.spr_amount
        total_cash += payroll.cash_amount
        total_bank += payroll.bank_transfer_amount
        total_net_payable += payroll.net_salary
    
    return JsonResponse({
        'success': True,
        'data': data,
        'summary': {
            'total_basic_pay': float(total_basic_pay),
            'total_spr': float(total_spr),
            'total_cash': float(total_cash),
            'total_bank': float(total_bank),
            'total_net_payable': float(total_net_payable)
        }
    })

@csrf_exempt
@require_POST
def delete_payroll(request):
    """Soft delete payroll and related expenses"""
    try:
        data = json.loads(request.body)
        record_id = data.get('id')
        
        # Use all_objects to get even soft deleted records
        payroll = get_object_or_404(Payroll.all_objects, id=record_id)
        
        # Check if already deleted
        if payroll.record_state == 'deleted':
            return JsonResponse({
                'success': False,
                'message': 'Payroll record is already deleted'
            }, status=400)
        
        # Soft delete instead of hard delete
        payroll.soft_delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Payroll record soft deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_POST
def restore_payroll(request):
    """Restore a soft deleted payroll record"""
    try:
        data = json.loads(request.body)
        record_id = data.get('id')
        
        # Use all_objects to get the soft deleted record
        payroll = get_object_or_404(Payroll.all_objects, id=record_id)
        
        # Check if it's actually deleted
        if payroll.record_state != 'deleted':
            return JsonResponse({
                'success': False,
                'message': 'Payroll record is not deleted'
            }, status=400)
        
        # Restore the record
        payroll.restore()
        
        return JsonResponse({
            'success': True,
            'message': 'Payroll record restored successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_POST
def recreate_expenses(request):
    """Manually recreate expenses for payroll"""
    try:
        data = json.loads(request.body)
        payroll_id = data.get('payroll_id')
        
        # Use all_objects to get even soft deleted records
        payroll = get_object_or_404(Payroll.all_objects, id=payroll_id)
        
        # Check if payroll is active
        if payroll.record_state != 'active':
            return JsonResponse({
                'success': False,
                'message': 'Cannot recreate expenses for deleted payroll record'
            }, status=400)
        
        payroll.create_expenses()
        
        return JsonResponse({
            'success': True,
            'message': 'Expenses recreated successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)