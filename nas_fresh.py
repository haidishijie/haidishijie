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

# 1. Stop database container
print("=== Stopping database ===")
channel.send("echo loveZyw520 | sudo -S docker stop teslamate-database-1 2>&1\n")
recv_until("~$", timeout=15)

# 2. Remove the old database volume and container
channel.send("echo loveZyw520 | sudo -S docker rm teslamate-database-1 2>&1\n")
recv_until("~$", timeout=10)

# 3. Remove old volume (PG15 data incompatible with PG16)
print("=== Removing old PG15 data volume ===")
channel.send("echo loveZyw520 | sudo -S docker volume rm teslamate_teslamate-db 2>&1\n")
recv_until("~$", timeout=10)

# 4. Start fresh database with PG16
print("=== Starting fresh PostgreSQL 16 ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-database-1 --restart always --network teslamate-net -e POSTGRES_USER=teslamate -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=teslamate -v teslamate_teslamate-db:/var/lib/postgresql/data postgres:16 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# Wait for PG to fully start
time.sleep(5)
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-database-1 2>&1 | tail -5\n")
recv_until("~$", timeout=10)

# 5. Restart teslamate to connect
print("=== Restarting TeslaMate ===")
channel.send("echo loveZyw520 | sudo -S docker restart teslamate-teslamate-1 2>&1\n")
recv_until("~$", timeout=15)

time.sleep(8)

# 6. Check all containers
print("=== All containers ===")
channel.send("echo loveZyw520 | sudo -S docker ps 2>/dev/null\n")
recv_until("~$", timeout=10)

# 7. Check teslamate logs
print("=== TeslaMate logs ===")
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-teslamate-1 2>&1 | tail -15\n")
recv_until("~$", timeout=15)

# 8. Check PG version
print("=== PG Version ===")
channel.send("echo loveZyw520 | sudo -S docker exec teslamate-database-1 psql -U teslamate -c 'SELECT version();' 2>&1\n")
recv_until("~$", timeout=10)

# 9. Test 4000 port
print("=== Testing TeslaMate web ===")
channel.send("curl -s -o /dev/null -w '%{http_code}' http://localhost:4000 2>&1\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
