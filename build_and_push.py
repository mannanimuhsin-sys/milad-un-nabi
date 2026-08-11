import subprocess, sys

def run_step(cmd, desc):
    print(f"=== {desc} ===")
    p = subprocess.run(cmd, cwd=r'd:\MILAD UN NABI\milad', capture_output=True, text=True)
    print("STDOUT:", p.stdout[-500:] if len(p.stdout) > 500 else p.stdout)
    if p.stderr:
        print("STDERR:", p.stderr[-500:] if len(p.stderr) > 500 else p.stderr)
    return p.returncode

run_step(['npx', 'react-scripts', 'build'], "Building Production Bundle")
run_step(['git', 'add', '-A'], "Git Add All Files")
run_step(['git', 'commit', '-m', 'Auto-update certificate curved gold design for all devices (v1.0.5)'], "Git Commit")
run_step(['git', 'push', 'origin', 'main'], "Git Push to Main")

print("Build and push process completed!")
