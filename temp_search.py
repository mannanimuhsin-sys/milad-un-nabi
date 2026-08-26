import re, sys
sys.stdout.reconfigure(encoding='utf-8')
f = open(r'd:\MILAD UN NABI\milad\src\App.js', 'r', encoding='utf-8')
code = f.read()
f.close()

# search for where result rows are saved with teamname field
# Look for code around the 'teamname' field being set in a result save
idx = 0
while True:
    idx = code.find('teamname', idx)
    if idx == -1:
        break
    ctx = code[max(0,idx-200):idx+400]
    if 'place' in ctx and ('progid' in ctx or 'grade' in ctx):
        print(f"\n=== pos {idx} teamname context ===")
        print(ctx)
        print()
    idx += 1

# Also find groupRegistrations members
idx2 = code.find('program_id')
print(f"\nFirst 'program_id' at: {idx2}")
print(code[idx2:idx2+600])
