# views/attendance_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.shortcuts import get_object_or_404
from django.utils import timezone
import json
from datetime import date, timedelta
from decimal import Decimal
# Add this import at the top
from django.db.models import Q

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
        notes = data.get('notes', '')  # NEW: Get notes
        
        # Check if active attendance entry already exists for this employee and date
        attendance = Attendance.all_objects.filter(
            employee_name=employee_name,
            date=attendance_date,
            record_state='active'
        ).first()
        
        if attendance:
            # Update existing entry
            attendance.status = data.get('status', 'present')
            attendance.notes = notes  # NEW: Update notes
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
                deleted_attendance.notes = notes  # NEW: Update notes
                deleted_attendance.save()
                attendance = deleted_attendance
                created = False
            else:
                # Create new entry
                attendance = Attendance.objects.create(
                    employee_name=employee_name,
                    date=attendance_date,
                    status=data.get('status', 'present'),
                    notes=notes,  # NEW: Add notes
                    record_state='active'
                )
                created = True
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance saved successfully',
            'id': attendance.id,
            'created': created,
            'notes': attendance.notes or ''  # NEW: Return notes in response
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
            'notes': attendance.notes or '',  # NEW: Include notes
            'record_state': attendance.record_state
        })
    
    return JsonResponse({
        'success': True,
        'data': data
    })


@csrf_exempt
@require_http_methods(["POST", "PUT"])
def edit_attendance(request):
    """Edit an existing attendance record"""
    try:
        data = json.loads(request.body)
        attendance_id = data.get('id')
        employee_name = data.get('employee_name')
        attendance_date_str = data.get('date')
        status = data.get('status', 'present')
        notes = data.get('notes', '')
        
        attendance = None
        
        # Try to find by ID first (using all_objects to include soft deleted)
        if attendance_id:
            try:
                attendance = Attendance.all_objects.get(id=attendance_id)
            except Attendance.DoesNotExist:
                attendance = None
        
        # If not found by ID, try to find by employee name and date
        if not attendance and employee_name and attendance_date_str:
            try:
                attendance = Attendance.all_objects.get(
                    employee_name=employee_name,
                    date=attendance_date_str,
                    record_state='active'
                )
            except Attendance.DoesNotExist:
                attendance = None
        
        # If still not found, create a new one instead of returning 404
        if not attendance:
            # Check if there's a soft deleted record to restore
            deleted_attendance = Attendance.all_objects.filter(
                employee_name=employee_name,
                date=attendance_date_str,
                record_state='deleted'
            ).first()
            
            if deleted_attendance:
                # Restore the soft deleted record
                deleted_attendance.record_state = 'active'
                deleted_attendance.deleted_at = None
                deleted_attendance.status = status
                deleted_attendance.notes = notes
                deleted_attendance.save()
                attendance = deleted_attendance
            else:
                # Create new entry - date should already be in YYYY-MM-DD format
                attendance = Attendance.objects.create(
                    employee_name=employee_name,
                    date=attendance_date_str,
                    status=status,
                    notes=notes,
                    record_state='active'
                )
        else:
            # Update existing record
            # If date changed, check if there's already an entry for the new date
            if attendance_date_str and attendance_date_str != str(attendance.date):
                new_date = attendance_date_str
                
                # Check if there's already an active record for the new date
                existing_for_new_date = Attendance.all_objects.filter(
                    employee_name=employee_name,
                    date=new_date,
                    record_state='active'
                ).exclude(id=attendance.id).first()
                
                if existing_for_new_date:
                    # Merge: Update existing record and soft delete old one
                    existing_for_new_date.status = status
                    existing_for_new_date.notes = notes if notes else existing_for_new_date.notes
                    existing_for_new_date.save()
                    attendance.soft_delete()  # Soft delete the old record
                    attendance = existing_for_new_date
                else:
                    # Just update the date
                    attendance.date = new_date
                    attendance.status = status
                    attendance.notes = notes
                    attendance.save()
            else:
                # Just update status and notes
                attendance.status = status
                attendance.notes = notes
                attendance.save()
        
        # Format date for response - handle both string and datetime objects
        if isinstance(attendance.date, str):
            formatted_date = attendance.date
        else:
            formatted_date = attendance.date.strftime('%Y-%m-%d')
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance updated successfully',
            'id': attendance.id,
            'employee_name': attendance.employee_name,
            'date': formatted_date,
            'status': attendance.status,
            'notes': attendance.notes or '',
            'status_display': attendance.get_status_display()
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
    

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
        attendance_data[key] = {
            'status': att.status,
            'notes': att.notes or ''  # NEW: Include notes
        }
    
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


# ... rest of your existing view functions (add_employee, delete_attendance, delete_employee_attendance) ...

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
    
@csrf_exempt
@require_POST
def delete_employee_attendance(request):
    """Delete all attendance records for an employee"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name', '').strip()
        
        if not employee_name:
            return JsonResponse({
                'success': False,
                'message': 'Employee name is required'
            }, status=400)
        
        # Soft delete all attendance records for this employee
        deleted_count = Attendance.all_objects.filter(
            employee_name=employee_name
        ).update(
            record_state='deleted',
            deleted_at=timezone.now()
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Deleted {deleted_count} attendance records for {employee_name}',
            'deleted_count': deleted_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

    
