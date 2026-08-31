import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if "from('students')" in line or 'from("students")' in line:
            print(f'{idx+1}: {line.strip()[:100]}')
