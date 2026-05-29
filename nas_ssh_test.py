import paramiko
import sys

host = "192.168.28.15"
port = 10000
password = "loveZyw520"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

for user in ["root", "admin", "zspace", "nasadmin", "user"]:
    try:
        client.connect(host, port=port, username=user, password=password, timeout=5)
        print(f"=== SUCCESS with user: {user} ===")
        stdin, stdout, stderr = client.exec_command("whoami && hostname", timeout=10)
        print(stdout.read().decode().strip())
        client.close()
        sys.exit(0)
    except Exception as e:
        print(f"Failed with {user}: {e}")
        try:
            client.close()
        except:
            pass

print("\nAll usernames failed.")
