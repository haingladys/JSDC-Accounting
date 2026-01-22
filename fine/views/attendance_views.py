# views/attendance_views.py - COMPLETE UPDATED VERSION
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.shortcuts import get_object_or_404
from django.utils import timezone
import json
from datetime import datetime, date, timedelta
from decimal import Decimal
from django.db.models import Q

# Import from base or models
from .base import logger
from ..models import Attendance, Payroll

# views/attendance_views.py - Add new views
from ..models.attendance_summary import AttendanceSummary
from ..models.attendance_summary_manager import AttendanceSummaryManager

# attendance_views.py - Fix the save_attendance function with cascade soft delete awareness
@csrf_exempt
@require_POST
def save_attendance(request):
    """Save attendance data via AJAX - Link to Payroll"""
    try:
        data = json.loads(request.body)
        employee_name = data.get('employee_name')
        attendance_date_str = data.get('date')  # This is a string
        notes = data.get('notes', '')
        
        # Convert string to date object
        try:
            attendance_date = datetime.strptime(attendance_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': f'Invalid date format: {attendance_date_str}. Use YYYY-MM-DD'
            }, status=400)
        
        # Find active payroll record for this employee
        payroll_record = Payroll.objects.filter(
            employee_name=employee_name
        ).first()
        
        if not payroll_record:
            # Check if there's a deleted payroll record
            deleted_payroll = Payroll.all_objects.filter(
                employee_name=employee_name,
                record_state='deleted'
            ).first()
            
            if deleted_payroll:
                return JsonResponse({
                    'success': False,
                    'message': f'Payroll record for "{employee_name}" is deleted. Please restore it first.',
                    'payroll_deleted': True,
                    'payroll_id': deleted_payroll.id
                }, status=400)
            else:
                return JsonResponse({
                    'success': False,
                    'message': f'Employee "{employee_name}" not found in Payroll records'
                }, status=400)
        
        # Check if active attendance entry already exists
        attendance = Attendance.all_objects.filter(
            payroll=payroll_record,
            date=attendance_date,  # Use date object, not string
            record_state='active'
        ).first()
        
        if attendance:
            # Update existing entry
            attendance.status = data.get('status', 'present')
            attendance.notes = notes
            attendance.save()
            created = False
        else:
            # Check if there's a soft deleted record to restore
            deleted_attendance = Attendance.all_objects.filter(
                payroll=payroll_record,
                date=attendance_date,  # Use date object, not string
                record_state='deleted'
            ).first()
            
            if deleted_attendance:
                # Restore the soft deleted record
                deleted_attendance.record_state = 'active'
                deleted_attendance.deleted_at = None
                deleted_attendance.status = data.get('status', 'present')
                deleted_attendance.notes = notes
                deleted_attendance.save()
                attendance = deleted_attendance
                created = False
            else:
                # Create new entry linked to payroll
                attendance = Attendance.objects.create(
                    payroll=payroll_record,
                    employee_name=employee_name,
                    date=attendance_date,  # Use date object, not string
                    status=data.get('status', 'present'),
                    notes=notes,
                    record_state='active'
                )
                created = True
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance saved successfully',
            'id': attendance.id,
            'created': created,
            'notes': attendance.notes or ''
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
            'record_state': attendance.record_state,
            'payroll_active': attendance.payroll.record_state == 'active' if attendance.payroll else True
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
                # Check if payroll is active
                if deleted_attendance.payroll and deleted_attendance.payroll.record_state != 'active':
                    return JsonResponse({
                        'success': False,
                        'message': f'Cannot restore attendance because payroll record for "{employee_name}" is deleted.'
                    }, status=400)
                
                # Restore the soft deleted record
                deleted_attendance.record_state = 'active'
                deleted_attendance.deleted_at = None
                deleted_attendance.status = status
                deleted_attendance.notes = notes
                deleted_attendance.save()
                attendance = deleted_attendance
            else:
                # Check if payroll exists and is active
                payroll_record = Payroll.objects.filter(employee_name=employee_name).first()
                if not payroll_record:
                    return JsonResponse({
                        'success': False,
                        'message': f'Employee "{employee_name}" not found in active Payroll records'
                    }, status=400)
                
                # Create new entry - date should already be in YYYY-MM-DD format
                attendance = Attendance.objects.create(
                    employee_name=employee_name,
                    date=attendance_date_str,
                    status=status,
                    notes=notes,
                    record_state='active',
                    payroll=payroll_record
                )
        else:
            # Check if payroll is active
            if attendance.payroll and attendance.payroll.record_state != 'active':
                return JsonResponse({
                    'success': False,
                    'message': f'Cannot update attendance because payroll record for "{employee_name}" is deleted.'
                }, status=400)
            
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

# attendance_views.py - Update the get_weekly_attendance function with cascade awareness
@require_GET
def get_weekly_attendance(request):
    """Get attendance data for current week - Fetch employees from Payroll"""
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    end_of_week = start_of_week + timedelta(days=6)  # Sunday
    
    # Get all active employees from Payroll table (Payroll.objects uses SoftDeleteManager)
    payroll_records = Payroll.objects.all()
    
    # Get unique employee names from payroll
    employees_list = sorted(list(set(
        payroll_records.values_list('employee_name', flat=True).distinct()
    )))
    
    # Get ALL attendance for the week (including deleted for reference)
    # We need to see both active and previously saved records
    week_attendance = Attendance.all_objects.filter(
        date__range=[start_of_week, end_of_week]
    ).exclude(record_state='deleted')  # Exclude soft deleted records
    
    # Create attendance data dictionary
    attendance_data = {}
    
    # For each employee, for each day of the week, get their attendance status
    for employee_name in employees_list:
        for i in range(7):
            day_date = start_of_week + timedelta(days=i)
            date_str = day_date.strftime('%Y-%m-%d')
            
            # Find attendance record for this employee on this date
            attendance_record = week_attendance.filter(
                employee_name=employee_name,
                date=day_date
            ).first()
            
            if attendance_record:
                key = f"{employee_name}_{date_str}"
                attendance_data[key] = {
                    'status': attendance_record.status,
                    'notes': attendance_record.notes or '',
                    'id': attendance_record.id,
                    'record_state': attendance_record.record_state,
                    'payroll_active': attendance_record.payroll.record_state == 'active' if attendance_record.payroll else True
                }
            else:
                # If no record exists, still create a placeholder
                # This helps the frontend know this employee exists for this date
                key = f"{employee_name}_{date_str}"
                attendance_data[key] = {
                    'status': '',
                    'notes': '',
                    'id': None,
                    'record_state': 'active',
                    'payroll_active': True
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
    
    # Get today's counts from active records
    today_attendance = Attendance.objects.filter(date=today)
    present_today = today_attendance.filter(status='present').count()
    halfday_today = today_attendance.filter(status='half_day').count()
    absent_today = today_attendance.filter(status='absent').count()
    
    return JsonResponse({
        'success': True,
        'employees': employees_list,
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
        
        # Check if employee exists in payroll
        payroll_exists = Payroll.objects.filter(employee_name=employee_name).exists()
        
        if not payroll_exists:
            return JsonResponse({
                'success': False,
                'message': f'Employee "{employee_name}" not found in Payroll records. Add to payroll first.',
                'payroll_missing': True
            }, status=400)
        
        # Check if active employee already exists in attendance records
        exists_in_attendance = Attendance.objects.filter(employee_name=employee_name).exists()
        
        # If not exists, create a sample attendance record for today
        if not exists_in_attendance:
            try:
                # Find payroll record
                payroll_record = Payroll.objects.filter(employee_name=employee_name).first()
                if payroll_record:
                    Attendance.objects.create(
                        payroll=payroll_record,
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
        
        # Check if already deleted
        if attendance.record_state == 'deleted':
            return JsonResponse({
                'success': False,
                'message': 'Attendance record is already deleted'
            }, status=400)
        
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
        
        # Soft delete all active attendance records for this employee
        active_records = Attendance.all_objects.filter(
            employee_name=employee_name,
            record_state='active'
        )
        
        deleted_count = 0
        for attendance in active_records:
            attendance.soft_delete()
            deleted_count += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Soft deleted {deleted_count} attendance records for {employee_name}',
            'deleted_count': deleted_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_POST
def restore_attendance(request):
    """Restore a soft deleted attendance record"""
    try:
        data = json.loads(request.body)
        record_id = data.get('id')
        
        # Use all_objects to get the soft deleted record
        attendance = get_object_or_404(Attendance.all_objects, id=record_id)
        
        # Check if it's actually deleted
        if attendance.record_state != 'deleted':
            return JsonResponse({
                'success': False,
                'message': 'Attendance record is not deleted'
            }, status=400)
        
        # Check if payroll is active
        if attendance.payroll and attendance.payroll.record_state != 'active':
            return JsonResponse({
                'success': False,
                'message': 'Cannot restore attendance because payroll record is deleted'
            }, status=400)
        
        # Restore the record
        attendance.record_state = 'active'
        attendance.deleted_at = None
        attendance.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance record restored successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_POST
def generate_summary_for_range(request):
    """Manually generate summaries for a date range"""
    
    try:
        data = json.loads(request.body)
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        
        if not start_date_str or not end_date_str:
            return JsonResponse({
                'success': False,
                'message': 'Both start_date and end_date are required'
            }, status=400)
        
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        if start_date > end_date:
            return JsonResponse({
                'success': False,
                'message': 'Start date cannot be after end date'
            }, status=400)
        
        # Get all active employees from Payroll
        from ..models.payroll import Payroll
        employees = Payroll.objects.all().values_list('employee_name', flat=True).distinct()
        
        generated_count = 0
        
        for employee in employees:
            summary, created = AttendanceSummary.generate_summary_for_period(
                employee_name=employee,
                period_type='custom',
                start_date=start_date,
                end_date=end_date
            )
            if created:
                generated_count += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Generated {generated_count} summary records',
            'generated_count': generated_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

# views/attendance_views.py - Update the get_attendance_summary function
@require_GET
def get_attendance_summary(request):
    """Get attendance summary"""
    try:
        start_date_str = request.GET.get('from_date')
        end_date_str = request.GET.get('to_date')
        employee_name = request.GET.get('employee_name', '')
        
        if not start_date_str or not end_date_str:
            return JsonResponse({
                'success': False,
                'message': 'Both from_date and to_date are required'
            }, status=400)
        
        # Convert string dates to date objects
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        if start_date > end_date:
            return JsonResponse({
                'success': False,
                'message': 'Start date cannot be after end date'
            }, status=400)
        
        # Calculate days in range
        days_in_range = (end_date - start_date).days + 1
        
        # Get all active employees from Payroll
        from ..models.payroll import Payroll
        payroll_records = Payroll.objects.all()
        
        if employee_name:
            payroll_records = payroll_records.filter(employee_name__icontains=employee_name)
        
        employees_list = sorted(list(set(
            payroll_records.values_list('employee_name', flat=True).distinct()
        )))
        
        summary_list = []
        total_present = 0
        total_half_days = 0
        total_absent = 0
        total_full_days = Decimal('0.0')
        
        # For each employee, calculate attendance for the date range
        for employee in employees_list:
            # Get attendance records for this employee in the date range
            attendance_records = Attendance.objects.filter(
                employee_name=employee,
                date__range=[start_date, end_date]
            )
            
            # Calculate counts
            present_count = attendance_records.filter(status='present').count()
            half_day_count = attendance_records.filter(status='half_day').count()
            absent_count = attendance_records.filter(status='absent').count()
            
            # FIX: Calculate full_days as decimal
            full_days_decimal = Decimal(present_count) + (Decimal(half_day_count) * Decimal('0.5'))
            
            # Total marked days (present + half_day + absent)
            total_marked_days = present_count + half_day_count + absent_count
            
            summary_list.append({
                'employee_name': employee,
                'present': present_count,
                'half_day': half_day_count,
                'absent': absent_count,
                'full_days': float(full_days_decimal),  # Convert to float for JSON
                'total_marked_days': total_marked_days,
                'days_in_range': days_in_range,
            })
            
            # Update totals
            total_present += present_count
            total_half_days += half_day_count
            total_absent += absent_count
            total_full_days += full_days_decimal
        
        totals = {
            'total_present': total_present,
            'total_half_day': total_half_days,
            'total_absent': total_absent,
            'total_full_days': float(total_full_days),  # Convert to float
            'employee_count': len(summary_list)
        }
        
        return JsonResponse({
            'success': True,
            'summary': summary_list,
            'totals': totals,
            'date_range': {
                'from_date': start_date_str,
                'to_date': end_date_str,
                'days': days_in_range
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

# Also update the get_periodic_summaries function
@require_GET
def get_periodic_summaries(request):
    """Get summaries by period type (weekly, monthly, etc.)"""
    try:
        period_type = request.GET.get('period_type', 'weekly')  # weekly, monthly
        reference_date_str = request.GET.get('reference_date')
        
        if reference_date_str:
            reference_date = datetime.strptime(reference_date_str, '%Y-%m-%d').date()
        else:
            reference_date = date.today()
        
        # Only allow weekly and monthly
        if period_type not in ['weekly', 'monthly']:
            return JsonResponse({
                'success': False,
                'message': 'Period type must be weekly or monthly'
            }, status=400)
        
        # Use manager to get summaries
        manager = AttendanceSummaryManager()
        
        # Get all active employees from Payroll
        from ..models.payroll import Payroll
        employees = Payroll.objects.all().values_list('employee_name', flat=True).distinct()
        
        summaries = []
        for employee in employees:
            summary = manager.get_summary_for_period(employee, period_type, reference_date)
            if summary:
                summaries.append({
                    'employee_name': employee,
                    period_type: {
                        'present': summary.present_days,
                        'half_days': summary.half_days,
                        'absent': summary.absent_days,
                        'full_day_equivalent': float(summary.full_day_equivalent)
                    }
                })
        
        return JsonResponse({
            'success': True,
            'period_type': period_type,
            'summaries': summaries,
            'reference_date': reference_date.strftime('%Y-%m-%d')
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@require_GET
def check_payroll_status(request):
    """Check if an employee's payroll record is active"""
    employee_name = request.GET.get('employee_name')
    
    if not employee_name:
        return JsonResponse({
            'success': False,
            'message': 'Employee name is required'
        }, status=400)
    
    # Check all_objects to find both active and deleted records
    payroll_record = Payroll.all_objects.filter(
        employee_name=employee_name
    ).first()
    
    if not payroll_record:
        return JsonResponse({
            'success': False,
            'message': f'Employee "{employee_name}" not found in payroll records',
            'exists': False
        })
    
    return JsonResponse({
        'success': True,
        'exists': True,
        'is_active': payroll_record.record_state == 'active',
        'payroll_id': payroll_record.id,
        'employee_name': payroll_record.employee_name,
        'record_state': payroll_record.record_state
    })

@csrf_exempt
@require_POST
def restore_attendance_by_payroll(request):
    """Restore all attendance records for a payroll (when payroll is restored)"""
    try:
        data = json.loads(request.body)
        payroll_id = data.get('payroll_id')
        
        # Get the payroll record
        payroll = get_object_or_404(Payroll.all_objects, id=payroll_id)
        
        # Check if payroll is active
        if payroll.record_state != 'active':
            return JsonResponse({
                'success': False,
                'message': 'Payroll record is not active'
            }, status=400)
        
        # Get all deleted attendance records for this payroll
        deleted_attendances = Attendance.all_objects.filter(
            payroll=payroll,
            record_state='deleted'
        )
        
        restored_count = 0
        for attendance in deleted_attendances:
            attendance.record_state = 'active'
            attendance.deleted_at = None
            attendance.save()
            restored_count += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Restored {restored_count} attendance records',
            'restored_count': restored_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@require_GET
def get_deleted_attendance(request):
    """Get all deleted attendance records (for admin/recovery)"""
    try:
        # Get all deleted attendance records
        deleted_attendances = Attendance.all_objects.filter(
            record_state='deleted'
        ).order_by('-deleted_at', 'employee_name')
        
        data = []
        for attendance in deleted_attendances:
            data.append({
                'id': attendance.id,
                'employee_name': attendance.employee_name,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'status': attendance.status,
                'status_display': attendance.get_status_display(),
                'notes': attendance.notes or '',
                'deleted_at': attendance.deleted_at.strftime('%Y-%m-%d %H:%M:%S') if attendance.deleted_at else None,
                'payroll_id': attendance.payroll.id if attendance.payroll else None,
                'payroll_active': attendance.payroll.record_state == 'active' if attendance.payroll else False
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'count': len(data)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)