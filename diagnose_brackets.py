import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("=== Lines 6705-6735 ===")
for i in range(6704, 6735):
    print(f"{i+1}: {repr(lines[i])}")
