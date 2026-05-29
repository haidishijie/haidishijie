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

# 1. Check all containers
channel.send("echo loveZyw520 | sudo -S docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null\n")
recv_until("~$", timeout=10)

# 2. Check teslamate main service logs (should be connected to mosquitto now)
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-teslamate-1 2>&1 | tail -15\n")
recv_until("~$", timeout=10)

# 3. Update docker-compose.yml to remove 9001 port
print("=== Updating docker-compose.yml to remove port 9001 ===")
# Use sed to remove the 9001 line
channel.send("echo loveZyw520 | sudo -S sed -i '/\"9001:9001\"/d' /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/docker-compose.yml 2>&1\n")
recv_until("~$", timeout=10)

# Verify
channel.send("echo loveZyw520 | sudo -S grep -A5 mosquitto /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/docker-compose.yml\n")
recv_until("~$", timeout=10)

# 4. Final check - all ports
channel.send("echo loveZyw520 | sudo -S ss -tlnp | grep -E '1883|3000|4000|5432' 2>/dev/null\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
