import subprocess, sys

def run(cmd):
    p = subprocess.run(cmd, cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
    print("CMD:", cmd)
    print("STDOUT:", p.stdout[-400:] if len(p.stdout) > 400 else p.stdout)
    if p.stderr:
        print("STDERR:", p.stderr[-400:] if len(p.stderr) > 400 else p.stderr)
    return p.returncode

run(['npx', 'react-scripts', 'build'])
run(['git', 'add', '-A'])
run(['git', 'commit', '-m', 'Replace white calligraphy with App Logo Watermark inside green polygon banner v1.0.6'])
run(['git', 'push', 'origin', 'main'])

print("Deploy process finished.")
