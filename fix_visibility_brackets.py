import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines before: {len(lines)}")

# Line 6830 (index 6829) currently is '                      })()\n'
# Change it back to '                      })()}\n'
lines[6829] = '                      })()}\n'

with open('src/App.js', 'w', encoding='utf-8', newline='') as f:
    f.writelines(lines)

print("Line 6830 fixed to })()}`")
