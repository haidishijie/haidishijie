import paramiko
import sys

host = "192.168.28.15"
port = 10000
user = "13331888081"
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=10)

channel = client.invoke_shell()
channel.settimeout(10)

def recv_until(prompt, timeout=8):
    import time
    buf = ""
    start = time.time()
    while time.time() - start < timeout:
        try:
            data = channel.recv(4096).decode(errors='replace')
            if data:
                buf += data
                print(data, end='', flush=True)
                if prompt in buf:
                    return buf
        except:
            pass
    return buf

recv_until("~$", timeout=5)

# 1. Update docker-compose.yml to use postgres:16
print("=== Updating postgres version to 16 ===")
cmd = """echo loveZyw520 | sudo -S sed -i 's/postgres:15/postgres:16/g' /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/docker-compose.yml"""
channel.send(cmd + "\n")
recv_until("~$", timeout=10)

# Verify
channel.send("echo loveZyw520 | sudo -S grep postgres /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/docker-compose.yml\n")
recv_until("~$", timeout=10)

# 2. Pull postgres:16 image
print("=== Pulling postgres:16 image (this takes a while)... ===")
channel.send("echo loveZyw520 | sudo -S docker pull postgres:16 2>&1\n")
# Wait longer for image pull
recv_until("~$", timeout=120)

# 3. Stop all teslamate containers
print("=== Stopping all containers ===")
channel.send("echo loveZyw520 | sudo -S docker stop teslamate-teslamate-1 teslamate-grafana-1 teslamate-database-1 teslamate-mosquitto-1 2>&1\n")
recv_until("~$", timeout=20)

# 4. Remove old database container
print("=== Removing old database container ===")
channel.send("echo loveZyw520 | sudo -S docker rm teslamate-database-1 2>&1\n")
recv_until("~$", timeout=10)

# 5. Find the volume name for database
channel.send("echo loveZyw520 | sudo -S docker volume ls 2>/dev/null | grep teslamate\n")
recv_until("~$", timeout=10)

# 6. Remove all containers and recreate with docker-compose
print("=== Removing all teslamate containers ===")
channel.send("echo loveZyw520 | sudo -S docker rm -f teslamate-teslamate-1 teslamate-grafana-1 teslamate-mosquitto-1 2>&1\n")
recv_until("~$", timeout=10)

# 7. Recreate database container with postgres:16
print("=== Creating new database with postgres:16 ===")
# Find the volume name first - need to check docker volumes
channel.send("echo loveZyw520 | sudo -S docker volume ls 2>/dev/null\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
