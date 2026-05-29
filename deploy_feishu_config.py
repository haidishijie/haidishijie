#!/usr/bin/env python3
"""一键配置飞书通道到 openclaw - 无需外部依赖"""

import json
import base64
import subprocess
import time
import sys

NAS_IP = '192.168.28.15'
SSH_PORT = 10000
SSH_USER = '13331888081'
SSH_PASS = 'loveZyw520'

APP_ID = 'cli_aa9255d2d439dbdb'
APP_SECRET = 'ogD4i0thCPQyQSf8YHhZ9gKWfwTQBnJm'

SUDO = f'echo "{SSH_PASS}" | sudo -S'

def ssh(cmd, timeout=15):
    """通过 SSH 执行命令（使用系统自带的 sshpass 或 ssh）"""
    full_cmd = f'sshpass -p "{SSH_PASS}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p {SSH_PORT} {SSH_USER}@{NAS_IP} "{cmd}"'
    try:
        r = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        # sshpass 没装，用 expect 方式不行的话，试试直接 ssh
        pass
    
    # fallback: 直接用 ssh 带 batch 模式
    full_cmd = f'ssh -o StrictHostKeyChecking=no -o BatchMode=no -o ConnectTimeout=10 -p {SSH_PORT} {SSH_USER}@{NAS_IP} "{cmd}"'
    try:
        r = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=timeout, 
                          input=f"{SSH_PASS}\n")
        return r.stdout.strip(), r.stderr.strip()
    except Exception as e:
        return '', str(e)

def main():
    print('🔗 正在连接 NAS...')
    
    # 1. 读取当前配置
    cmd = f'''{SUDO} docker exec appstore_openclaw cat /home/node/.openclaw/openclaw.json'''
    out, err = ssh(cmd)
    if not out:
        print(f'❌ 连接失败: {err[:200]}')
        print('  请确认 NAS 已开机且网络可达')
        sys.exit(1)
    
    try:
        config = json.loads(out)
    except json.JSONDecodeError:
        print('❌ 配置解析失败')
        sys.exit(1)
    
    print('✅ 已连接，配置读取成功')
    
    # 2. 添加飞书通道
    config['channels'] = config.get('channels', {})
    config['channels']['feishu'] = {
        'appId': APP_ID,
        'appSecret': APP_SECRET,
        'connectionMode': 'websocket',
        'dm': {'enabled': True},
        'groups': {'policy': 'open'}
    }
    
    # 3. 写回容器
    new_config = json.dumps(config, indent=2, ensure_ascii=False)
    encoded = base64.b64encode(new_config.encode()).decode()
    
    write_cmd = f'''{SUDO} docker exec -i appstore_openclaw sh -c "echo {encoded} | base64 -d > /home/node/.openclaw/openclaw.json"'''
    _, err = ssh(write_cmd)
    if err and 'password' not in err.lower():
        print(f'⚠️ 写入警告: {err[:200]}')
    
    print('✅ 配置已写入')
    
    # 4. 重启
    print('🔄 重启 openclaw...')
    restart_cmd = f'{SUDO} docker restart appstore_openclaw'
    ssh(restart_cmd)
    time.sleep(5)
    
    # 5. 验证
    status_cmd = f'{SUDO} docker ps --filter name=appstore_openclaw --format "{{{{.Names}}}} {{{{.Status}}}}"'
    out, _ = ssh(status_cmd)
    print(f'📊 {out}')
    
    logs_cmd = f'{SUDO} docker logs appstore_openclaw --tail 10 2>&1'
    out, _ = ssh(logs_cmd)
    if 'feishu' in out.lower():
        print('✅ 飞书通道连接成功！')
    
    print()
    print('🎉 全部完成！去飞书给机器人发消息试试吧')
    print('   发送 "车况"、"充电"、"行程" 即可查询车辆数据')

if __name__ == '__main__':
    main()
