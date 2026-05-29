import paramiko
import sys

host = "192.168.28.15"
port = 10000
user = "root"
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=10)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err:
        print(f"[STDERR] {err}")

# 1. Check all containers
print("=== Docker Containers ===")
run("docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'")

# 2. Find teslamate compose file location
print("\n=== Finding docker-compose.yml ===")
run("find /home -name 'docker-compose.yml' -path '*teslamate*' 2>/dev/null")
run("find /home -name 'docker-compose.yml' -path '*compose*' 2>/dev/null | head -20")

# 3. Check mosquitto logs
print("\n=== Mosquitto Container Logs ===")
run("docker logs teslamate-mosquitto-1 2>&1 | tail -20")

client.close()
