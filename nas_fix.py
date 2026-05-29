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

# Wait for prompt
recv_until("~$", timeout=5)

# 1. Try to start mosquitto directly with docker start
print("=== Attempting docker start mosquitto ===")
channel.send("echo loveZyw520 | sudo -S docker start teslamate-mosquitto-1 2>&1\n")
recv_until("~$", timeout=15)

# 2. Check if it started
channel.send("echo loveZyw520 | sudo -S docker ps -a --filter name=mosquitto 2>/dev/null\n")
recv_until("~$", timeout=10)

# 3. If still not running, try docker compose up
print("=== If still failing, try docker compose up -d ===")
channel.send("cd /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/ && echo loveZyw520 | sudo -S docker compose up -d mosquitto 2>&1\n")
recv_until("~$", timeout=30)

# 4. Check again
channel.send("echo loveZyw520 | sudo -S docker ps -a --filter name=mosquitto 2>/dev/null\n")
recv_until("~$", timeout=10)

# 5. Check logs
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-mosquitto-1 2>&1 | tail -20\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
