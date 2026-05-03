from bs4 import BeautifulSoup

def clean_html(text):
    """
    Remove HTML tags and normalize whitespace in a string.
    
    Args:
        text (str): The raw text potentially containing HTML.
        
    Returns:
        str: The cleaned plain text.
    """
    if not text:
        return ""
    return BeautifulSoup(text, "html.parser").get_text(" ", strip=True)