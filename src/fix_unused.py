import sys

with open('App.js', 'r', encoding='utf-8', errors='surrogateescape') as f:
    content = f.read()

old_block = """                                 approvedFiltered.map(s => {
                                   const sTeamId = s.teamid || s.teamId || '';
                                   const sCatId = s.catid || s.catId || '';
                                   const teamObj = teams.find(t => String(t.id) === String(sTeamId));
                                   const catObj = categories.find(c => String(c.id) === String(sCatId));

                                   return ("""

new_block = """                                 approvedFiltered.map(s => {
                                   return ("""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Replaced with LF endings")
elif old_block.replace('\\n', '\\r\\n') in content:
    content = content.replace(old_block.replace('\\n', '\\r\\n'), new_block.replace('\\n', '\\r\\n'))
    print("Replaced with CRLF endings")
else:
    # Try custom replace
    lines = content.splitlines()
    found = -1
    for i, line in enumerate(lines):
        if "approvedFiltered.map(s => {" in line and i + 4 < len(lines):
            if "const sTeamId" in lines[i+1] and "const sCatId" in lines[i+2]:
                found = i
                break
    if found != -1:
        print(f"Found block starting at line {found}")
        # remove 4 lines after lines[found]
        del lines[found+1:found+5]
        content = '\\n'.join(lines)
        print("Removed lines successfully")
    else:
        print("Block not found")

with open('App.js', 'w', encoding='utf-8', errors='surrogateescape') as f:
    f.write(content)
