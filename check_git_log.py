import subprocess
p = subprocess.run(['git', 'log', '-n', '5', '--oneline'], cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
print(p.stdout)
