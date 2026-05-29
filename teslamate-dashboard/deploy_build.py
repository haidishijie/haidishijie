"""Deploy built dashboard to NAS.
Usage: python deploy_build.py
"""
import paramiko, base64, gzip, time, os

DIST = 'C:/Users/user/WorkBuddy/2026-05-22-13-57-30/teslamate-dashboard/dist'
DEPLOY = '/tmp/zfsv3/sata11/13331888081/data/teslamate-dashboard'

# Files to deploy
files = [
    'index.html',
    'assets/index-YuUxHpB6.js',
    'assets/index-De7YrBju.css',
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.28.15', port=10000, username='13331888081', password='loveZyw520', timeout=10)

for rel_path in files:
    local_path = os.path.join(DIST, rel_path)
    remote_path = f'{DEPLOY}/dist/{rel_path}'
    
    with open(local_path, 'rb') as f:
        raw = f.read()
    
    # Compress with gzip
    compressed = gzip.compress(raw)
    b64_data = base64.b64encode(compressed).decode()
    
    print(f'{rel_path}: {len(raw)} bytes -> {len(b64_data)} b64 chars')
    
    # Ensure remote dir exists
    remote_dir = os.path.dirname(remote_path)
    ssh.exec_command(f'echo "loveZyw520" | sudo -S mkdir -p {remote_dir}', timeout=5)
    ssh.exec_command('echo "loveZyw520" | sudo -S rm -f /tmp/dp_b64 /tmp/dp_chunks/*', timeout=5)
    ssh.exec_command('echo "loveZyw520" | sudo -S mkdir -p /tmp/dp_chunks', timeout=5)
    
    # Write in chunks of 10000 chars
    for i in range(0, len(b64_data), 10000):
        chunk = b64_data[i:i+10000]
        part = i // 10000
        ssh.exec_command(f'echo "loveZyw520" | sudo -S bash -c "echo -n \\"{chunk}\\" > /tmp/dp_chunks/p{part:04d}"', timeout=10)
        time.sleep(0.05)
    
    # Concatenate, decode, decompress
    ssh.exec_command(f'echo "loveZyw520" | sudo -S bash -c "cat /tmp/dp_chunks/p* | base64 -d | gunzip > {remote_path} && chmod 644 {remote_path} && rm -rf /tmp/dp_chunks"', timeout=30)
    time.sleep(1)
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command(f'echo "loveZyw520" | sudo -S wc -c {remote_path}', timeout=10)
    actual = stdout.read().decode().strip()
    print(f'  -> {actual}')
    
    if str(len(raw)) not in actual:
        print(f'  ⚠️ SIZE MISMATCH! Expected ~{len(raw)}')

# Clean old JS files (keep only current hash)
ssh.exec_command(f'echo "loveZyw520" | sudo -S find {DEPLOY}/dist/assets -name "index-*.js" -not -name "index-C3MTrP4k.js" -delete', timeout=10)

# Restart
print('Restarting server...')
ssh.exec_command('echo "loveZyw520" | sudo -S pkill -f "node.*prod"', timeout=10)
time.sleep(2)
ssh.exec_command(f'echo "loveZyw520" | sudo -S bash {DEPLOY}/start.sh', timeout=5)
time.sleep(6)

# Test
stdin, stdout, stderr = ssh.exec_command('echo "loveZyw520" | sudo -S curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/', timeout=10)
http = stdout.read().decode().strip()
print(f'Home: HTTP {http}')

stdin, stdout, stderr = ssh.exec_command('echo "loveZyw520" | sudo -S curl -s http://localhost:9090/api/health', timeout=10)
print(f'API: {stdout.read().decode().strip()[:60]}')

ssh.close()
print('Done!')
