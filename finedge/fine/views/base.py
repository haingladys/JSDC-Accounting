# views/base.py
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
import json
from datetime import datetime, date, timedelta
from decimal import Decimal
import logging

# Import models
from ..models import Payroll, Attendance

logger = logging.getLogger(__name__)

# Common utility functions can go here
def index(request):
    """Home page view"""
    return render(request, 'index.html')