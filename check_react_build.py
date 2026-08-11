import subprocess, sys

def check_syntax():
    file_path = r'd:\MILAD UN NABI\milad\src\App.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Basic tag matching check for SVG and JSX
    open_svg = code.count('<svg')
    close_svg = code.count('</svg>')
    
    print(f"SVG Tags count -> open: {open_svg}, close: {close_svg}")
    
    if open_svg != close_svg:
        print("WARNING: Mismatched SVG tags!")
    else:
        print("All SVG tags are perfectly balanced!")

check_syntax()
