import paramiko
import sys

host = "192.168.28.15"
port = 10000
user = "13331888081"
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=10)

def run(cmd, use_sudo=False):
    if use_sudo:
        # Use sudo with password via stdin
        full_cmd = f"echo '{password}' | sudo -S {cmd} 2>/dev/null"
    else:
        full_cmd = cmd
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=60)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err:
        print(f"[ERR] {err}")

# Try sudo docker
run("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'", use_sudo=True)

# Find compose files with sudo
run("find / -name 'docker-compose.yml' -path '*teslamate*' 2>/dev/null", use_sudo=True)
run("find / -name 'docker-compose.yml' -path '*compose*' 2>/dev/null | head -20", use_sudo=True)

# Check mosquitto logs
run("docker logs teslamate-mosquitto-1 2>&1 | tail -30", use_sudo=True)

# Check docker compose project dirs
run("ls -la /home/docker/compose/ 2>/dev/null", use_sudo=True)

client.close()
