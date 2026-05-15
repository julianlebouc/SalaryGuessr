import re

def parse_salary(text):
    """
    Extract and normalize a salary value from raw text.
    Handles annual/monthly/hourly detection and calculates the monthly equivalent.
    """
    if not text:
        return None

    text_lower = text.lower()
    
    # Remove "sur X mois" to avoid confusion with salary values
    # e.g., "Mensuel de 2000 Euros sur 13 mois" -> "Mensuel de 2000 Euros"
    clean_text = re.sub(r"sur\s*\d+(?:[.,]\d+)?\s*mois", "", text_lower)
    
    # Detect period
    is_hourly = any(k in text_lower for k in ['horaire', 'heure', '/h'])
    is_annual = any(k in text_lower for k in ['annuel', '/an', 'par an']) or ' an ' in f" {text_lower} "
    is_monthly = any(k in text_lower for k in ['mensuel', '/mois', 'par mois']) or ' mois ' in f" {text_lower} "
    
    # Normalize spaces: remove spaces between digits (e.g., "2 500" -> "2500")
    # but keep spaces between words and numbers (e.g., "CCN 66" -> "CCN 66")
    text_norm = re.sub(r"(\d)\s+(\d)", r"\1\2", clean_text)
    
    # Find numbers (supporting decimals with . or ,)
    # Using \b to ensure we don't catch numbers inside words like "CCN66"
    nums = re.findall(r"\b\d+(?:[.,]\d+)?\b", text_norm)
    all_vals = [float(n.replace(",", ".")) for n in nums]
    
    if not all_vals:
        return None

    has_currency = any(k in text_lower for k in ['euro', '€'])
    
    # Noise exclusion for technical codes
    if any(k in text_lower for k in ['ccn', 'convention', 'indice', 'grille']):
        # If it looks like a technical code, we REQUIRE a currency or clear period marker
        if not has_currency and not is_hourly and not is_annual and not is_monthly:
            return None

    is_net = bool(re.search(r"\bnet\b", text_lower))
    
    # Filter for realistic ranges
    # 1. Check for hourly if explicitly mentioned or if values are very low
    result = None
    if is_hourly or (not is_annual and not is_monthly and all(10 <= v <= 100 for v in all_vals)):
        # Safety: if no hourly keyword AND no currency, it's too risky to assume hourly (except for very specific ranges)
        if not is_hourly and not has_currency:
            # Maybe it's a False Positive like a date or a small code
            pass 
        else:
            vals = [v for v in all_vals if 10 <= v <= 100]
            if vals:
                avg_hourly = sum(vals) / len(vals)
                result = avg_hourly * 151.67
            
    # 2. Check for monthly/annual if hourly didn't match
    if result is None:
        vals = [v for v in all_vals if 400 <= v <= 100000]
        if vals:
            avg_val = sum(vals) / len(vals)
            
            # Heuristic: if value is high, assume annual regardless of tags
            if avg_val > 15000:
                result = avg_val / 12
            elif is_annual and not is_monthly:
                result = avg_val / 12
            else:
                result = avg_val

    # Apply net to brut conversion if needed
    if result is not None and is_net:
        result = result / 0.77

    return result
