from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('', views.login, name='login'),

    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/dashboard-charts/', views.get_chart_data, name='get_chart_data'),

    # Expenses
    path('expenses/', views.expenses, name='expenses'),
    path('expenses/delete/<int:pk>/', views.delete_expense, name='delete_expense'),
    path('expenses/report/', views.get_expense_report, name='expense_report'),
    path('expenses/restore/', views.restore_expense, name='restore_expense'),

    # Purchases
    path('purchases/', views.purchases, name='purchases'),
    path('edit_purchase/<int:pk>/', views.edit_purchase, name='edit_purchase'),
    path('delete_purchase/<int:pk>/', views.delete_purchase, name='delete_purchase'),
    path('api/reports/purchase/', views.get_purchase_report, name='get_purchase_report'),
    path('ajax/add-category/', views.add_category_ajax, name='add_category_ajax'),

    # Income
    path('income/', views.income, name='income'),
    path('edit_income/<int:pk>/', views.edit_income, name='edit_income'),
    path('delete_income/<int:pk>/', views.delete_income, name='delete_income'),
    path('api/income-report/', views.get_income_report, name='get_income_report'),

    # Payroll URLs
    path('payroll/', views.payroll_list, name='payroll'),
    path('save-payroll/', views.save_payroll, name='save_payroll'),
    path('get-payroll-data/', views.get_payroll_data, name='get_payroll_data'),
    path('delete-payroll/', views.delete_payroll, name='delete_payroll'),
    path('recreate-expenses/', views.recreate_expenses, name='recreate_expenses'),
    path('restore-payroll/', views.restore_payroll, name='restore_payroll'),
    

    # Attendance URLs
    path('attendance/', views.attendance, name='attendance'),
    path('save-attendance/', views.save_attendance, name='save_attendance'),
    path('get-attendance-data/', views.get_attendance_data, name='get_attendance_data'),
    path('get-weekly-attendance/', views.get_weekly_attendance, name='get_weekly_attendance'),
    path('edit-attendance/', views.edit_attendance, name='edit_attention'),
    path('get-attendance-summary/', views.get_attendance_summary, name='get_attendance_summary'),
    path('generate-summary/', views.generate_summary_for_range, name='generate_summary'),
    path('get-periodic-summaries/', views.get_periodic_summaries, name='get_periodic_summaries'),

    # Employee management
    path('add-employee/', views.add_employee, name='add_employee'),
    path('delete-attendance/', views.delete_attendance, name='delete_attendance'),
    path('delete-payroll-record/', views.delete_payroll, name='delete_payroll_record'),
    path('delete-employee-attendance/', views.delete_employee_attendance, name='delete_employee_attendance'),

    # =================== REPORTS SECTION ===================
    # Main Reports Page
    path('reports/', views.reports, name='reports'),

    # API Report URLs (for AJAX requests) - FIXED: Changed from api/reports/ to reports/api/
    path('reports/api/get-report-data/', views.get_report_data, name='get_report_data'),
    path('reports/api/export/', views.export_report, name='export_report'),

    # Individual Report APIs (legacy - for backward compatibility)
    path('api/reports/payroll/', views.get_payroll_report, name='get_payroll_report'),
    path('api/reports/attendance/', views.get_attendance_report, name='get_attendance_report'),
    path('api/reports/attendance-summary/', views.get_attendance_summary_report, name='get_attendance_summary_report'),
    path('api/reports/combined/', views.get_combined_report, name='get_combined_report'),
    path('api/reports/expense/', views.get_expense_report, name='get_expense_report'),
    path('api/reports/income/', views.get_income_report, name='get_income_report'),
    path('api/reports/purchase/', views.get_purchase_report, name='get_purchase_report'),
    # =================== END REPORTS SECTION ===================

    path('settings/', views.settings, name='settings'),
]