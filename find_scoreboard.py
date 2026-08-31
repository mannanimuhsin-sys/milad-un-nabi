import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if "activeTab === 'SCOREBOARD'" in line or "currentScreen === 'DASHBOARD'" in line:
            print(f'{idx+1}: {line.strip()[:100]}')
