from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),          # Root URL shows login
    path('dashboard/', views.dashboard, name='dashboard'),
    path('expenses/', views.expenses, name='expenses'),
    path('purchases/', views.purchases, name='purchases'),
    path('income/', views.income, name='income'),
    path('payroll/', views.payroll, name='payroll'),
    path('attendance/', views.attendance, name='attendance'),
    path('reports/', views.reports, name='reports'),
    path('settings/', views.settings, name='settings'),
]