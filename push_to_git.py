import subprocess

subprocess.run(['git', 'add', '-A'], cwd=r'd:\MILAD UN NABI\milad')
subprocess.run(['git', 'commit', '-m', 'Update certificate design with White Milad Fest Logo & Paint Brushes Artwork'], cwd=r'd:\MILAD UN NABI\milad')
p = subprocess.run(['git', 'push', 'origin', 'main'], cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)

print("Push Output:", p.stdout, p.stderr)
