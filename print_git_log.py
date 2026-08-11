import subprocess
p = subprocess.run(['git', 'log', '-n', '3', '--oneline'], cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
with open(r'd:\MILAD UN NABI\milad\git_log_out.txt', 'w') as f:
    f.write(p.stdout + "\nERR:\n" + p.stderr)
print("Saved to git_log_out.txt")
