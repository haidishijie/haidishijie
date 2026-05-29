# 🚀 TeslaMate × OpenClaw 交接文档

> 生成时间：2026-05-29 09:13（已更新 09:51）
> 交接人：主理人 Qi
> 项目路径：`C:\Users\user\WorkBuddy\2026-05-22-13-57-30\`

---

## 📋 项目概况

极空间 Z2 Pro NAS 上已部署完成：
- **TeslaMate** — 车辆数据采集 ✅
- **极客仪表盘** — 15 模块 + 通勤对比 ✅
- **OpenClaw（虾）** — 聊天机器人 + TeslaMate 技能 ✅

**当前状态：所有服务正常运行，只差飞书通道配置。**

---

## 🔗 NAS 连接信息

| 项 | 值 |
|---|-----|
| IP | `192.168.28.15` |
| SSH 端口 | `10000` |
| SSH 用户 | `13331888081` |
| SSH 密码 | `loveZyw520` |
| 架构 | aarch64 (ARM64) |

## 🏠 服务访问地址（仅局域网）

| 服务 | 地址 |
|------|------|
| TeslaMate | `http://192.168.28.15:4000` |
| Grafana | `http://192.168.28.15:3000` |
| 仪表盘 (直接) | `http://192.168.28.15:9090` |
| 仪表盘 (nginx) | `http://192.168.28.15:8045` |
| OpenClaw Web 面板 | `http://192.168.28.15:50001` |
| OpenClaw 面板 Token | `3f1c87942e5a5cbba390bd9839455d18afe0211809edfee6` |
| PostgreSQL | `127.0.0.1:5432` / 用户: `teslamate` / 密码: `secret` |

---

## 🐳 Docker 容器状态

| 容器名 | 网络 | 状态 |
|--------|------|:----:|
| `teslamate-teslamate-1` | `teslamate_default` | ✅ |
| `teslamate-database-1` | `teslamate_default` + `bridge` | ✅ 端口 5432 暴露 |
| `teslamate-grafana-1` | `teslamate_default` | ✅ |
| `teslamate-mosquitto-1` | `teslamate_default` | ✅ |
| `appstore_openclaw` | `bridge` + **`teslamate_default`** | ✅ |

**重要：** openclaw 已手动连接到 `teslamate_default` 网络，所以能通过容器名 `teslamate-database-1` 访问数据库。

---

## 📊 仪表盘部署

仪表盘运行在 NAS 宿主机上，不是 Docker 容器。

| 项 | 值 |
|------|------|
| 端口 | 9090 |
| Node.js | v22.22.2 linux-arm64 二进制，路径 `/tmp/.../teslamate-dashboard/node-runtime/` |
| 部署路径 | `/tmp/zfsv3/sata11/13331888081/data/teslamate-dashboard/` |
| 启动脚本 | `start.sh`（已设置 crontab @reboot 开机自启） |
| 源码路径（本地） | `C:\Users\user\WorkBuddy\2026-05-22-13-57-30\teslamate-dashboard\` |

### 仪表盘功能
- **路由**：`/` 主仪表盘（15 模块 + 可拖动布局）、`/commute` 通勤对比
- **API**：13 个 REST 端点，通过 Vite plugin 集成在 dev server 内
- **语言**：已全部中文化
- **锁定/拖动**：支持锁定布局

---

## 🦐 OpenClaw 集成详情

### 容器信息
```
容器名: appstore_openclaw
Node.js 版本: 24.14.0
pg 模块位置: /home/node/node_modules/pg/ （手动复制）
技能文件: /home/node/.openclaw/workspace/skills/teslamate.js
配置: /home/node/.openclaw/openclaw.json
```

### 已安装的技能（3 个命令）

| 命令 | 说明 | 后端 SQL 表 |
|------|------|------------|
| `车况` | 车辆当前状态：电量、续航、温度 | `positions` + `cars` |
| `充电` | 充电状态：功率、电压、已充入量 | `charging_processes` + `charges` |
| `行程` | 最近行程：路线、距离、时长 | `drives` + `addresses` + `geofences` |

### pg 模块来源
从仪表盘的 `node_modules/pg/` 复制到容器内 `/home/node/node_modules/pg/`。如果重启后模块丢了，需要重新复制：
```bash
sudo docker cp /tmp/zfsv3/sata11/13331888081/data/teslamate-dashboard/node_modules/pg appstore_openclaw:/home/node/node_modules/pg/
```

---

## ⏳ 待完成（已准备好，一键执行）

### 飞书应用配置 ✅ 已完成

| 项目 | 状态 |
|------|:----:|
| App ID: `cli_aa9255d2d439dbdb` | ✅ 已获取 |
| App Secret: `ogD4i0thCPQyQSf8YHhZ9gKWfwTQBnJm` | ✅ 已获取 |
| 机器人能力 | ✅ 已启用 |
| 消息权限 (`im:message`, `send_as_bot` 等) | ✅ 已开通 |
| 长连接 WebSocket 接收事件 | ✅ 已保存 |
| 接收消息事件 (`im.message.receive_v1`) | ✅ 已添加 |

### 最后一步：写入 NAS 配置

**另一台电脑的 WorkBuddy 打开本项目后，运行以下命令即可一键完成：**

```bash
cd C:\Users\user\WorkBuddy\2026-05-22-13-57-30
C:\Users\user\.workbuddy\binaries\python\versions\3.13.12\python.exe deploy_feishu_config.py
```

脚本会自动：
1. SSH 连入 NAS
2. 读取 openclaw.json
3. 写入飞书通道配置（App ID + App Secret + WebSocket 模式）
4. 重启 openclaw 容器
5. 验证连接状态

---

## 🐛 已知问题

1. **重启后 pg 模块可能丢失** — 需要重新从仪表盘 node_modules 复制
2. **nginx 反向代理配置不带 `$host` 头** — 不影响 HTTP 访问，但后续需要可以加上
3. **仪表盘数据从 0 开始** — TeslaMate 刚部署，需要开车几天积累行程数据

---

## 📝 关键命令速查

```bash
# 重启仪表盘
sudo /tmp/zfsv3/sata11/13331888081/data/teslamate-dashboard/start.sh

# 查看仪表盘日志
sudo cat /tmp/dashboard.log

# 查看 openclaw 日志
sudo docker logs appstore_openclaw --tail 30

# 查看 TeslaMate 数据库
sudo docker exec -it teslamate-database-1 psql -U teslamate -d teslamate

# 重新连接 openclaw 到 teslamate 网络（如果重建过容器）
sudo docker network connect teslamate_default appstore_openclaw

# 查看所有容器
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
