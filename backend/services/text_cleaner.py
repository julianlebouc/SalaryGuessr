from bs4 import BeautifulSoup
import re


def _mask_salary_text(text: str) -> str:
    """Mask numeric salary values in a text string.

    This function replaces numeric sequences that appear next to currency
    symbols/words (€, euro, euros, eur) or salary-related tokens ("par mois", "/mois",
    "mensuel") with bullet characters to avoid leaking salary information.
    """
    if not text:
        return text

    # Number pattern: handles groups like "1 200", "1.200", "1200", "1200,50"
    number_pat = r"\d{1,3}(?:[ \u00A0.\u202F]\d{3})*(?:[.,]\d+)?|\d+"

    def _repl(m):
        s = m.group(0)
        return "•" * len(s)

    # Mask numbers that are followed by a currency token (e.g., "1200 €", "1200 euros")
    text = re.sub(rf'({number_pat})(?=\s*(?:€|euros?|euro|eur))', _repl, text, flags=re.IGNORECASE)

    # Mask numbers that come after a currency symbol (e.g., "€1200")
    text = re.sub(rf'(?<=€)\s*({number_pat})', _repl, text, flags=re.IGNORECASE)

    # Mask numbers followed by salary period tokens (e.g., "1200 par mois", "1200 /mois")
    text = re.sub(rf'({number_pat})(?=\s*(?:/mois|par mois|mensuel|mensuelle))', _repl, text, flags=re.IGNORECASE)

    return text


def clean_html(text):
    """
    Remove HTML tags, normalize whitespace, and mask salary numbers.

    Args:
        text (str): The raw text potentially containing HTML.

    Returns:
        str: The cleaned plain text with salary numbers masked.
    """
    if not text:
        return ""

    plain = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
    return _mask_salary_text(plain)