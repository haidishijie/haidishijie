import paramiko
import sys

host = "192.168.28.15"
port = 10000
user = "13331888081"
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=10)

def run(cmd):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err:
        print(f"[ERR] {err}")

# 1. Check all containers
run("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'")

# 2. Find teslamate compose files
run("find /home -name 'docker-compose.yml' 2>/dev/null | head -20")

# 3. Check mosquitto logs
run("docker logs teslamate-mosquitto-1 2>&1 | tail -30")

# 4. Check 1883 port
run("ss -tlnp | grep 1883")

client.close()
