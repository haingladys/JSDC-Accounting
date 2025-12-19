# views/payroll_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.shortcuts import get_object_or_404
import json
from datetime import datetime
from decimal import Decimal

# Import from base or models
from .base import logger
from ..models import Payroll


@csrf_exempt
@require_POST
def toggle_payroll_status(request):
    """Toggle payroll status between paid and unpaid"""
    try:
        data = json.loads(request.body)
        payroll_id = data.get('id')
        
        if not payroll_id:
            return JsonResponse({
                'success': False,
                'message': 'Payroll ID is required'
            }, status=400)
        
        # Get the payroll record
        payroll = get_object_or_404(Payroll, id=payroll_id)
        
        # Toggle the status
        if payroll.status == 'unpaid':
            payroll.status = 'paid'
            new_status = 'paid'
            new_status_display = 'Paid'
        else:
            payroll.status = 'unpaid'
            new_status = 'unpaid'
            new_status_display = 'Unpaid'
        
        # Save only the status field
        payroll.save(update_fields=['status'])
        
        return JsonResponse({
            'success': True,
            'message': f'Status updated to {new_status_display}',
            'new_status': new_status,
            'new_status_display': new_status_display,
            'payroll_id': payroll_id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@csrf_exempt
@require_POST
def save_payroll(request):
    """Save payroll data via AJAX"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        month = data.get('month')
        year = data.get('year')
        
        # Check if active payroll entry already exists for this employee, month, year
        payroll = Payroll.all_objects.filter(
            employee_name=employee_name,
            month=month,
            year=year,
            record_state='active'
        ).first()
        
        if payroll:
            # Update existing entry
            payroll.basic_pay = data.get('basic_pay', 0)
            payroll.advances = data.get('advances', 0)
            payroll.spr_amount = data.get('spr_amount', 0)
            payroll.salary_date = data.get('salary_date')
            payroll.status = data.get('status', 'unpaid')
            payroll.save()
            created = False
        else:
            # Check if there's a soft deleted record to restore
            deleted_payroll = Payroll.all_objects.filter(
                employee_name=employee_name,
                month=month,
                year=year,
                record_state='deleted'
            ).first()
            
            if deleted_payroll:
                # Restore the soft deleted record
                deleted_payroll.record_state = 'active'
                deleted_payroll.deleted_at = None
                deleted_payroll.basic_pay = data.get('basic_pay', 0)
                deleted_payroll.advances = data.get('advances', 0)
                deleted_payroll.spr_amount = data.get('spr_amount', 0)
                deleted_payroll.salary_date = data.get('salary_date')
                deleted_payroll.status = data.get('status', 'unpaid')
                deleted_payroll.save()
                payroll = deleted_payroll
                created = False
            else:
                # Create new entry
                payroll = Payroll.objects.create(
                    employee_name=employee_name,
                    month=month,
                    year=year,
                    basic_pay=data.get('basic_pay', 0),
                    advances=data.get('advances', 0),
                    spr_amount=data.get('spr_amount', 0),
                    salary_date=data.get('salary_date'),
                    status=data.get('status', 'unpaid'),
                    record_state='active'
                )
                created = True
        
        return JsonResponse({
            'success': True,
            'message': 'Payroll saved successfully',
            'id': payroll.id,
            'created': created
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@require_GET
def get_payroll_data(request):
    """Get payroll data for a specific month and year"""
    month = request.GET.get('month', datetime.now().month)
    year = request.GET.get('year', datetime.now().year)
    
    # Only get active records (soft delete filter applied by custom manager)
    payrolls = Payroll.objects.filter(month=month, year=year).order_by('employee_name')
    
    data = []
    total_salary = Decimal('0')
    total_advances = Decimal('0')
    total_spr = Decimal('0')
    
    for payroll in payrolls:
        data.append({
            'id': payroll.id,
            'employee_name': payroll.employee_name,
            'basic_pay': float(payroll.basic_pay),
            'advances': float(payroll.advances),
            'spr_amount': float(payroll.spr_amount),
            'net_salary': float(payroll.net_salary),
            'salary_date': payroll.salary_date.strftime('%Y-%m-%d') if payroll.salary_date else None,
            'status': payroll.status,
            'status_display': payroll.get_status_display(),
            'record_state': payroll.record_state
        })
        
        total_salary += payroll.net_salary
        total_advances += payroll.advances
        total_spr += payroll.spr_amount
    
    return JsonResponse({
        'success': True,
        'data': data,
        'summary': {
            'total_salary': float(total_salary),
            'total_advances': float(total_advances),
            'total_spr': float(total_spr),
            'net_payable': float(total_salary)
        }
    })


@csrf_exempt
@require_POST
def delete_payroll(request):
    """Soft delete a payroll record"""
    try:
        data = json.loads(request.body)
        record_id = data.get('id')
        
        # Use all_objects to get even soft deleted records
        payroll = get_object_or_404(Payroll.all_objects, id=record_id)
        
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