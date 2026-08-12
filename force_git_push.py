import subprocess, sys

def run_cmd(cmd):
    res = subprocess.run(cmd, cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
    return f"CMD: {' '.join(cmd)}\nRETURNCODE: {res.returncode}\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}\n{'-'*50}\n"

output = ""
output += run_cmd(['git', 'status'])
output += run_cmd(['git', 'add', '-A'])
output += run_cmd(['git', 'commit', '-m', 'Update certificate right-side panel to Crescent MILAD FEST emblem and paintbrush watercolor ink-wash artwork'])
output += run_cmd(['git', 'push', 'origin', 'main'])
output += run_cmd(['git', 'log', '-n', '3', '--oneline'])

with open(r'd:\MILAD UN NABI\milad\git_push_status.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print("Status written to git_push_status.txt")
