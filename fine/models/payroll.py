# payroll.py - Fix worked days calculation
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.utils import timezone
from .base import SoftDeleteModel, SoftDeleteManager

class Payroll(SoftDeleteModel):
    PAYMENT_SPLIT_CHOICES = (
        ('full_cash', '100% Cash'),
        ('full_bank', '100% Bank Transfer'),
        ('split', 'Split Payment'),
    )
    
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank Transfer', 'Bank Transfer'),
    ]
    
    employee_name = models.CharField(max_length=100)
    basic_pay = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    spr_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    
    # Worked days field (for internal calculation only, not displayed in UI)
    worked_days = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Number of days worked (calculated from attendance)",
        editable=False  # Make it non-editable in admin
    )
    
    # Payment split fields
    payment_split_type = models.CharField(max_length=20, choices=PAYMENT_SPLIT_CHOICES, default='full_cash')
    bank_transfer_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text="Percentage for bank transfer (0-100)"
    )
    cash_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=100,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text="Percentage for cash payment (0-100)"
    )
    
    # Calculated payment amounts
    bank_transfer_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    cash_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    salary_date = models.DateField()
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    
    # Status tracking
    is_paid = models.BooleanField(default=False)
    expenses_created = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Custom managers
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    
    class Meta:
        db_table = 'payroll'
        unique_together = ['employee_name', 'month', 'year', 'record_state']
        ordering = ['-year', '-month', 'employee_name']

    def __str__(self):
        return f"{self.employee_name} - {self.month}/{self.year} - ₹{self.net_salary}"

    def calculate_worked_days(self):
        """Calculate worked days from attendance records"""
        try:
            # Try to import Attendance model
            from .attendance import Attendance
            
            # Check if Attendance model exists and has required fields
            print(f"Calculating worked days for {self.employee_name}, month: {self.month}, year: {self.year}")
            
            # Get all active attendance records for this employee in the selected month/year
            attendance_records = Attendance.objects.filter(
                employee_name=self.employee_name,
                month=self.month,
                year=self.year,
                record_state='active'
            )
            
            print(f"Found {attendance_records.count()} attendance records")
            
            # Different ways to count worked days based on your Attendance model structure:
            
            # Option 1: If you have a 'date' field in Attendance model
            # worked_days = attendance_records.values('date').distinct().count()
            
            # Option 2: If you have 'present_days' or similar field
            # total_days = attendance_records.aggregate(total=Sum('present_days'))['total'] or 0
            
            # Option 3: Simple count of records (assuming 1 record = 1 day)
            worked_days = attendance_records.count()
            
            # Debug output
            for record in attendance_records:
                print(f"  Attendance record: {record.employee_name} - {record.month}/{record.year}")
            
            print(f"Calculated worked days: {worked_days}")
            return Decimal(str(worked_days))
            
        except ImportError as e:
            print(f"Attendance model not found: {e}")
            return Decimal('0')
        except Exception as e:
            print(f"Error calculating worked days: {e}")
            import traceback
            print(traceback.format_exc())
            return Decimal('0')

    def calculate_salary(self):
        """Calculate net salary and payment splits"""
        self.net_salary = self.basic_pay + self.spr_amount
        if self.net_salary < Decimal('0'):
            self.net_salary = Decimal('0')
        
        # Calculate payment amounts based on split type
        if self.payment_split_type == 'full_cash':
            self.cash_percentage = Decimal('100')
            self.bank_transfer_percentage = Decimal('0')
            self.cash_amount = self.net_salary
            self.bank_transfer_amount = Decimal('0')
            
        elif self.payment_split_type == 'full_bank':
            self.cash_percentage = Decimal('0')
            self.bank_transfer_percentage = Decimal('100')
            self.cash_amount = Decimal('0')
            self.bank_transfer_amount = self.net_salary
            
        elif self.payment_split_type == 'split':
            total_percentage = self.cash_percentage + self.bank_transfer_percentage
            if total_percentage != Decimal('100'):
                if total_percentage > Decimal('0'):
                    self.cash_percentage = (self.cash_percentage / total_percentage) * 100
                    self.bank_transfer_percentage = (self.bank_transfer_percentage / total_percentage) * 100
            
            self.cash_amount = (self.net_salary * self.cash_percentage) / Decimal('100')
            self.bank_transfer_amount = (self.net_salary * self.bank_transfer_percentage) / Decimal('100')
        
        # Round to 2 decimal places
        self.cash_amount = self.cash_amount.quantize(Decimal('0.01'))
        self.bank_transfer_amount = self.bank_transfer_amount.quantize(Decimal('0.01'))

    def validate_incentives(self):
        """Validate that incentives are only allowed when worked days > 28"""
        # Convert to Decimal for comparison
        worked_days_decimal = Decimal(str(self.worked_days))
        spr_amount_decimal = Decimal(str(self.spr_amount))
        
        if worked_days_decimal <= Decimal('28') and spr_amount_decimal > Decimal('0'):
            raise ValueError(f"Incentives are only allowed when worked days > 28. Current worked days: {self.worked_days}")

    def create_expenses(self):
        """Create expense records for salary payments"""
        from .expense import Expense
        
        # Delete any existing expense records for this payroll
        Expense.objects.filter(payroll=self).delete()
        
        # Create expense for cash payment if amount > 0
        if self.cash_amount > Decimal('0'):
            Expense.objects.create(
                date=self.salary_date,
                category='Salary',
                description=f"Salary payment to {self.employee_name} - Cash portion",
                unit_price=self.cash_amount,
                quantity=Decimal('1'),
                unit='person',
                total_amount=self.cash_amount,
                payment_method='Cash',
                payroll=self,
                employee_name=self.employee_name
            )
        
        # Create expense for bank transfer if amount > 0
        if self.bank_transfer_amount > Decimal('0'):
            Expense.objects.create(
                date=self.salary_date,
                category='Salary',
                description=f"Salary payment to {self.employee_name} - Bank Transfer portion",
                unit_price=self.bank_transfer_amount,
                quantity=Decimal('1'),
                unit='person',
                total_amount=self.bank_transfer_amount,
                payment_method='Bank Transfer',
                payroll=self,
                employee_name=self.employee_name
            )
        
        self.expenses_created = True
        self.save(update_fields=['expenses_created'])

    def save(self, *args, **kwargs):
        # Set month and year from salary_date if not set
        if not self.month or not self.year:
            self.month = self.salary_date.month
            self.year = self.salary_date.year
        
        # Calculate worked days from attendance
        self.worked_days = self.calculate_worked_days()
        
        # Validate incentives based on worked days
        try:
            self.validate_incentives()
        except ValueError as e:
            # Re-raise the error to be caught by the view
            raise e
        
        # Calculate salary and payment splits
        self.calculate_salary()
        
        # Set record_state to active if not set
        if not self.record_state:
            self.record_state = 'active'
        
        # Mark as paid if creating new payroll
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Create expenses after saving (for new payrolls)
        if is_new and self.net_salary > Decimal('0'):
            self.create_expenses()
    
    def soft_delete(self):
        # Soft delete related attendance records
        from .attendance import Attendance
        
        # Get all attendance records for this payroll
        attendance_records = Attendance.all_objects.filter(payroll=self)
        
        # Soft delete each attendance record
        for attendance in attendance_records:
            attendance.soft_delete()
        
        # Soft delete related expenses
        from .expense import Expense
        
        for expense in self.expenses.all():
            expense.soft_delete()
        
        # Call parent soft_delete method
        super().soft_delete()

    def restore(self):
        """Restore a soft deleted payroll record and cascade restore expenses"""
        # Restore the payroll record first
        self.record_state = 'active'
        self.deleted_at = None
        self.save()
        
        # Restore related attendance records
        from .attendance import Attendance
        
        # Get all deleted attendance records for this payroll
        deleted_attendances = Attendance.all_objects.filter(
            payroll=self,
            record_state='deleted'
        )
        
        # Restore each attendance record
        for attendance in deleted_attendances:
            attendance.record_state = 'active'
            attendance.deleted_at = None
            attendance.save()
        
        # Restore related expenses
        from .expense import Expense
        
        # Get all deleted expense records for this payroll
        deleted_expenses = Expense.all_objects.filter(
            payroll=self,
            record_state='deleted'
        )
        
        # Restore each expense record
        for expense in deleted_expenses:
            expense.restore()
        
        # Recreate expenses if none exist
        if not self.expenses_created or not self.expenses.exists():
            self.create_expenses()