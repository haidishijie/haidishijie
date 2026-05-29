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

# 1. What's using port 9001?
channel.send("echo loveZyw520 | sudo -S ss -tlnp | grep 9001\n")
recv_until("~$", timeout=10)

# 2. What's using port 1883?
channel.send("echo loveZyw520 | sudo -S ss -tlnp | grep 1883\n")
recv_until("~$", timeout=10)

# 3. Remove mosquitto container and recreate without 9001
print("=== Remove old mosquitto container ===")
channel.send("echo loveZyw520 | sudo -S docker rm -f teslamate-mosquitto-1 2>&1\n")
recv_until("~$", timeout=10)

# 4. Run mosquitto manually without 9001 port
print("=== Run mosquitto without port 9001 ===")
channel.send("echo loveZyw520 | sudo -S docker run -d --name teslamate-mosquitto-1 --restart always -p 1883:1883 -v teslamate-docker_mosquitto-conf:/mosquitto/config -v teslamate-docker_mosquitto-data:/mosquitto/data eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf 2>&1\n")
recv_until("~$", timeout=15)

# 5. Check if running
channel.send("echo loveZyw520 | sudo -S docker ps -a --filter name=mosquitto 2>/dev/null\n")
recv_until("~$", timeout=10)

# 6. Check logs
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-mosquitto-1 2>&1 | tail -10\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
