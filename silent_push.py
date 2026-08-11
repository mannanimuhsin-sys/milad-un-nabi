import subprocess, os

with open(r'd:\MILAD UN NABI\milad\push_log.txt', 'w', encoding='utf-8') as log_file:
    log_file.write("Starting silent push...\n")
    
    # Git add
    p1 = subprocess.run(['git', 'add', '-A'], cwd=r'd:\MILAD UN NABI\milad', stdout=log_file, stderr=log_file)
    
    # Git commit
    p2 = subprocess.run(['git', 'commit', '-m', 'Force update certificate design v1.0.6'], cwd=r'd:\MILAD UN NABI\milad', stdout=log_file, stderr=log_file)
    
    # Git push
    p3 = subprocess.run(['git', 'push', 'origin', 'main'], cwd=r'd:\MILAD UN NABI\milad', stdout=log_file, stderr=log_file)
    
    # Git log
    p4 = subprocess.run(['git', 'log', '-n', '3', '--oneline'], cwd=r'd:\MILAD UN NABI\milad', stdout=log_file, stderr=log_file)

print("Finished silent_push script.")
