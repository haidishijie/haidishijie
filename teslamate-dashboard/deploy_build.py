"""Deploy built dashboard to NAS.
Usage: python deploy_build.py

For each file: writes base64 chunks (5KB) to NAS temp dir, then concatenates
and decodes. Uses 0.5s delay between chunks for reliability.
"""
import paramiko, base64, time, os, sys

DIST = 'C:/Users/user/WorkBuddy/2026-05-22-13-57-30/teslamate-dashboard/dist'
DEPLOY = '/tmp/zfsv3/sata11/13331888081/data/teslamate-dashboard'

# Files to deploy (auto-detected)
ASSETS_JS = ''
ASSETS_CSS = ''

def get_assets():
    for f in os.listdir(os.path.join(DIST, 'assets')):
        if f.startswith('index-') and f.endswith('.js'):
            globals()['ASSETS_JS'] = f
        elif f.startswith('index-') and f.endswith('.css'):
            globals()['ASSETS_CSS'] = f

get_assets()
files = ['index.html', f'assets/{ASSETS_JS}', f'assets/{ASSETS_CSS}'] if ASSETS_CSS else ['index.html', f'assets/{ASSETS_JS}']
print(f'Deploying: {files}')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.28.15', port=10000, username='13331888081', password='loveZyw520', timeout=10)

def ssh_out(cmd, timeout=10):
    """Run command, return stdout string."""
    _, stdout, _ = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

ok = True
for rel_path in files:
    local_path = os.path.join(DIST, rel_path)
    remote_path = f'{DEPLOY}/dist/{rel_path}'
    
    with open(local_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    
    print(f'{rel_path}: {len(b64)} b64 chars')
    
    # Ensure remote dir exists
    ssh.exec_command(f'echo "loveZyw520" | sudo -S mkdir -p {os.path.dirname(remote_path)}', timeout=5)
    ssh.exec_command('echo "loveZyw520" | sudo -S rm -rf /tmp/dp_c', timeout=5)
    time.sleep(0.5)
    ssh.exec_command('echo "loveZyw520" | sudo -S mkdir -p /tmp/dp_c', timeout=5)
    time.sleep(0.5)
    
    # Write chunks (5KB each, 0.5s between)
    for i in range(0, len(b64), 5000):
        chunk = b64[i:i+5000]
        part = i // 5000
        ssh.exec_command(f'echo "loveZyw520" | sudo -S bash -c "echo -n \\"{chunk}\\" > /tmp/dp_c/p{part:04d}"', timeout=10)
        time.sleep(0.5)
    
    # Verify chunk count
    cnt = int(ssh_out('echo "loveZyw520" | sudo -S ls /tmp/dp_c/ | wc -l') or 0)
    expected = (len(b64) + 4999) // 5000
    if cnt != expected:
        print(f'  ⚠️ Chunk count mismatch: {cnt}/{expected}, retrying...')
        ok = False
        continue
    
    # Concat
    ssh.exec_command('echo "loveZyw520" | sudo -S bash -c "cat /tmp/dp_c/p* > /tmp/rb64.bin && rm -rf /tmp/dp_c"', timeout=15)
    time.sleep(2)
    
    # Decode and write
    ssh.exec_command(f'echo "loveZyw520" | sudo -S bash -c "base64 -d /tmp/rb64.bin > {remote_path} && chmod 644 {remote_path}"', timeout=30)
    time.sleep(2)
    
    # Verify file
    result = ssh_out(f'echo "loveZyw520" | sudo -S wc -c {remote_path}')
    print(f'  -> {result}')

# Clean old JS files
if ASSETS_JS:
    ssh.exec_command(f'echo "loveZyw520" | sudo -S find {DEPLOY}/dist/assets -name "index-*.js" -not -name "{ASSETS_JS}" -delete', timeout=10)
if ASSETS_CSS:
    ssh.exec_command(f'echo "loveZyw520" | sudo -S find {DEPLOY}/dist/assets -name "index-*.css" -not -name "{ASSETS_CSS}" -not -name "index.css" -delete', timeout=10)

if ok:
    print('Restarting server...')
    ssh.exec_command('echo "loveZyw520" | sudo -S pkill -f "node.*prod"', timeout=10)
    time.sleep(2)
    ssh.exec_command(f'echo "loveZyw520" | sudo -S bash {DEPLOY}/start.sh', timeout=5)
    time.sleep(6)
    
    http = ssh_out('echo "loveZyw520" | sudo -S curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/')
    print(f'Dashboard: HTTP {http}')
else:
    print('⚠️ Upload had issues, server NOT restarted.')

ssh.close()
