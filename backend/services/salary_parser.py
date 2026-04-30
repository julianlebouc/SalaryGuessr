import re

def parse_salary(text):
    if not text:
        return None

    text_lower = text.lower()
    
    nums = re.findall(r"\d+(?:[.,]\d+)?", text.replace(" ", ""))
    vals = [float(n.replace(",", ".")) for n in nums]
    vals = [v for v in vals if 500 <= v <= 50000]
    
    if not vals:
        return None
    
    if len(vals) == 1:
        raw_value = vals[0]
    else:
        raw_value = sum(vals) / len(vals)
    
    is_annual = 'annuel' in text_lower or ' an ' in f" {text_lower} " or '/an' in text_lower
    is_monthly = 'mensuel' in text_lower or '/mois' in text_lower or 'par mois' in text_lower
    
    if is_annual and not is_monthly:
        return raw_value / 12
    
    elif is_monthly and not is_annual:
        return raw_value
    
    elif raw_value > 15000:
        return raw_value / 12
    
    return raw_value