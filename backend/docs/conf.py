import os
import sys
sys.path.insert(0, os.path.abspath('../..'))

project = 'SalaryGuessr Backend'
copyright = '2026, SalaryGuessr Team'
author = 'SalaryGuessr Team'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.githubpages',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', 'venv', '__pycache__']

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_logo = "_static/logo512.svg"

html_theme_options = {
    'logo_only': False,
    'display_version': True,
}
html_css_files = [
    'custom.css',
]

# Napoleon settings
napoleon_google_docstring = True
napoleon_numpy_docstring = False
