import re

def parse_salary(text):
    """
    Extract and normalize a salary value from raw text.
    Handles annual/monthly detection and calculates the monthly equivalent.
    
    Args:
        text (str): The raw salary description string (e.g., "30000 - 35000 EUR par an").
        
    Returns:
        float|None: The estimated monthly salary, or None if no valid value is found.
    """
    if not text:
        return None

    text_lower = text.lower()
    
    # Remove spaces and find numbers (supporting decimals with . or ,)
    nums = re.findall(r"\d+(?:[.,]\d+)?", text.replace(" ", ""))
    vals = [float(n.replace(",", ".")) for n in nums]
    
    # Filter for realistic salary ranges (e.g., 500 to 50000)
    vals = [v for v in vals if 400 <= v <= 50000]
    
    if not vals:
        return None
    
    # Average if a range is provided
    if len(vals) == 1:
        raw_value = vals[0]
    else:
        raw_value = sum(vals) / len(vals)
    
    # Detect period
    is_annual = 'annuel' in text_lower or ' an ' in f" {text_lower} " or '/an' in text_lower or 'par an' in text_lower
    is_monthly = 'mensuel' in text_lower or ' mois ' in text_lower or '/mois' in text_lower or 'par mois' in text_lower
    
    if is_annual and not is_monthly:
        return raw_value / 12
    
    elif is_monthly and not is_annual:
        return raw_value
    
    # Heuristic: if value is high, assume annual
    elif raw_value > 15000:
        return raw_value / 12
    
    return raw_value
