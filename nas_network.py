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

# Stop and remove all
print("=== Removing all containers ===")
channel.send("echo loveZyw520 | sudo -S docker rm -f teslamate-teslamate-1 teslamate-grafana-1 teslamate-database-1 teslamate-mosquitto-1 2>&1\n")
recv_until("~$", timeout=15)

# Create a docker network
print("=== Creating docker network ===")
channel.send("echo loveZyw520 | sudo -S docker network create teslamate-net 2>&1 || true\n")
recv_until("~$", timeout=10)

# Start database on the network
print("=== Starting PostgreSQL 16 on network ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-database-1 --restart always --network teslamate-net -e POSTGRES_USER=teslamate -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=teslamate -v teslamate_teslamate-db:/var/lib/postgresql/data postgres:16 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# Wait for postgres to be ready
print("=== Waiting for PostgreSQL to start... ===")
time.sleep(5)
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-database-1 2>&1 | tail -5\n")
recv_until("~$", timeout=10)

# Start mosquitto on the network
print("=== Starting Mosquitto on network ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-mosquitto-1 --restart always --network teslamate-net -p 1883:1883 -v teslamate-docker_mosquitto-conf:/mosquitto/config -v teslamate-docker_mosquitto-data:/mosquitto/data eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=15)

# Start grafana on the network (use container name 'teslamate-database-1' as hostname)
print("=== Starting Grafana on network ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-grafana-1 --restart always --network teslamate-net -p 3000:3000 -e DATABASE_HOST=teslamate-database-1 -e DATABASE_PORT=5432 -e DATABASE_USER=teslamate -e DATABASE_PASS=secret -e DATABASE_NAME=teslamate -v teslamate_teslamate-grafana-data:/var/lib/grafana teslamate/grafana:latest 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# Start teslamate on the network (use container names)
print("=== Starting TeslaMate on network ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-teslamate-1 --restart always --cap-add NET_ADMIN --network teslamate-net -p 4000:4000 -e DATABASE_HOST=teslamate-database-1 -e DATABASE_PORT=5432 -e DATABASE_USER=teslamate -e DATABASE_PASS=secret -e DATABASE_NAME=teslamate -e MQTT_HOST=teslamate-mosquitto-1 -e MQTT_PORT=1883 -v /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/import:/app/import teslamate/teslamate:latest 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# Wait a bit and check
time.sleep(8)
print("=== Checking all containers ===")
channel.send("echo loveZyw520 | sudo -S docker ps 2>/dev/null\n")
recv_until("~$", timeout=10)

# Check teslamate logs
print("=== TeslaMate logs ===")
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-teslamate-1 2>&1 | tail -10\n")
recv_until("~$", timeout=10)

# Check postgres version
print("=== PostgreSQL version ===")
channel.send("echo loveZyw520 | sudo -S docker exec teslamate-database-1 psql -U teslamate -c 'SELECT version();' 2>&1\n")
recv_until("~$", timeout=10)

channel.close()
client.close()
print("\n=== DONE ===")
