import re

with open('src/App.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

subtabs = set(re.findall(r"set[A-Za-z0-9_]*Tab\(['\"]([^'\"]+)['\"]", content))
print('Subtabs:', sorted(list(subtabs)))

subviews = set(re.findall(r"set[A-Za-z0-9_]*View\(['\"]([^'\"]+)['\"]", content))
print('Subviews:', sorted(list(subviews)))

substeps = set(re.findall(r"set[A-Za-z0-9_]*Step\(['\"]([^'\"]+)['\"]", content))
print('Substeps:', sorted(list(substeps)))

# Let's search for words like 'progress' (case-insensitive) or Malayalam words
matches = []
for i, line in enumerate(content.split('\n')):
    if any(k in line for k in ['ക്ലാസ്', 'ക്വിസ്', 'അസൈൻമെന്റ്', 'പ്രോഗ്രസ്', 'പരീക്ഷ', 'എക്സാം', 'classes', 'quiz', 'assignment', 'exam', 'progress', 'portal']):
        matches.append((i+1, line.strip()[:100]))

print(f"Total keyword matches: {len(matches)}")
for m in matches[:50]:
    print(f"L{m[0]}: {m[1]}")
