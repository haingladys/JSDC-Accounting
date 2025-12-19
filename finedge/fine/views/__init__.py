# views/__init__.py
# Import all views here to make them available as module.views
from .base import index

from .login_views import (  # ADD THIS IMPORT
    login_view,
    dashboard,
    expenses,
    purchases,
    income,
    payroll,
    attendance,
    reports,
    settings
)

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
    edit_attendance, 
    add_employee,
    delete_attendance,
    delete_employee_attendance
)
from .reports_views import (
    get_payroll_report,
    get_attendance_report,
    get_combined_report
)



__all__ = [
    # Base
    'index',
    
        # Login and pages
    'login_view',    # ADD THIS
    'dashboard',     # ADD THIS
    'expenses',      # ADD THIS
    'purchases',     # ADD THIS
    'income',        # ADD THIS
    'payroll',       # ADD THIS - careful: this conflicts with payroll function
    'attendance',    # ADD THIS - careful: this conflicts with attendance function
    'reports',       # ADD THIS
    'settings',      # ADD THIS
    

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