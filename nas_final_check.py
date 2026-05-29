import paramiko
import sys, time

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

# Wait 15 seconds for PG to fully start
print("=== Waiting 15s for PG to be ready... ===")
time.sleep(15)

# Check PG status
print("=== PG Status ===")
channel.send("echo loveZyw520 | sudo -S docker ps --filter name=database 2>/dev/null\n")
recv_until("~$", timeout=10)

# PG version
print("=== PG Version ===")
channel.send("echo loveZyw520 | sudo -S docker exec teslamate-database-1 psql -U teslamate -c 'SELECT version();' 2>&1\n")
recv_until("~$", timeout=10)

# Check teslamate logs
print("=== TeslaMate logs ===")
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-teslamate-1 2>&1 | tail -15\n")
recv_until("~$", timeout=10)

# Test web
print("=== Testing TeslaMate web ===")
channel.send("curl -s -o /dev/null -w '%{http_code}' http://localhost:4000 2>&1\n")
recv_until("~$", timeout=10)

# Test Grafana
print("=== Testing Grafana web ===")
channel.send("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1\n")
recv_until("~$", timeout=10)

# All containers
print("=== All containers ===")
channel.send("echo loveZyw520 | sudo -S docker ps 2>/dev/null\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
