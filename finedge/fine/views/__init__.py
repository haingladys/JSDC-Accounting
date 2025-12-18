# views/__init__.py
# Import all views here to make them available as module.views
from .base import index
from .payroll_views import (
    toggle_payroll_status,
    save_payroll,
    get_payroll_data,
    delete_payroll
)
from .attendance_views import (
    save_attendance,
    get_attendance_data,
    get_weekly_attendance,
    add_employee,
    delete_attendance
)
from .report_views import (
    get_payroll_report,
    get_attendance_report,
    get_combined_report
)

# Re-export common views
from .base import (
    restore_record,  # If this is in base.py
)

__all__ = [
    # Base
    'index',
    'restore_record',
    
    # Payroll
    'toggle_payroll_status',
    'save_payroll',
    'get_payroll_data',
    'delete_payroll',
    
    # Attendance
    'save_attendance',
    'get_attendance_data',
    'get_weekly_attendance',
    'add_employee',
    'delete_attendance',
    
    # Reports
    'get_payroll_report',
    'get_attendance_report',
    'get_combined_report',
]