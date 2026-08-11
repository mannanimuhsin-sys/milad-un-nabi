import subprocess, sys

def run(cmd):
    p = subprocess.run(cmd, cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
    print("STDOUT:", p.stdout)
    print("STDERR:", p.stderr)
    return p.returncode

run(['git', 'add', 'src/App.js', 'test_cert.html'])
run(['git', 'commit', '-m', 'Update certificate side design with curved gold/green banner and ribbon badge'])
run(['git', 'push', 'origin', 'main'])
