# views/report_views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import get_object_or_404
from django.db.models import Q 
from datetime import datetime, date
from decimal import Decimal
import calendar
from collections import defaultdict

# Import from base and models
from .base import logger
from ..models import Payroll, Attendance



@require_GET
def get_payroll_report(request):
    """Generate comprehensive payroll report with filtering"""
    try:
        # Get filters from request
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        employee_name = request.GET.get('employee_name', '').strip()
        
        # Debug logging
        logger.debug(f"Payroll Report - Start: {start_date_str}, End: {end_date_str}, Employee: {employee_name}")
        
        # Base query for active records
        payrolls = Payroll.objects.all().order_by('-year', '-month', 'employee_name')
        
        # Debug: Log total records before filtering
        logger.debug(f"Total payroll records before filter: {payrolls.count()}")
        
        # Apply filters
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                logger.debug(f"Parsed dates - Start: {start_date}, End: {end_date}")
                
                # Get all payrolls where salary_date falls in range OR month/year combination is in range
                date_filter = Q()
                
                # Add filter for salary_date if it exists
                date_filter |= Q(salary_date__isnull=False, salary_date__range=[start_date, end_date])
                
                # Also filter by month/year combination for records without salary_date
                # Create list of month-year combos in the range
                current = start_date.replace(day=1)
                while current <= end_date:
                    date_filter |= Q(
                        year=current.year, 
                        month=current.month,
                        salary_date__isnull=True
                    )
                    # Move to next month
                    if current.month == 12:
                        current = current.replace(year=current.year + 1, month=1)
                    else:
                        current = current.replace(month=current.month + 1)
                
                payrolls = payrolls.filter(date_filter)
                logger.debug(f"Records after date filter: {payrolls.count()}")
                
            except ValueError as e:
                logger.error(f"Date parsing error: {e}")
                return JsonResponse({
                    'success': False,
                    'message': f'Invalid date format. Use YYYY-MM-DD. Error: {str(e)}'
                }, status=400)
        
        if employee_name:
            payrolls = payrolls.filter(employee_name__icontains=employee_name)
            logger.debug(f"Records after employee filter: {payrolls.count()}")
        
        # Debug: Log the final query
        logger.debug(f"Final query: {payrolls.query}")
        
        # Prepare report data
        report_data = []
        summary = {
            'total_employees': 0,
            'total_basic_pay': Decimal('0'),
            'total_advances': Decimal('0'),
            'total_spr_amount': Decimal('0'),
            'total_net_salary': Decimal('0'),
            'paid_count': 0,
            'unpaid_count': 0,
            'monthly_average': Decimal('0')
        }
        
        employees_seen = set()
        monthly_totals = defaultdict(lambda: Decimal('0'))
        
        for payroll in payrolls:
            month_key = f"{payroll.year}-{payroll.month:02d}"
            
            report_data.append({
                'id': payroll.id,
                'employee_name': payroll.employee_name,
                'month': payroll.month,
                'month_name': calendar.month_name[payroll.month],
                'year': payroll.year,
                'period': f"{calendar.month_name[payroll.month]} {payroll.year}",
                'basic_pay': float(payroll.basic_pay),
                'advances': float(payroll.advances),
                'spr_amount': float(payroll.spr_amount),
                'net_salary': float(payroll.net_salary),
                'salary_date': payroll.salary_date.strftime('%Y-%m-%d') if payroll.salary_date else '',
                'display_date': payroll.salary_date.strftime('%d-%b-%Y') if payroll.salary_date else '',
                'status': payroll.status,
                'status_display': payroll.get_status_display(),
                'record_state': payroll.record_state
            })
            
            # Update summary
            employees_seen.add(payroll.employee_name)
            summary['total_basic_pay'] += payroll.basic_pay
            summary['total_advances'] += payroll.advances
            summary['total_spr_amount'] += payroll.spr_amount
            summary['total_net_salary'] += payroll.net_salary
            monthly_totals[month_key] += payroll.net_salary
            
            if payroll.status == 'paid':
                summary['paid_count'] += 1
            else:
                summary['unpaid_count'] += 1
        
        # Finalize summary
        summary['total_employees'] = len(employees_seen)
        if monthly_totals:
            summary['monthly_average'] = sum(monthly_totals.values()) / len(monthly_totals)
        
        # Convert Decimal to float for JSON serialization
        summary_data = {}
        for key, value in summary.items():
            if isinstance(value, Decimal):
                summary_data[key] = float(value)
            else:
                summary_data[key] = value
        
        logger.debug(f"Report generated: {len(report_data)} records, {len(employees_seen)} employees")
        
        return JsonResponse({
            'success': True,
            'report_type': 'payroll',
            'data': report_data,
            'summary': summary_data,
            'filtered_count': len(report_data),
            'message': f'Found {len(report_data)} payroll records'
        })
        
    except Exception as e:
        logger.error(f"Error in get_payroll_report: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'message': f'Error generating payroll report: {str(e)}'
        }, status=400)


# views.py - Updated get_attendance_report function

@require_GET
def get_attendance_report(request):
    """Generate comprehensive attendance report - FIXED VERSION"""
    try:
        # Get filters
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        employee_name = request.GET.get('employee_name', '').strip()
        
        # Debug logging
        logger.debug(f"Attendance Report - Start: {start_date_str}, End: {end_date_str}, Employee: {employee_name}")
        
        # Base query for active records only (using custom manager)
        attendances = Attendance.objects.all().order_by('-date', 'employee_name')
        
        # Apply filters - FIXED SIMPLE VERSION
        if start_date_str and end_date_str:
            try:
                # Validate dates
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                logger.debug(f"Parsed dates - Start: {start_date}, End: {end_date}")
                
                # Apply simple date range filter
                attendances = attendances.filter(date__range=[start_date, end_date])
                logger.debug(f"Records after date filter: {attendances.count()}")
                
            except ValueError as e:
                logger.error(f"Date parsing error: {e}")
                return JsonResponse({
                    'success': False,
                    'message': f'Invalid date format. Use YYYY-MM-DD. Error: {str(e)}'
                }, status=400)
        
        if employee_name:
            attendances = attendances.filter(employee_name__icontains=employee_name)
            logger.debug(f"Records after employee filter: {attendances.count()}")
        
        # Prepare report data - INCLUDE NOTES FIELD
        report_data = []
        summary = {
            'total_records': 0,
            'present_count': 0,
            'half_day_count': 0,
            'absent_count': 0,
            'total_attendance_days': Decimal('0')
        }
        
        # Process attendance records
        for attendance in attendances:
            date_str = attendance.date.strftime('%Y-%m-%d')
            display_date = attendance.date.strftime('%d-%b-%Y')
            day_name = attendance.date.strftime('%A')
            
            # Calculate attendance value
            attendance_value = Decimal('0')
            if attendance.status == 'present':
                attendance_value = Decimal('1.0')
            elif attendance.status == 'half_day':
                attendance_value = Decimal('0.5')
            
            # Add to report data - INCLUDE NOTES FIELD
            report_data.append({
                'id': attendance.id,
                'employee_name': attendance.employee_name,
                'date': date_str,
                'display_date': display_date,
                'day_name': day_name,
                'status': attendance.status,
                'status_display': attendance.get_status_display(),
                'attendance_value': float(attendance_value),
                'notes': attendance.notes if hasattr(attendance, 'notes') else '',  # ADDED NOTES FIELD
                'record_state': attendance.record_state
            })
            
            # Update summary
            summary['total_records'] += 1
            
            if attendance.status == 'present':
                summary['present_count'] += 1
                summary['total_attendance_days'] += Decimal('1.0')
            elif attendance.status == 'half_day':
                summary['half_day_count'] += 1
                summary['total_attendance_days'] += Decimal('0.5')
            elif attendance.status == 'absent':
                summary['absent_count'] += 1
        
        logger.debug(f"Report generated: {len(report_data)} records")
        
        # Convert Decimal to float in summary
        summary_data = {}
        for key, value in summary.items():
            if isinstance(value, Decimal):
                summary_data[key] = float(value)
            else:
                summary_data[key] = value
        
        # Add percentages to summary
        if summary['total_records'] > 0:
            summary_data['present_percent'] = round((summary['present_count'] / summary['total_records']) * 100, 1)
            summary_data['half_day_percent'] = round((summary['half_day_count'] / summary['total_records']) * 100, 1)
            summary_data['absent_percent'] = round((summary['absent_count'] / summary['total_records']) * 100, 1)
        
        return JsonResponse({
            'success': True,
            'report_type': 'attendance',
            'data': report_data,
            'summary': summary_data,
            'filtered_count': len(report_data),
            'message': f'Found {len(report_data)} attendance records'
        })
        
    except Exception as e:
        logger.error(f"Error in get_attendance_report: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'message': f'Error generating attendance report: {str(e)}'
        }, status=400)


# views.py - Updated get_combined_report to avoid issues

@require_GET
def get_combined_report(request):
    """Generate combined payroll and attendance report - SAFE VERSION"""
    try:
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        if not start_date_str or not end_date_str:
            return JsonResponse({
                'success': False,
                'message': 'Start date and end date are required'
            }, status=400)
        
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        # Get payroll data directly (not by calling get_payroll_report)
        payrolls = Payroll.objects.filter(
            salary_date__range=[start_date, end_date]
        ).order_by('-salary_date', 'employee_name')
        
        payroll_data = []
        payroll_summary = {
            'total_records': 0,
            'total_net_salary': Decimal('0'),
            'paid_count': 0,
            'unpaid_count': 0
        }
        
        for payroll in payrolls:
            payroll_data.append({
                'id': payroll.id,
                'employee_name': payroll.employee_name,
                'date': payroll.salary_date.strftime('%Y-%m-%d'),
                'display_date': payroll.salary_date.strftime('%d-%b-%Y'),
                'basic_pay': float(payroll.basic_pay),
                'advances': float(payroll.advances),
                'spr_amount': float(payroll.spr_amount),
                'net_salary': float(payroll.net_salary),
                'status': payroll.status,
                'status_display': payroll.get_status_display()
            })
            
            payroll_summary['total_records'] += 1
            payroll_summary['total_net_salary'] += payroll.net_salary
            
            if payroll.status == 'paid':
                payroll_summary['paid_count'] += 1
            else:
                payroll_summary['unpaid_count'] += 1
        
        # Get attendance data directly
        attendances = Attendance.objects.filter(
            date__range=[start_date, end_date]
        ).order_by('-date', 'employee_name')
        
        attendance_data = []
        attendance_summary = {
            'total_records': 0,
            'present_count': 0,
            'half_day_count': 0,
            'absent_count': 0
        }
        
        for attendance in attendances:
            attendance_data.append({
                'id': attendance.id,
                'employee_name': attendance.employee_name,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'display_date': attendance.date.strftime('%d-%b-%Y'),
                'status': attendance.status,
                'status_display': attendance.get_status_display(),
                'notes': attendance.notes if hasattr(attendance, 'notes') else ''  # ADDED NOTES
            })
            
            attendance_summary['total_records'] += 1
            if attendance.status == 'present':
                attendance_summary['present_count'] += 1
            elif attendance.status == 'half_day':
                attendance_summary['half_day_count'] += 1
            elif attendance.status == 'absent':
                attendance_summary['absent_count'] += 1
        
        # Calculate combined metrics
        combined_summary = {
            'date_range': f"{start_date.strftime('%d-%b-%Y')} to {end_date.strftime('%d-%b-%Y')}",
            'total_payroll_amount': float(payroll_summary['total_net_salary']),
            'total_payroll_records': payroll_summary['total_records'],
            'total_attendance_records': attendance_summary['total_records'],
            'payroll_status_ratio': {
                'paid': payroll_summary['paid_count'],
                'unpaid': payroll_summary['unpaid_count']
            },
            'attendance_distribution': {
                'present': attendance_summary['present_count'],
                'half_day': attendance_summary['half_day_count'],
                'absent': attendance_summary['absent_count']
            }
        }
        
        return JsonResponse({
            'success': True,
            'report_type': 'combined',
            'payroll_data': {
                'success': True,
                'data': payroll_data,
                'summary': payroll_summary,
                'filtered_count': len(payroll_data)
            },
            'attendance_data': {
                'success': True,
                'data': attendance_data,
                'summary': attendance_summary,
                'filtered_count': len(attendance_data)
            },
            'combined_summary': combined_summary,
            'message': 'Combined report generated successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error generating combined report: {str(e)}'
        }, status=400)