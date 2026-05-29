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

# 1. Start database with postgres:16
print("=== Starting PostgreSQL 16 ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-database-1 --restart always -e POSTGRES_USER=teslamate -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=teslamate -v teslamate_teslamate-db:/var/lib/postgresql/data postgres:16 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=30)

# 2. Start mosquitto
print("=== Starting Mosquitto ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-mosquitto-1 --restart always -p 1883:1883 -v teslamate-docker_mosquitto-conf:/mosquitto/config -v teslamate-docker_mosquitto-data:/mosquitto/data eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=15)

# 3. Start grafana
print("=== Starting Grafana ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-grafana-1 --restart always -p 3000:3000 -e DATABASE_HOST=192.168.28.15 -e DATABASE_PORT=5432 -e DATABASE_USER=teslamate -e DATABASE_PASS=secret -e DATABASE_NAME=teslamate -v teslamate_teslamate-grafana-data:/var/lib/grafana --link teslamate-database-1:database teslamate/grafana:latest 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# 4. Start teslamate
print("=== Starting TeslaMate ===")
cmd = "echo loveZyw520 | sudo -S docker run -d --name teslamate-teslamate-1 --restart always --cap-add NET_ADMIN -p 4000:4000 -e DATABASE_HOST=192.168.28.15 -e DATABASE_PORT=5432 -e DATABASE_USER=teslamate -e DATABASE_PASS=secret -e DATABASE_NAME=teslamate -e MQTT_HOST=192.168.28.15 -e MQTT_PORT=1883 -v /tmp/zfsv3/sata11/13331888081/data/teslamate-docker/import:/app/import --link teslamate-database-1:database --link teslamate-mosquitto-1:mosquitto teslamate/teslamate:latest 2>&1"
channel.send(cmd + "\n")
recv_until("~$", timeout=20)

# 5. Check all containers
import time
time.sleep(5)
print("=== Checking all containers ===")
channel.send("echo loveZyw520 | sudo -S docker ps -a 2>/dev/null\n")
recv_until("~$", timeout=10)

# 6. Check teslamate logs
print("=== TeslaMate logs ===")
channel.send("echo loveZyw520 | sudo -S docker logs teslamate-teslamate-1 2>&1 | tail -15\n")
recv_until("~$", timeout=15)

channel.close()
client.close()
print("\n=== DONE ===")
