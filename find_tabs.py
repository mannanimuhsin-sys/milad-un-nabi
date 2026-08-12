import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
targets = ["activeTab === 'RESULTS'", "activeTab === 'TIMETABLE'", "activeTab === 'PROFILE'", "activeTab === 'REGISTRATION'", "activeTab === 'MASTER_SETTINGS'"]
for t in targets:
    for i, line in enumerate(lines):
        if t in line and '&&' in line and 'isInitialDataLoading' not in line:
            print(f'{i+1}: {repr(line[:120])}')
