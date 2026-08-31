import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    lines = content.split('\n')

print(f"Total lines: {len(lines)}")

# Let's inspect scoreboard calculations, point calculations, and null safety
issues = []
for idx, line in enumerate(lines):
    # Check for unsafe JSON.parse without try-catch or on raw strings
    if 'JSON.parse' in line and 'try' not in line:
        # Check surrounding lines for try
        start = max(0, idx - 5)
        end = min(len(lines), idx + 5)
        surrounding = '\n'.join(lines[start:end])
        if 'try' not in surrounding:
            issues.append((idx + 1, 'Unsafe JSON.parse', line.strip()))

print(f"Potential unsafe JSON.parse count: {len(issues)}")
for line_no, issue_type, text in issues[:20]:
    print(f"Line {line_no}: [{issue_type}] {text[:100]}")
