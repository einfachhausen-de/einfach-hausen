#!/usr/bin/env bash
set -euo pipefail
cd /srv/einfach-hausen
test "$(git branch --show-current)" = main
python3 -m venv /home/ubuntu/services/laya-eh/.venv
/home/ubuntu/services/laya-eh/.venv/bin/python -m pip install --no-cache-dir -r services/laya/requirements.txt
# Secrets stay on the host; never echo them or place them in Git.
sudo python3 - <<'PY'
from pathlib import Path
import os, secrets, shutil, time
service = Path('/etc/einfach-hausen-laya.env')
app = Path('/etc/einfach-hausen.env')
if not app.exists(): raise SystemExit('App environment missing')
existing = dict(line.split('=',1) for line in service.read_text().splitlines() if '=' in line and not line.startswith('#')) if service.exists() else {}
key = existing.get('LAYA_API_KEY') or secrets.token_hex(32)
if len(key) < 32: raise SystemExit('Existing Laya key too short; fix configuration')
revision = Path('/home/ubuntu/.cache/huggingface/hub/models--convaiinnovations--laya/refs/main')
model = '/home/ubuntu/.cache/huggingface/hub/models--convaiinnovations--laya/snapshots/' + revision.read_text().strip() if revision.exists() else 'convaiinnovations/laya'
service.write_text('LAYA_API_KEY='+key+'\nLAYA_MODEL_PATH='+model+'\n')
os.chmod(service,0o600)
old = app.read_text()
shutil.copy2(app, '/etc/einfach-hausen.env.before-laya-'+str(int(time.time())))
lines = [l for l in old.splitlines() if not l.startswith(('LAYA_API_KEY=', 'LAYA_URL='))]
app.write_text('\n'.join(lines)+'\nLAYA_URL=http://127.0.0.1:8097\nLAYA_API_KEY='+key+'\n')
os.chmod(app,0o600)
print('Laya environment configured; provider secrets unchanged')
PY
sudo install -m 0644 deploy/laya.service /etc/systemd/system/einfach-hausen-laya.service
sudo systemctl daemon-reload
sudo systemctl enable --now einfach-hausen-laya.service
# This installer never restarts the application. Use the normal release gate/deploy.
