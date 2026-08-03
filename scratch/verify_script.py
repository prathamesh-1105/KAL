from pathlib import Path
import subprocess, os, re
text = Path('index.html').read_text(encoding='utf-8')
match = re.search(r'<script id="app-script">(.*?)</script>', text, re.S)
if not match:
    raise SystemExit('script block not found')
Path('scratch/tmp_check.js').write_text(match.group(1), encoding='utf-8')
proc = subprocess.run(['node', '--check', 'scratch/tmp_check.js'], capture_output=True, text=True)
print('returncode', proc.returncode)
print(proc.stdout)
print(proc.stderr)
os.remove('scratch/tmp_check.js')
