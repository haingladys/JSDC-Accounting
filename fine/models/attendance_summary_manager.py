# models/attendance_summary_manager.py - FIXED VERSION
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from datetime import date, timedelta
from .attendance import Attendance
from .attendance_summary import AttendanceSummary

class AttendanceSummaryManager:
    """Manager class for handling attendance summary operations"""
    
    @staticmethod
    def get_or_create_custom_summary(employee_name, start_date, end_date):
        """Get or create summary for custom date range"""
        return AttendanceSummary.generate_summary_for_period(
            employee_name=employee_name,
            period_type='custom',
            start_date=start_date,
            end_date=end_date
        )
    
    @staticmethod
    def get_summary_for_period(employee_name, period_type, reference_date=None):
        """Get summary for a specific period type"""
        from datetime import datetime
        
        if not reference_date:
            reference_date = date.today()
        
        start_date = end_date = reference_date
        
        if period_type == 'weekly':
            start_date = reference_date - timedelta(days=reference_date.weekday())
            end_date = start_date + timedelta(days=6)
        elif period_type == 'monthly':
            start_date = reference_date.replace(day=1)
            next_month = start_date.replace(
                month=start_date.month % 12 + 1, 
                year=start_date.year + (start_date.month // 12)
            )
            end_date = next_month - timedelta(days=1)
        elif period_type == 'custom':
            # For custom, we need both start and end dates
            # This method shouldn't be called for custom without dates
            raise ValueError("Custom period requires explicit start and end dates")
        
        try:
            return AttendanceSummary.objects.get(
                employee_name=employee_name,
                period_type=period_type,
                start_date=start_date,
                end_date=end_date,
                record_state='active'
            )
        except AttendanceSummary.DoesNotExist:
            # Generate summary if doesn't exist
            return AttendanceSummary.generate_summary_for_period(
                employee_name=employee_name,
                period_type=period_type,
                start_date=start_date,
                end_date=end_date
            )[0]
    
    @staticmethod
    def get_team_summary(start_date, end_date):
        """Get summary for all employees in date range"""
        summaries = []
        
        # Get all active employees
        from .payroll import Payroll
        employees = Payroll.objects.filter(
            record_state='active'
        ).values_list('employee_name', flat=True).distinct()
        
        for employee in employees:
            summary, _ = AttendanceSummary.generate_summary_for_period(
                employee_name=employee,
                period_type='custom',
                start_date=start_date,
                end_date=end_date
            )
            summaries.append(summary)
        
        return summaries
    
    @staticmethod
    def regenerate_all_summaries():
        """Regenerate all summaries (for maintenance or data fix)"""
        from .attendance import Attendance
        from .payroll import Payroll
        
        # Delete all existing summaries
        AttendanceSummary.objects.all().delete()
        
        # Get all attendance records grouped by employee
        employees = Attendance.objects.values_list('employee_name', flat=True).distinct()
        
        total_regenerated = 0
        
        for employee in employees:
            # Get all dates for this employee
            dates = Attendance.objects.filter(
                employee_name=employee
            ).values_list('date', flat=True).distinct()
            
            if not dates:
                continue
            
            min_date = min(dates)
            max_date = max(dates)
            
            # Generate weekly summaries
            current_date = min_date
            while current_date <= max_date:
                start_of_week = current_date - timedelta(days=current_date.weekday())
                end_of_week = start_of_week + timedelta(days=6)
                
                AttendanceSummary.generate_summary_for_period(
                    employee_name=employee,
                    period_type='weekly',
                    start_date=start_of_week,
                    end_date=end_of_week
                )
                total_regenerated += 1
                
                # Move to next week
                current_date = end_of_week + timedelta(days=1)
            
            # Generate monthly summaries
            current_date = min_date.replace(day=1)
            while current_date <= max_date:
                start_of_month = current_date.replace(day=1)
                next_month = start_of_month.replace(
                    month=start_of_month.month % 12 + 1,
                    year=start_of_month.year + (start_of_month.month // 12)
                )
                end_of_month = next_month - timedelta(days=1)
                
                AttendanceSummary.generate_summary_for_period(
                    employee_name=employee,
                    period_type='monthly',
                    start_date=start_of_month,
                    end_date=end_of_month
                )
                total_regenerated += 1
                
                # Move to next month
                current_date = next_month
        
        return total_regenerated

# Signals to auto-update summaries
@receiver(post_save, sender=Attendance)
def update_summary_on_attendance_save(sender, instance, created, **kwargs):
    """Signal to update summaries when attendance is saved"""
    instance.update_related_summaries()

@receiver(post_delete, sender=Attendance)
def update_summary_on_attendance_delete(sender, instance, **kwargs):
    """Signal to update summaries when attendance is deleted"""
    # Update weekly summary
    start_of_week = instance.date - timedelta(days=instance.date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    AttendanceSummary.generate_summary_for_period(
        employee_name=instance.employee_name,
        period_type='weekly',
        start_date=start_of_week,
        end_date=end_of_week,
        payroll_id=instance.payroll.id if instance.payroll else None
    )
    
    # Update monthly summary
    start_of_month = instance.date.replace(day=1)
    next_month = start_of_month.replace(
        month=start_of_month.month % 12 + 1,
        year=start_of_month.year + (start_of_month.month // 12)
    )
    end_of_month = next_month - timedelta(days=1)
    
    AttendanceSummary.generate_summary_for_period(
        employee_name=instance.employee_name,
        period_type='monthly',
        start_date=start_of_month,
        end_date=end_of_month,
        payroll_id=instance.payroll.id if instance.payroll else None
    )