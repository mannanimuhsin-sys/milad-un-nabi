import subprocess

p = subprocess.run(['git', 'push', 'origin', 'main'], cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
print("PUSH STDOUT:", p.stdout)
print("PUSH STDERR:", p.stderr)
