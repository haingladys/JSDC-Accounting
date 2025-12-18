# views/attendance_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.shortcuts import get_object_or_404
import json
from datetime import date, timedelta
from decimal import Decimal

# Import from base or models
from .base import logger
from ..models import Attendance


@csrf_exempt
@require_POST
def save_attendance(request):
    """Save attendance data via AJAX"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        attendance_date = data.get('date')
        
        # Check if active attendance entry already exists for this employee and date
        attendance = Attendance.all_objects.filter(
            employee_name=employee_name,
            date=attendance_date,
            record_state='active'
        ).first()
        
        if attendance:
            # Update existing entry
            attendance.status = data.get('status', 'present')
            attendance.save()
            created = False
        else:
            # Check if there's a soft deleted record to restore
            deleted_attendance = Attendance.all_objects.filter(
                employee_name=employee_name,
                date=attendance_date,
                record_state='deleted'
            ).first()
            
            if deleted_attendance:
                # Restore the soft deleted record
                deleted_attendance.record_state = 'active'
                deleted_attendance.deleted_at = None
                deleted_attendance.status = data.get('status', 'present')
                deleted_attendance.save()
                attendance = deleted_attendance
                created = False
            else:
                # Create new entry
                attendance = Attendance.objects.create(
                    employee_name=employee_name,
                    date=attendance_date,
                    status=data.get('status', 'present'),
                    record_state='active'
                )
                created = True
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance saved successfully',
            'id': attendance.id,
            'created': created
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@require_GET
def get_attendance_data(request):
    """Get attendance data for a date range"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    employee_name = request.GET.get('employee_name', '')
    
    query = Q()
    
    if start_date and end_date:
        query &= Q(date__range=[start_date, end_date])
    
    if employee_name:
        query &= Q(employee_name__icontains=employee_name)
    
    # Only get active records (soft delete filter applied by custom manager)
    attendances = Attendance.objects.filter(query).order_by('-date', 'employee_name')
    
    data = []
    for attendance in attendances:
        data.append({
            'id': attendance.id,
            'employee_name': attendance.employee_name,
            'date': attendance.date.strftime('%Y-%m-%d'),
            'status': attendance.status,
            'status_display': attendance.get_status_display(),
            'record_state': attendance.record_state
        })
    
    return JsonResponse({
        'success': True,
        'data': data
    })


@require_GET
def get_weekly_attendance(request):
    """Get attendance data for current week"""
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    end_of_week = start_of_week + timedelta(days=6)  # Sunday
    
    # Get all unique employees from ACTIVE attendance records only
    employees = Attendance.objects.filter(
        date__range=[start_of_week - timedelta(days=30), end_of_week]
    ).values_list('employee_name', flat=True).distinct().order_by('employee_name')
    
    # Convert to sorted list
    employees_list = sorted(list(set(employees)))
    
    # Get attendance for the week (only active records)
    attendance_data = {}
    week_attendance = Attendance.objects.filter(date__range=[start_of_week, end_of_week])
    
    for att in week_attendance:
        key = f"{att.employee_name}_{att.date}"
        attendance_data[key] = att.status
    
    # Generate week days
    week_days = []
    for i in range(7):
        day_date = start_of_week + timedelta(days=i)
        week_days.append({
            'date': day_date.strftime('%Y-%m-%d'),
            'day_name': day_date.strftime('%a'),
            'day_number': day_date.day
        })
    
    # Get today's counts (only active records)
    today_attendance = Attendance.objects.filter(date=today)
    present_today = today_attendance.filter(status='present').count()
    halfday_today = today_attendance.filter(status='half_day').count()
    absent_today = today_attendance.filter(status='absent').count()
    
    return JsonResponse({
        'success': True,
        'employees': employees_list,  # Already sorted
        'week_days': week_days,
        'attendance_data': attendance_data,
        'summary': {
            'total_employees': len(employees_list),
            'present_today': present_today,
            'halfday_today': halfday_today,
            'absent_today': absent_today
        }
    })


@csrf_exempt
@require_POST
def add_employee(request):
    """Add a new employee name (simple version)"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name', '').strip()
        
        if not employee_name:
            return JsonResponse({
                'success': False,
                'message': 'Employee name is required'
            }, status=400)
        
        # Check if active employee already exists in attendance records
        exists_in_attendance = Attendance.objects.filter(employee_name=employee_name).exists()
        
        # If not exists, create a sample attendance record for today
        if not exists_in_attendance:
            try:
                Attendance.objects.create(
                    employee_name=employee_name,
                    date=date.today(),
                    status='present',
                    record_state='active'
                )
            except Exception as e:
                print(f"Error creating attendance record: {e}")
        
        return JsonResponse({
            'success': True,
            'message': f'Employee "{employee_name}" added successfully',
            'exists_in_attendance': exists_in_attendance
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@csrf_exempt
@require_POST
def delete_attendance(request):
    """Soft delete an attendance record"""
    try:
        data = json.loads(request.body)
        record_id = data.get('id')
        
        # Use all_objects to get even soft deleted records
        attendance = get_object_or_404(Attendance.all_objects, id=record_id)
        
        # Soft delete instead of hard delete
        attendance.soft_delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance record soft deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)