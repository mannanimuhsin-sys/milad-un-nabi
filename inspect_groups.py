import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'd:\MILAD UN NABI\milad\src\App.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Look for fetch of groupRegistrations
matches = [m.start() for m in re.finditer(r"group_registrations", code)]
print(f"Total group_registrations occurrences: {len(matches)}")
for m in matches[:10]:
    print(f"\n--- pos {m} ---")
    print(code[max(0, m-100):m+400])
