# models/attendance_summary.py - UPDATED VERSION
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from .base import SoftDeleteModel
from .payroll import Payroll
from django.utils import timezone

class AttendanceSummary(SoftDeleteModel):
    """
    Stores pre-calculated attendance summary data for faster reporting.
    """
    SUMMARY_PERIOD_CHOICES = (
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom Range'),
    )
    
    payroll = models.ForeignKey(
        Payroll,
        on_delete=models.CASCADE,
        related_name='attendance_summaries',
        null=True,
        blank=True
    )
    
    employee_name = models.CharField(max_length=100)
    period_type = models.CharField(max_length=20, choices=SUMMARY_PERIOD_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Calculated fields
    total_days_in_period = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    present_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    half_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    absent_days = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # NEW: full_days = present_days + half_days
        # Change from IntegerField to DecimalField
    full_days = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal('0.0'),
        validators=[MinValueValidator(Decimal('0.0'))]
    )
    
    # Metadata
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance_summary'
        unique_together = ['employee_name', 'period_type', 'start_date', 'end_date', 'record_state']
        indexes = [
            models.Index(fields=['employee_name', 'start_date', 'end_date']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['employee_name']),
            models.Index(fields=['period_type']),
        ]
        ordering = ['-start_date', 'employee_name']
        verbose_name = 'Attendance Summary'
        verbose_name_plural = 'Attendance Summaries'

    def __str__(self):
        return f"{self.employee_name} - {self.get_period_type_display()} ({self.start_date} to {self.end_date})"
    
    @property
    def period_display(self):
        """Get human-readable period display"""
        if self.period_type == 'weekly':
            return f"Week of {self.start_date.strftime('%d %b %Y')}"
        elif self.period_type == 'monthly':
            return self.start_date.strftime('%B %Y')
        else:
            return f"{self.start_date} to {self.end_date}"
    
    def calculate_metrics(self):
        """Calculate full_days = present_days + (half_days * 0.5)"""
        self.full_days = Decimal(self.present_days) + (Decimal(self.half_days) * Decimal('0.5'))
    
    def save(self, *args, **kwargs):
        """Override save to auto-calculate full_days"""
        # Auto-calculate full_days before saving
        self.calculate_metrics()
        
        # Auto-populate employee_name from payroll if available
        if self.payroll and self.payroll.employee_name and not self.employee_name:
            self.employee_name = self.payroll.employee_name
        
        # Ensure employee_name is properly formatted
        if self.employee_name:
            self.employee_name = self.employee_name.strip().title()
        
        super().save(*args, **kwargs)
    
    def soft_delete(self):
        """Override soft delete to set deleted_at timestamp"""
        self.record_state = 'deleted'
        self.deleted_at = timezone.now()
        self.save()
        
    # models/attendance_summary.py - Update the generate_summary_for_period method
    @classmethod
    def generate_summary_for_period(cls, employee_name, period_type, start_date, end_date, payroll_id=None):
        """Generate and save summary for a specific period"""
        from ..models.attendance import Attendance
        
        # Get payroll record if payroll_id provided
        payroll = None
        if payroll_id:
            try:
                payroll = Payroll.objects.get(id=payroll_id, record_state='active')
            except Payroll.DoesNotExist:
                payroll = None
        
        # Calculate total days in period
        total_days = (end_date - start_date).days + 1
        
        # Get attendance records for the period
        attendance_records = Attendance.objects.filter(
            employee_name=employee_name,
            date__range=[start_date, end_date],
            record_state='active'
        )
        
        # Calculate counts - ONLY COUNT MARKED RECORDS
        present_count = attendance_records.filter(status='present').count()
        half_day_count = attendance_records.filter(status='half_day').count()
        absent_count = attendance_records.filter(status='absent').count()
        
        # FIX: Calculate full_days as decimal (present + half_days * 0.5)
        full_days_decimal = Decimal(present_count) + (Decimal(half_day_count) * Decimal('0.5'))
        
        # Find existing summary or create new
        summary, created = cls.objects.update_or_create(
            employee_name=employee_name,
            period_type=period_type,
            start_date=start_date,
            end_date=end_date,
            record_state='active',
            defaults={
                'payroll': payroll,
                'total_days_in_period': total_days,
                'present_days': present_count,
                'half_days': half_day_count,
                'absent_days': absent_count,
                'full_days': full_days_decimal,  # Save as Decimal
            }
        )
        
        return summary, created