# fine/utils/period_utils.py
from datetime import datetime

def get_selected_period(request):
    """
    Get selected period from request query parameters.
    Returns (selected_date, selected_year, selected_month, period_str)
    """
    period_str = request.GET.get('period', '')
    
    if period_str:
        try:
            year_str, month_str = period_str.split('-')
            year = int(year_str)
            month = int(month_str)
            
            # Validate month
            if month < 1 or month > 12:
                raise ValueError("Invalid month")
                
            selected_date = datetime(year, month, 1)
            return selected_date, year, month, period_str
        except (ValueError, AttributeError):
            pass
    
    # Default to current month
    current_date = datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    period_str = f"{current_year}-{current_month:02d}"
    
    return current_date, current_year, current_month, period_str

def get_period_options(selected_year, selected_month):
    """
    Generate a list of month-year options for the dropdown.
    Shows last 12 months + current + next 3 months.
    """
    current_date = datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    
    options = []
    
    # Generate months: from 12 months ago to 3 months in future
    for offset in range(-12, 4):  # -12 to +3 (16 total months)
        # Calculate year and month
        total_months_from_current = current_month + offset
        year = current_year + (total_months_from_current - 1) // 12
        month = ((total_months_from_current - 1) % 12) + 1
        
        # Skip invalid months (just in case)
        if month < 1 or month > 12:
            continue
            
        # Create the option
        try:
            period_value = f"{year}-{month:02d}"
            display_text = f"{datetime(year, month, 1).strftime('%B')} {year}"
            is_selected = (year == selected_year and month == selected_month)
            
            options.append({
                'value': period_value,
                'text': display_text,
                'selected': is_selected
            })
        except ValueError:
            # Skip invalid date (like month 13)
            continue
    
    # Sort by year and month (most recent first)
    def sort_key(x):
        y, m = map(int, x['value'].split('-'))
        return (-y, -m)
    
    options.sort(key=sort_key)
    
    return options