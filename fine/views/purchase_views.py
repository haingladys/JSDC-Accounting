from django.shortcuts import get_object_or_404, render, redirect
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse
from decimal import Decimal
from datetime import datetime

# Import models
from ..models import Purchase, Cat


def purchases(request):
    # -------------------- CREATE / UPDATE PURCHASE --------------------
    if request.method == "POST":
        try:
            purchase_id = request.POST.get('purchase_id')
            date_str = request.POST.get('date')
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

            # Handle Vendor: Either from dropdown or custom input
            vendor = request.POST.get('custom_vendor', '').strip()
            if not vendor:
                vendor = request.POST.get('vendor', '').strip()

            if not vendor:
                raise ValueError("Vendor is required.")

            # Handle Category (use 'cat' field name from form)
            cat_id = request.POST.get('cat')
            if not cat_id:
                raise ValueError("Category is required.")

            cat = get_object_or_404(Cat, id=cat_id)

            # Prepare data dictionary
            purchase_data = {
                'date': date_obj,
                'vendor': vendor,
                'cat': cat,
                'bill_no': request.POST.get('bill_no'),
                'total_amount': Decimal(request.POST.get('total_amount', '0')),
                'gst_amount': Decimal(request.POST.get('gst_amount', '0')),
                'payment_mode': request.POST.get('payment_mode'),
                'status': request.POST.get('status'),
                'description': request.POST.get('description', ''),
            }

            if purchase_id and purchase_id.strip():
                # UPDATE existing record
                Purchase.objects.filter(id=purchase_id).update(**purchase_data)
                messages.success(request, "Purchase updated successfully!")
            else:
                # CREATE new record
                Purchase.objects.create(**purchase_data)
                messages.success(request, "Purchase recorded successfully!")

            return redirect('purchases')

        except Exception as e:
            messages.error(request, f"Error: {str(e)}")
            return redirect('purchases')

    # -------------------- GET DATA & CONTEXT --------------------
    selected_date = request.GET.get('date')
    purchase_list = Purchase.objects.all().select_related('cat').order_by('-date')

    if selected_date:
        purchase_list = purchase_list.filter(date=selected_date)
        display_date = selected_date
    else:
        display_date = timezone.now().date().isoformat()

    # Get unique vendors for dropdown
    vendor_choices = Purchase.objects.values_list('vendor', flat=True).distinct().order_by('vendor')

    context = {
        'purchases': purchase_list,
        'vendor_choices': vendor_choices,
        'cat_choices': Cat.objects.all(),
        'today_date': display_date,
    }

    return render(request, 'fine/purchases.html', context)


def edit_purchase(request, pk):
    purchase = get_object_or_404(Purchase, pk=pk)

    if request.method == "POST":
        try:
            # Convert date
            date_str = request.POST.get('date')
            purchase.date = datetime.strptime(date_str, '%Y-%m-%d').date()

            # Handle Vendor
            vendor = request.POST.get('custom_vendor', '').strip()
            if not vendor:
                vendor = request.POST.get('vendor', '').strip()
            purchase.vendor = vendor

            # Update Category (use 'cat' field name)
            cat_id = request.POST.get('cat')
            purchase.cat = get_object_or_404(Cat, id=cat_id)

            # Update other fields
            purchase.bill_no = request.POST.get('bill_no')
            purchase.total_amount = Decimal(request.POST.get('total_amount', '0'))
            purchase.gst_amount = Decimal(request.POST.get('gst_amount', '0'))
            purchase.payment_mode = request.POST.get('payment_mode')
            purchase.status = request.POST.get('status')
            purchase.description = request.POST.get('description', '')

            purchase.save()
            messages.success(request, "Purchase updated successfully!")

        except Exception as e:
            messages.error(request, f"Error while updating purchase: {str(e)}")

    return redirect('purchases')


def delete_purchase(request, pk):
    if request.method == "POST":
        purchase = get_object_or_404(Purchase, pk=pk)
        purchase.delete()
        messages.success(request, "Purchase deleted successfully!")

    return redirect('purchases')


def add_category_ajax(request):
    """
    Handles the AJAX request to add a new category permanently.
    """
    if request.method == "POST":
        name = request.POST.get('name', '').strip()
        if name:
            cat_obj, created = Cat.objects.get_or_create(name=name)
            return JsonResponse({
                'success': True,
                'id': cat_obj.id,
                'name': cat_obj.name
            })
    return JsonResponse({'success': False}, status=400)


def get_purchase_report(request):
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    purchases_qs = Purchase.objects.all().select_related('cat')

    if start_date and end_date:
        purchases_qs = purchases_qs.filter(date__range=[start_date, end_date])

    data = []
    for p in purchases_qs.order_by('-date'):
        data.append({
            'date': p.date.isoformat(),
            'vendor': p.vendor,
            'category': p.cat.name,
            'bill_no': p.bill_no,
            'total_amount': float(p.total_amount),
            'gst_amount': float(p.gst_amount),
            'payment_mode': p.payment_mode,
            'status': p.status,
            'description': p.description,
            'type': 'purchase'
        })

    return JsonResponse({
        'success': True,
        'data': data
    })