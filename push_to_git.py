import subprocess

subprocess.run(['git', 'add', '-A'], cwd=r'd:\MILAD UN NABI\milad')
subprocess.run(['git', 'commit', '-m', 'Auto-update certificate curved gold side design v1.0.5 for all devices'], cwd=r'd:\MILAD UN NABI\milad')
p = subprocess.run(['git', 'push', 'origin', 'main'], cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)

print("Push Output:", p.stdout, p.stderr)
