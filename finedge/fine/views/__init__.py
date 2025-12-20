from .auth_views import login
from .dashboard_views import dashboard
from .expense_views import expenses, delete_expense
from .income_views import income, delete_income, edit_income
from .purchase_views import purchases, edit_purchase, delete_purchase
from . main_views import payroll, attendance, reports, settings

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