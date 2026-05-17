from bs4 import BeautifulSoup
import re


def _mask_salary_text(text: str) -> str:
    """Mask numeric salary values in a text string.
    
    This function replaces ALL numeric digits with bullet characters to avoid 
    leaking salary information. Also masks 5 words left and right of 'smic' references.
    """
    if not text:
        return text
    
    # Mask SMIC context - 5 words left and right
    words = text.split()
    for i, word in enumerate(words):
        if 'smic' in word.lower():
            start = max(0, i - 5)
            end = min(len(words), i + 6)
            for j in range(start, end):
                words[j] = '•' * len(words[j])
    text = ' '.join(words)
    
    # Replace all numeric digits with bullet characters
    result = []
    for char in text:
        if char.isdigit():
            result.append('•')
        else:
            result.append(char)
    
    return ''.join(result)


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