# 🚀 Snipio — VM Deployment Guide

This guide covers deploying Snipio on a Linux VM using Docker and Nginx.

Want the reusable pattern (how to deploy a *different* app on the same VM)? Read **[Docs/Deployment.md](Docs/Deployment.md)**.

Snipio is two processes behind one domain:

| Process | Container | Host port | Nginx |
|---|---|---|---|
| Next.js web app | `snipio-web` | **3002** | `/` |
| Socket.IO room server | `snipio-socket` | **3003** | `/socket.io/` |

These ports are chosen so they do **not** collide with the other apps on this VM:

| App | Container | Port |
|---|---|---|
| Prasikshan | `prasikshan-app` | 3000 |
| FinSense | `finsense-app` | 3001 |
| Snipio web | `snipio-web` | 3002 |
| Snipio socket | `snipio-socket` | 3003 |

---

## ⚡ Quick Redeploy (Already Set Up? Start Here)

> **Use this every time you push new code and want to redeploy on the VM.**
>
> Prefer the shared script from `~/aman`:
> ```bash
> cd ~/aman
> ./deploy.sh    # choose 3 = Snipio
> ```
>
> Manual steps are below if you want to run them yourself.

```bash
# SSH into your VM first
ssh user@your-vm-ip
cd ~/aman/Snipio   # adjust path if different
```

```bash
# 1. Pull latest code from GitHub
git pull origin main

# 2. ⚠️  Verify .env has production values (NEXT_PUBLIC_* are used at docker BUILD time)
grep -E "^PORT|^SOCKET_PORT|^NODE_ENV|^NEXT_PUBLIC_" .env
# Must show:
#   PORT=3002
#   SOCKET_PORT=3003
#   NODE_ENV=production
#   NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in
#   NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in

# 3. Stop and remove the old containers
docker stop snipio-web snipio-socket
docker rm snipio-web snipio-socket

# 4. Rebuild the Docker image with latest code
#    NEXT_PUBLIC_* must be passed as build-args (they are baked into the JS bundle)
docker build \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in \
  --build-arg NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in \
  -t snipio .

# 5. Start both containers (host network — ports 3002 and 3003 bind on the VM)
docker run -d \
  --name snipio-web \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  snipio web

docker run -d \
  --name snipio-socket \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  snipio socket

# 6. Drop dangling (old) images
docker image prune -f

# 7. Verify
docker logs snipio-web
docker logs snipio-socket
curl -I http://localhost:3002
curl -s http://localhost:3003/health
```

> If the build seems to use old cached code, force a full rebuild:
> ```bash
> docker build --no-cache \
>   --build-arg NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in \
>   --build-arg NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in \
>   -t snipio .
> ```

✅ Done. Visit **https://snipio.akt9802.in** — your new code is live.

### Docker Compose alternative (same result)

```bash
cd ~/aman/Snipio
git pull origin main
docker compose down
docker compose build
docker compose up -d
docker image prune -f
```

---

## Prerequisites

- Docker installed on your server
- Nginx installed on your server
- SSL certificate (Let's Encrypt)
- DNS A record: `snipio.akt9802.in` (and optionally `www.snipio.akt9802.in`) → your VM IP

| Requirement | Minimum Version |
|---|---|
| OS | Ubuntu 22.04 LTS (recommended) |
| Docker | 24.x+ (with Compose plugin) |
| RAM | 1 GB (2 GB recommended) |
| Disk | 5 GB free |
| Open Ports | 80, 443 (3002/3003 stay bound to localhost via host network) |

---

## 1️⃣ VM Setup — Install Docker

SSH into your VM and run the following commands (skip if Docker is already installed for FinSense / Prasikshan):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
```

Log out and back in, then verify:

```bash
docker --version
docker compose version
```

---

## 2️⃣ Clone the Repository

```bash
cd ~/aman
git clone https://github.com/akt9802/SnipGo.git Snipio
cd Snipio
```

If the repo is already cloned at `~/aman/Snipio`, just `cd` into it.

---

## 3️⃣ Configure Environment Variables

```bash
cp env.production.example .env
nano .env   # confirm the domain matches your DNS
```

Production `.env` must look like this:

```env
PORT=3002
SOCKET_PORT=3003
NODE_ENV=production

# Baked into the client JS at docker build time — must be the public HTTPS origin
NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in
NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in
```

> ⚠️ **Never commit your `.env` file to Git.** It is already in `.gitignore`.
>
> ⚠️ `NEXT_PUBLIC_*` are **build-time** variables. Changing them in `.env` and only restarting the container is not enough — you must **rebuild** the image.

---

## 4️⃣ Build Docker Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in \
  --build-arg NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in \
  -t snipio .
```

Or:

```bash
docker compose build
```

---

## 5️⃣ Run Docker Containers

```bash
docker run -d \
  --name snipio-web \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  snipio web

docker run -d \
  --name snipio-socket \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  snipio socket
```

Or:

```bash
docker compose up -d
```

> **Important:** `--network host` / `network_mode: host` shares the VM's network stack.
> The web app binds **3002** and the socket server binds **3003**.
> Do **not** add `-p 3002:3002` together with `--network host`.

One-container option (both processes inside `snipio-app`):

```bash
docker run -d \
  --name snipio-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  snipio all
```

The two-container setup is preferred (independent logs and restarts). `./deploy.sh` uses two containers.

---

## 6️⃣ Verify Deployment

```bash
docker ps

docker logs snipio-web
docker logs snipio-socket

curl -I http://localhost:3002
curl -s http://localhost:3003/health
# expected: {"ok":true,"rooms":0}
```

---

## 7️⃣ Configure Nginx

```bash
sudo cp ~/aman/Snipio/snipio.nginx.conf /etc/nginx/sites-available/snipio
sudo ln -sf /etc/nginx/sites-available/snipio /etc/nginx/sites-enabled/snipio
```

The committed config already includes the SSL server block. **Before** you have a certificate, use this HTTP-only file first (Certbot will add TLS):

```nginx
map $http_upgrade $snipio_connection {
    default upgrade;
    ''      close;
}

upstream snipio_web {
    server 127.0.0.1:3002;
    keepalive 64;
}

upstream snipio_socket {
    server 127.0.0.1:3003;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name snipio.akt9802.in www.snipio.akt9802.in;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss font/truetype font/opentype image/svg+xml;

    client_max_body_size 12M;

    location /socket.io/ {
        proxy_pass http://snipio_socket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $snipio_connection;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://snipio_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location /_next/static {
        proxy_pass http://snipio_web;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /sw.js {
        proxy_pass http://snipio_web;
        proxy_set_header Host $host;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
}
```

Enable and test:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8️⃣ Enable HTTPS with Let's Encrypt

Point DNS first:

```text
snipio.akt9802.in      A    <your-vm-ip>
www.snipio.akt9802.in  A    <your-vm-ip>
```

Then:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d snipio.akt9802.in -d www.snipio.akt9802.in
```

Certbot will auto-configure HTTPS and set up auto-renewal.

Visit **https://snipio.akt9802.in** in your browser.

---

## 9️⃣ Chrome / Edge extension (production)

The laptop extension talks to Socket.IO directly. After deploy, open the extension popup → **Advanced** → set Socket URL to:

```text
https://snipio.akt9802.in
```

Do **not** use `http://localhost:3001` on the VM.

---

## 🔄 Updating the App

Use `~/aman/deploy.sh` (option `3`) or the Quick Redeploy section at the top.

---

## 🛑 Stopping the App

```bash
docker stop snipio-web snipio-socket
docker rm snipio-web snipio-socket
```

To also remove the built image:

```bash
docker rmi snipio
```

Compose:

```bash
docker compose down
docker rmi snipio
```

---

## 🧹 Useful Commands

### Docker
```bash
docker logs -f snipio-web          # live Next.js logs
docker logs -f snipio-socket       # live Socket.IO logs
docker restart snipio-web snipio-socket
docker exec -it snipio-web sh
docker image prune -f              # remove old dangling images
docker system prune -f             # unused Docker resources
```

### Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🐛 Troubleshooting

### Container keeps restarting
```bash
docker logs snipio-web
docker logs snipio-socket
```
Check missing env vars or a port already in use.

### Port 3002 / 3003 already in use
```bash
sudo lsof -i :3002
sudo lsof -i :3003
```
FinSense uses **3001**, Prasikshan uses **3000**. Do not put Snipio on those ports.

### Tablets connect to the page but slides never arrive
Nginx is not proxying WebSockets, or `NEXT_PUBLIC_SOCKET_URL` was wrong **at build time**.

```bash
curl -I http://localhost:3003/health
sudo tail -f /var/log/nginx/error.log
```
Rebuild with the correct `--build-arg NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in`.

### Build using old cached code
```bash
docker build --no-cache \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in \
  --build-arg NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in \
  -t snipio .
```

### `.env` file not found
```bash
ls -la .env
# Must exist in the same directory where you run docker compose / docker run
```

### Nginx 502 Bad Gateway
```bash
docker ps
curl -I http://localhost:3002
curl -s http://localhost:3003/health
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate
```bash
sudo certbot certificates
sudo certbot renew
```
