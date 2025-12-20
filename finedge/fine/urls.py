from django.urls import path
# Import each sub-module from the views package
from . import views
from .views import (
    auth_views, 
    dashboard_views, 
    expense_views, 
    income_views, 
    purchase_views, 
    main_views
)

urlpatterns = [
    # Auth
    path('', auth_views.login_view, name='login'),
    
    # Dashboard - using the module name 'dashboard_views'
    path('dashboard/', dashboard_views.dashboard, name='dashboard'),
    
    # Expenses
    path('expenses/', expense_views.expenses, name='expenses'),
    path('delete_expense/<int:pk>/', expense_views.delete_expense, name='delete_expense'),
    
    # Purchases
    path('purchases/', purchase_views.purchases, name='purchases'),
    path('edit_purchase/<int:pk>/', purchase_views.edit_purchase, name='edit_purchase'),
    path('delete_purchase/<int:pk>/', purchase_views.delete_purchase, name='delete_purchase'),
    
    # Income
    path('income/', income_views.income, name='income'),
    path('edit_income/<int:pk>/', income_views.edit_income, name='edit_income'),
    path('delete_income/<int:pk>/', income_views.delete_income, name='delete_income'),
    
    # Payroll URLs
    path('payroll/', views.payroll, name='payroll'),
    path('save-payroll/', views.save_payroll, name='save_payroll'),
    path('get-payroll-data/', views.get_payroll_data, name='get_payroll_data'),
    
    # Attendance URLs
    path('attendance/', views.attendance, name='attendance'),
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
    path('reports/', views.reports, name='reports'),
    path('api/reports/payroll/', views.get_payroll_report, name='get_payroll_report'),
    path('api/reports/attendance/', views.get_attendance_report, name='get_attendance_report'),
    path('api/reports/combined/', views.get_combined_report, name='get_combined_report'),

    path('settings/', main_views.settings, name='settings'),
    
]