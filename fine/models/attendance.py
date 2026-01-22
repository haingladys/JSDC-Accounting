# models/attendance.py - Updated with better cascade handling
from django.db import models
from decimal import Decimal
from .base import SoftDeleteModel
from .payroll import Payroll
from datetime import timedelta
from django.utils import timezone
from .attendance_summary import AttendanceSummary

class Attendance(SoftDeleteModel):
    ATTENDANCE_STATUS_CHOICES = (
        ('present', 'Present'),
        ('half_day', 'Half Day'),
        ('absent', 'Absent'),
    )
    
    # Add ForeignKey to Payroll with PROTECT on delete to prevent accidental deletion
    payroll = models.ForeignKey(
        Payroll,
        on_delete=models.PROTECT,  # Changed from CASCADE to PROTECT
        related_name='attendances',
        null=True,
        blank=True
    )
    
    employee_name = models.CharField(max_length=100)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True, verbose_name="Additional Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ['payroll', 'date', 'record_state']
        ordering = ['-date', 'employee_name']

    def __str__(self):
        return f"{self.employee_name} - {self.date} - {self.get_status_display()}"
    
    @property
    def attendance_value(self):
        """Returns numeric value for attendance"""
        if self.status == 'present':
            return Decimal('1.0')
        elif self.status == 'half_day':
            return Decimal('0.5')
        return Decimal('0.0')
    
    def save(self, *args, **kwargs):
        # Auto-populate employee_name from payroll if payroll is set
        if self.payroll and self.payroll.employee_name:
            self.employee_name = self.payroll.employee_name
        
        # Try to find payroll record if not set but employee_name is provided
        elif self.employee_name and not self.payroll:
            # Only look for active payroll records
            payroll_record = Payroll.objects.filter(
                employee_name=self.employee_name.strip().title()
            ).first()
            if payroll_record:
                self.payroll = payroll_record
        
        # Ensure employee_name is properly formatted
        if self.employee_name:
            self.employee_name = self.employee_name.strip().title()
        
        # Check if payroll is active (if payroll exists)
        if self.payroll and self.payroll.record_state != 'active':
            # If payroll is deleted, this attendance should also be marked as deleted
            self.record_state = 'deleted'
            self.deleted_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Trigger summary update after saving attendance (only if active)
        if self.record_state == 'active':
            self.update_related_summaries()
    
    def soft_delete(self):
        """Override soft delete to set deleted_at timestamp"""
        self.record_state = 'deleted'
        self.deleted_at = timezone.now()
        self.save()
        
        # Update summaries when attendance is soft deleted
        self.update_related_summaries()
    
    def update_related_summaries(self):
        """Update all related attendance summaries when attendance changes"""
        # Only update if attendance is active
        if self.record_state != 'active':
            return
            
        # Update weekly summary (current week)
        start_of_week = self.date - timedelta(days=self.date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        AttendanceSummary.generate_summary_for_period(
            employee_name=self.employee_name,
            period_type='weekly',
            start_date=start_of_week,
            end_date=end_of_week,
            payroll_id=self.payroll.id if self.payroll else None
        )
        
        # Update monthly summary
        start_of_month = self.date.replace(day=1)
        next_month = start_of_month.replace(
            month=start_of_month.month % 12 + 1, 
            year=start_of_month.year + (start_of_month.month // 12)
        )
        end_of_month = next_month - timedelta(days=1)
        
        AttendanceSummary.generate_summary_for_period(
            employee_name=self.employee_name,
            period_type='monthly',
            start_date=start_of_month,
            end_date=end_of_month,
            payroll_id=self.payroll.id if self.payroll else None
        )