# models/attendance.py
from django.db import models
from decimal import Decimal
from .base import SoftDeleteModel


class Attendance(SoftDeleteModel):
    ATTENDANCE_STATUS_CHOICES = (
        ('present', 'Present'),
        ('half_day', 'Half Day'),
        ('absent', 'Absent'),
    )
    
    employee_name = models.CharField(max_length=100)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ['employee_name', 'date', 'record_state']
        ordering = ['-date', 'employee_name']

    def __str__(self):
        return f"{self.employee_name} - {self.date} - {self.get_status_display()}"

    @property
    def attendance_value(self):
        """Returns numeric value for attendance (1 for present, 0.5 for half day, 0 for absent)"""
        if self.status == 'present':
            return Decimal('1.0')
        elif self.status == 'half_day':
            return Decimal('0.5')
        return Decimal('0.0')
    
    def save(self, *args, **kwargs):
        # Ensure employee_name is properly formatted
        if self.employee_name:
            self.employee_name = self.employee_name.strip().title()
        super().save(*args, **kwargs)
    
    def soft_delete(self):
        """Override soft delete to set deleted_at timestamp"""
        from django.utils import timezone
        self.record_state = 'deleted'
        self.deleted_at = timezone.now()
        self.save()