with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# handleSaveProgEdit fix: lines 2591-2596 (0-indexed: 2590-2595)
# Replace the genCat.id lookup with always -1 for GENERAL
for i in range(2589, 2598):
    print(f'{i+1}: {repr(lines[i])}')

# Lines to replace (0-indexed 2590-2595):
# 2591: '    if (String(dbCatId).toUpperCase() === ...
# 2592:       const genCat = ...
# 2593:       if (genCat) dbCatId = genCat.id;
# 2594:       else dbCatId = -1;
# 2595:     }
new_lines_sedit = [
    "    // GENERAL programs always get catid = -1 (sentinel value)\n",
    "    if (String(dbCatId).toUpperCase() === 'GENERAL' || isNaN(parseInt(dbCatId, 10))) {\n",
    "      dbCatId = -1;\n",
    "    }\n",
]

# old block is lines[2591:2596] (5 lines: if(...) { genCat... if genCat... else... })
# Find exact position
found = None
for i in range(2589, 2600):
    if "String(dbCatId).toUpperCase() === 'GENERAL'" in lines[i] and 'genCat' in lines[i+1]:
        found = i
        break

if found is not None:
    print(f"\nFound at line {found+1}")
    # Replace the 5-line block (if...) with the 4-line block
    old_block = lines[found:found+5]
    print("OLD:")
    for l in old_block:
        print(repr(l))
    lines = lines[:found] + new_lines_sedit + lines[found+5:]
    with open('src/App.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("DONE: handleSaveProgEdit fixed")
else:
    print("NOT FOUND")
