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

from django.shortcuts import render, get_object_or_404, redirect
