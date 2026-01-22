# fine/views/__init__.py
from .auth_views import login_view as login
from .dashboard_views import dashboard, get_chart_data
from .expense_views import expenses, delete_expense, get_expense_report, restore_expense
from .income_views import income, delete_income, edit_income, get_income_report
from .purchase_views import purchases, edit_purchase, delete_purchase, get_purchase_report, add_category_ajax
from .main_views import settings, attendance, reports  # Removed payroll from here

# Updated payroll views with payment split functionality
from .payroll_views import (
    payroll_list,  # Main payroll view with payment split
    save_payroll,  # Save payroll with payment split
    get_payroll_data,  # Get payroll data
    delete_payroll,  # Delete payroll and expenses
    recreate_expenses,  # Manually recreate expenses for payroll
    restore_payroll,
)

# Updated attendance views - only the API functions, not the main view
from .attendance_views import (
    save_attendance,
    get_attendance_data,
    get_weekly_attendance,
    edit_attendance,
    add_employee,
    delete_attendance,
    delete_employee_attendance,
    get_attendance_summary,
    get_periodic_summaries,
    generate_summary_for_range,
)

# NEW: Updated reports views with comprehensive reporting (only API functions)
from .reports_views import (
    get_report_data,  # Unified report data API
    export_report,  # Export reports

    # Individual report APIs (for backward compatibility)
    get_payroll_report,
    get_attendance_report,
    get_attendance_summary_report,
    get_combined_report,
    get_expense_report,
    get_income_report,
    get_purchase_report,
)

__all__ = [
    # Main views from main_views.py
    'login',
    'dashboard',
    'get_chart_data',
    'expenses',
    'income',
    'purchases',
    'settings',
    'attendance',
    'reports',

    # Payroll views (using payroll_list from payroll_views, not main_views)
    'payroll_list',
    'save_payroll',
    'get_payroll_data',
    'delete_payroll',
    'recreate_expenses',
    'restore_payroll',

    # Attendance API views (not the main attendance view)
    'save_attendance',
    'get_attendance_data',
    'get_weekly_attendance',
    'edit_attendance',
    'add_employee',
    'delete_attendance',
    'delete_employee_attendance',
    'get_attendance_summary',
    'get_periodic_summaries',
    'generate_summary_for_range',

    # Expense views
    'delete_expense',
    'get_expense_report',
    'restore_expense',

    # Income views
    'delete_income',
    'edit_income',
    'get_income_report',

    # Purchase views
    'edit_purchase',
    'delete_purchase',
    'get_purchase_report',
    'add_category_ajax',

    # =================== NEW REPORTS VIEWS ===================
    # Unified reports API
    'get_report_data',
    'export_report',

    # Individual report APIs (legacy support)
    'get_payroll_report',
    'get_attendance_report',
    'get_attendance_summary_report',
    'get_combined_report',
    'get_expense_report',
    'get_income_report',
    'get_purchase_report',
    # =================== END NEW REPORTS VIEWS ===================
]