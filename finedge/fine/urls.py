from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('expenses/', views.expenses, name='expenses'),
    path('purchases/', views.purchases, name='purchases'),
    path('income/', views.income, name='income'),
    path('payroll/', views.payroll, name='payroll'),
    path('attendance/', views.attendance, name='attendance'),
    path('reports/', views.reports, name='reports'),
    path('settings/', views.settings, name='settings'),

    # Payroll URLs
    path('save-payroll/', views.save_payroll, name='save_payroll'),
    path('get-payroll-data/', views.get_payroll_data, name='get_payroll_data'),
    
    # Attendance URLs
    path('save-attendance/', views.save_attendance, name='save_attendance'),
    path('get-attendance-data/', views.get_attendance_data, name='get_attendance_data'),
    path('get-weekly-attendance/', views.get_weekly_attendance, name='get_weekly_attendance'),
    path('edit-attendance/', views.edit_attendance, name='edit_attendance'),  # NEW: Edit endpoint
    
    # Employee management
    path('add-employee/', views.add_employee, name='add_employee'),
    path('delete-attendance/', views.delete_attendance, name='delete_attendance'),
    path('delete-payroll/', views.delete_payroll, name='delete_payroll'),
    path('delete-payroll-record/', views.delete_payroll, name='delete_payroll_record'),
    path('delete-employee-attendance/', views.delete_employee_attendance, name='delete_employee_attendance'),
    path('toggle-payroll-status/', views.toggle_payroll_status, name='toggle_payroll_status'),
   
    # API Report URLs
    path('api/reports/payroll/', views.get_payroll_report, name='get_payroll_report'),
    path('api/reports/attendance/', views.get_attendance_report, name='get_attendance_report'),
    path('api/reports/combined/', views.get_combined_report, name='get_combined_report'),
]