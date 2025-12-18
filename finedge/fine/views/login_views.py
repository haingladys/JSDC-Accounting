from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

def login_view(request):
    if request.method == 'POST':
        # 1. Get data from the form
        username_data = request.POST.get('username')
        password_data = request.POST.get('password')
        
        # 2. Check if user exists in Django's database
        user = authenticate(request, username=username_data, password=password_data)
        
        if user is not None:
            # 3. Log them in and redirect to Dashboard
            login(request, user)
            return redirect('dashboard')
        else:
            # 4. Show error if wrong
            messages.error(request, "Invalid username or password")
            
    return render(request, 'fine/login.html')

def dashboard(request):
    return render(request, 'fine/dashboard.html')

def expenses(request):
    return render(request, 'fine/expenses.html')

def purchases(request):
    return render(request, 'fine/purchases.html')

def income(request):
    return render(request, 'fine/income.html')

def payroll(request):
    return render(request, 'fine/payroll.html')

def attendance(request):
    return render(request, 'fine/attendance.html')

def reports(request):
    # We still need to create reports.html (simple placeholder for now)
    return render(request, 'fine/reports.html')

def settings(request):
    # We still need to create settings.html (simple placeholder for now)
    return render(request, 'fine/settings.html')
    
