from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    """
    Sitemap for static views in the Fine application.
    """
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return [
            'dashboard',
            'expenses',
            'purchases',
            'income',
            'payroll',
            'attendance',
            'reports',
            'settings',
        ]

    def location(self, item):
        return reverse(item)


class ExpenseSitemap(Sitemap):
    """
    Sitemap for Expense model instances.
    """
    changefreq = "monthly"
    priority = 0.5

    def items(self):
        return ['attendance', 'payroll', 'expense_list', 'income_list', 'purchase_list']

    def location(self, item):
        return reverse(item)

    def lastmod(self, obj):
        return obj.date if hasattr(obj, 'date') else None


class IncomeSitemap(Sitemap):
    """
    Sitemap for Income model instances.
    """
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        from .models import Income
        return Income.objects.all().order_by('-created_at')

    def location(self, obj):
        return reverse('income')

    def lastmod(self, obj):
        return obj.created_at if hasattr(obj, 'created_at') else obj.date


class PurchaseSitemap(Sitemap):
    """
    Sitemap for Purchase model instances.
    """
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        from .models import Purchase
        return Purchase.objects.all().order_by('-created_at')

    def location(self, obj):
        return reverse('purchases')

    def lastmod(self, obj):
        return obj.created_at if hasattr(obj, 'created_at') else obj.date


class PayrollSitemap(Sitemap):
    """
    Sitemap for Payroll model instances.
    """
    changefreq = "monthly"
    priority = 0.7

    def items(self):
        from .models import Payroll
        return Payroll.objects.all()

    def location(self, obj):
        return reverse('payroll')

    def lastmod(self, obj):
        # Use the most recently updated attendance record for this payroll
        if hasattr(obj, 'attendances'):
            latest_attendance = obj.attendances.all().order_by('-updated_at').first()
            if latest_attendance:
                return latest_attendance.updated_at
        return None


class AttendanceSitemap(Sitemap):
    """
    Sitemap for Attendance model instances.
    """
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        from .models import Attendance
        return Attendance.objects.all().order_by('-updated_at')

    def location(self, obj):
        return reverse('attendance')

    def lastmod(self, obj):
        return obj.updated_at if hasattr(obj, 'updated_at') else None


# Sitemap dictionary for Django's sitemap framework
sitemaps = {
    'static': StaticViewSitemap,
    'expenses': ExpenseSitemap,
    'income': IncomeSitemap,
    'purchases': PurchaseSitemap,
    'payroll': PayrollSitemap,
    'attendance': AttendanceSitemap,
}