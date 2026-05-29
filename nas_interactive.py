import paramiko
import sys

host = "192.168.28.15"
port = 10000
user = "13331888081"
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=user, password=password, timeout=10)

# Use invoke_shell for interactive sudo
channel = client.invoke_shell()
channel.settimeout(10)

def recv_until(prompt, timeout=5):
    import time
    buf = ""
    start = time.time()
    while time.time() - start < timeout:
        try:
            data = channel.recv(4096).decode()
            if data:
                buf += data
                print(data, end='', flush=True)
                if prompt in buf:
                    return buf
        except:
            pass
    return buf

# Wait for shell prompt
recv_until("$", timeout=5)

# Try sudo with -S (read password from stdin)
cmd = f"echo '{password}' | sudo -S docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'\n"
channel.send(cmd)
recv_until("$", timeout=15)

# Find compose files
cmd = f"echo '{password}' | sudo -S find / -name 'docker-compose.yml' -path '*teslamate*' 2>/dev/null\n"
channel.send(cmd)
recv_until("$", timeout=15)

# Check compose dir
cmd = f"echo '{password}' | sudo -S ls -la /home/docker/compose/ 2>/dev/null\n"
channel.send(cmd)
recv_until("$", timeout=10)

# Mosquitto logs
cmd = f"echo '{password}' | sudo -S docker logs teslamate-mosquitto-1 2>&1 | tail -30\n"
channel.send(cmd)
recv_until("$", timeout=15)

channel.close()
client.close()
print("\n=== DONE ===")
