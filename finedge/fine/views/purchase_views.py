from django.shortcuts import get_object_or_404, render, redirect
from django.contrib import messages
from django.utils import timezone
from decimal import Decimal
from ..models import Purchase

def purchases(request):
    if request.method == "POST":
        try:
            qty = Decimal(request.POST.get('quantity', '0'))
            price = Decimal(request.POST.get('unit_price', '0'))
            Purchase.objects.create(
                date=request.POST.get('date'),
                vendor=request.POST.get('vendor'),
                category=request.POST.get('category'),
                bill_no=request.POST.get('bill_no'),
                quantity=qty,
                unit=request.POST.get('unit'),
                unit_price=price,
                gst_applicable=(request.POST.get('gstApplicable') == 'yes'),
                status=request.POST.get('status'),
            )
            messages.success(request, "Purchase recorded successfully!")
            return redirect('purchases')
        except Exception as e:
            messages.error(request, f"Error: {e}")

    purchase_data = Purchase.objects.all().order_by('-date')
    context = {
        'purchases': purchase_data,
        'vendor_choices': [v[0] for v in Purchase.VENDOR_CHOICES],
        'category_choices': [c[0] for c in Purchase.CATEGORY_CHOICES],
        'unit_choices': [u[0] for u in Purchase.UNIT_CHOICES],
        'status_choices': [s[0] for s in Purchase.STATUS_CHOICES],
        'today_date': timezone.now().date().isoformat(),
    }
    return render(request, 'fine/purchases.html', context)

def edit_purchase(request, pk):
    purchase = get_object_or_404(Purchase, pk=pk)
    if request.method == "POST":
        purchase.date = request.POST.get('date')
        purchase.vendor = request.POST.get('vendor')
        purchase.category = request.POST.get('category')
        purchase.bill_no = request.POST.get('bill_no')
        purchase.quantity = request.POST.get('quantity')
        purchase.unit = request.POST.get('unit')
        purchase.unit_price = request.POST.get('unit_price')
        purchase.gst_applicable = (request.POST.get('gstApplicable') == 'yes')
        purchase.status = request.POST.get('status')
        purchase.save()
        messages.success(request, "Purchase updated!")
    return redirect('purchases')

def delete_purchase(request, pk):
    if request.method == "POST":
        purchase = get_object_or_404(Purchase, pk=pk)
        purchase.delete()
        messages.success(request, "Purchase deleted!")
    return redirect('purchases')