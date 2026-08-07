import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 464-476 (0-indexed) = the isGeneralProg useCallback block
# That's 13 lines (the blank line at 463, comments at 464-465, and code 466-475, closing at 476)
# From the output: lines 464-477 (1-indexed) = indices 463-476 (0-indexed) = 14 lines
lines_without = lines[:463] + lines[477:]

# Find where to insert - after categories useState
insert_after_idx = None
for i, line in enumerate(lines_without):
    if "const [categories, setCategories] = useState([]);" in line:
        insert_after_idx = i
        break

# Insert the isGeneralProg block after categories
insert_lines = [
    "\n",
    "  // Helper: check if a program belongs to the GENERAL category\n",
    "  // catid === -1 means explicitly saved as GENERAL (our sentinel value)\n",
    "  const isGeneralProg = useCallback((p) => {\n",
    "    if (!p) return false;\n",
    "    const pCatId = String(p.catid ?? p.catId ?? '');\n",
    "    if (pCatId === '-1' || pCatId === 'GENERAL') return true;\n",
    "    const catObj = categories.find(c => String(c.id) === pCatId);\n",
    "    if (catObj && (catObj.name || '').toLowerCase().includes('general')) return true;\n",
    "    return false;\n",
    "  }, [categories]);\n",
]

final_lines = lines_without[:insert_after_idx+1] + insert_lines + lines_without[insert_after_idx+1:]

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print(f"DONE: isGeneralProg moved to after categories state (line {insert_after_idx+1})")
print(f"Old line count: {len(lines)}, New line count: {len(final_lines)}")
