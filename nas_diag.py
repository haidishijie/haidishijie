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

# 1. Docker ps (escape properly)
channel.send("echo loveZyw520 | sudo -S docker ps -a 2>/dev/null\n")
recv_until("~$", timeout=15)

# 2. Read the compose file
channel.send("echo loveZyw520 | sudo -S cat /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/docker-compose.yml 2>/dev/null\n")
recv_until("~$", timeout=10)

# 3. Mosquitto logs
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-mosquitto-1 2>&1 | tail -30\n")
recv_until("~$", timeout=10)

# 4. Check what images exist
channel.send("echo loveZyw520 | sudo -S docker images 2>/dev/null\n")
recv_until("~$", timeout=10)

# 5. Check if 1883 is in use
channel.send("echo loveZyw520 | sudo -S ss -tlnp 2>/dev/null | grep -E '1883|3000|4000'\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
