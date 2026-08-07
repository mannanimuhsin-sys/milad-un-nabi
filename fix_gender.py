with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 10880-10882 (1-indexed) = indices 10879-10881 (0-indexed)
# Replace these 3 lines with 4 improved lines
old_slice = lines[10879:10882]
print("OLD lines:")
for l in old_slice:
    print(repr(l))

new_lines = [
    "                              if (!entryFormGender || entryFormGender === 'COMMON') return true;\n",
    "                              const pt = (p.type || '').toUpperCase();\n",
    "                              if (pt.includes('COMMON') || (!pt.includes('BOY') && !pt.includes('GIRL'))) return true;\n",
    "                              return pt.includes((entryFormGender || '').toUpperCase());\n",
]

lines = lines[:10879] + new_lines + lines[10882:]

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("DONE: Entry Form gender filter fixed")
print(f"New total lines: {len(lines)}")
