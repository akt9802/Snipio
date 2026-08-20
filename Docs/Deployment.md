# How We Deploy Apps on a Linux VM (Docker + Nginx)

This document explains the **deployment pattern** used for Snipio, FinSense, and Prasikshan. After reading it you should be able to put a **new Next.js (or Node) app** on the same VM with HTTPS.

Snipio-only copy-paste commands live in [`../DEPLOYMENT.md`](../DEPLOYMENT.md). This file is the *why* and the *template*.

Related docs: [Problem Statement](./ProblemStatement.md) · [Solution](./Solution.md) · [System Architecture](./System-Architecture.md) · [Step-by-Step Guide](./Step-By-Step-guide.md)

---

## 1. The mental model

Browsers must never talk to Node on a raw port (`:3002`). They talk to **Nginx on 443**. Nginx forwards to the app on localhost.

```
Internet
   │
   │  https://myapp.akt9802.in   (ports 80 / 443 only)
   ▼
┌──────────────────────────────────────────────┐
│  VM                                          │
│                                              │
│   Nginx  (reverse proxy + TLS)               │
│     ├── /              → 127.0.0.1:PORT      │
│     └── /socket.io/    → 127.0.0.1:SOCKET    │  (only if you have websockets)
│                                              │
│   Docker container(s)  --network host        │
│     └── Next.js / Node listening on PORT     │
└──────────────────────────────────────────────┘
```

| Layer | Job |
|---|---|
| **DNS** | Domain → VM IP |
| **Nginx** | TLS, gzip, headers, route `/` (and `/socket.io/`) to localhost |
| **Certbot** | Free Let's Encrypt certificates |
| **Docker** | Build a reproducible image, run the process, restart on crash |
| **`.env`** | Secrets and runtime config (never committed) |

Open on the firewall: **22, 80, 443**. App ports (3000, 3001, 3002, …) stay on the machine.

---

## 2. One VM, many apps

Each app gets:

1. Its **own domain** (or subdomain)
2. Its **own host port**
3. Its **own container name**
4. Its **own Nginx site** in `/etc/nginx/sites-available/`

Current layout on this server (`~/aman`):

| App | Domain | Container | Port |
|---|---|---|---|
| Prasikshan | `akt9802.in` | `prasikshan-app` | 3000 |
| FinSense | `finsense.akt9802.in` | `finsense-app` | 3001 |
| Snipio web | `snipio.akt9802.in` | `snipio-web` | 3002 |
| Snipio socket | same domain, path `/socket.io/` | `snipio-socket` | 3003 |
| **Your next app** | `yourapp.akt9802.in` | `yourapp-app` | **3004** (next free) |

Pick a port that `ss -tlnp` / `sudo lsof -i :PORT` shows as free.

---

## 3. Files every app needs

Put these in the **folder that contains `package.json`** (the Docker build context):

| File | Purpose |
|---|---|
| `Dockerfile` | How to install, build, and run |
| `.dockerignore` | Keep `node_modules`, `.git`, `.env` out of the build context |
| `docker-compose.yml` | Optional: named services, restart, healthcheck |
| `*.nginx.conf` | Copy to `/etc/nginx/sites-available/` |
| `.env.example` / `env.production.example` | What operators must fill in |
| `next.config.ts` → `output: "standalone"` | Required for the small Next.js image |

Plus on the VM, **once**, a script like `~/aman/deploy.sh`: git pull → build → replace container → prune old images.

---

## 4. Next.js production image (the important bits)

### 4.1 `output: "standalone"`

In `next.config.ts`:

```ts
const nextConfig = {
  output: "standalone",
};
```

`next build` then writes `.next/standalone/` — a folder with `server.js` and only the `node_modules` that server needs. The production image copies **that**, not the whole repo.

You must also copy:

- `.next/static` → `.next/static` (hashed JS/CSS)
- `public` → `public` (favicon, `sw.js`, images)

Without those, the HTML loads and assets 404.

### 4.2 Multi-stage Dockerfile (pattern)

```
Stage deps     → npm ci
Stage builder  → npm run build   (+ bundle extra servers if needed)
Stage runner   → copy standalone + static + public, run as non-root
```

Why three stages?

- Final image has **no** compiler, **no** source, **no** `npm`.
- Rebuilds are faster: deps layer is cached until `package-lock.json` changes.

Minimal runner CMD for a single Next.js app:

```dockerfile
ENV PORT=3004
ENV HOSTNAME="0.0.0.0"
EXPOSE 3004
CMD ["node", "server.js"]
```

`HOSTNAME=0.0.0.0` matters: Next.js otherwise binds `localhost` inside the container and Nginx cannot reach it. With `--network host` it still needs to listen on all interfaces.

### 4.3 Two processes in one image (Snipio-style)

Snipio is unusual: **Next.js + Socket.IO**. One image, `docker-entrypoint.sh` chooses:

- `web` → `node server.js`
- `socket` → `node socketServer.js`
- `all` → both (one container)

Prefer **two containers** from the same image (separate logs, independent restart). Use `all` only for a quick test.

A normal CRUD Next.js app does **not** need an entrypoint script. `CMD ["node", "server.js"]` is enough.

### 4.4 `NEXT_PUBLIC_*` are build-time

Anything named `NEXT_PUBLIC_...` is **inlined into the browser JS at `docker build`**. Changing `.env` and restarting the container does **nothing** for those variables. You must rebuild:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://yourapp.akt9802.in \
  -t yourapp .
```

In the Dockerfile:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
```

Secrets (`JWT_SECRET`, `MONGO_URI`, `SMTP_PASS`) stay **runtime-only** via `--env-file .env`. Never `ARG` them into the image.

---

## 5. How we run containers

### Host network (what this VM uses)

```bash
docker run -d \
  --name yourapp-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  yourapp
```

`--network host` = the process binds ports on the **VM itself**. Nginx `proxy_pass http://127.0.0.1:3004` works. So does Redis at `localhost:6379` (Prasikshan).

Do **not** add `-p 3004:3004` together with `--network host`. The port is already on the host.

`--restart unless-stopped` = reboot or crash brings the container back, unless you `docker stop` it on purpose.

### Redeploy flow (always this order)

1. `git pull`
2. `docker build -t yourapp .`  ← old container **still running** (users see the old version)
3. `docker stop yourapp-app && docker rm yourapp-app`
4. `docker run ...` (same flags as above)
5. `docker image prune -f`  ← delete the previous image that became “dangling”

If **build fails**, the old container is untouched. That is why we build *before* stop.

---

## 6. Nginx: one file per app

Ubuntu layout:

```
/etc/nginx/sites-available/yourapp    # the real config
/etc/nginx/sites-enabled/yourapp      # symlink
```

```bash
sudo ln -sf /etc/nginx/sites-available/yourapp /etc/nginx/sites-enabled/yourapp
sudo nginx -t
sudo systemctl reload nginx
```

### HTTP-only first (before SSL)

```nginx
upstream yourapp_web {
    server 127.0.0.1:3004;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourapp.akt9802.in www.yourapp.akt9802.in;

    client_max_body_size 10M;

    location / {
        proxy_pass http://yourapp_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }

    location /_next/static {
        proxy_pass http://yourapp_web;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Then:

```bash
sudo certbot --nginx -d yourapp.akt9802.in -d www.yourapp.akt9802.in
```

Certbot writes the `listen 443 ssl` block and the HTTP→HTTPS redirect.

### WebSockets (only if you have Socket.IO / similar)

```nginx
map $http_upgrade $yourapp_connection {
    default upgrade;
    ''      close;
}

upstream yourapp_socket {
    server 127.0.0.1:3005;
    keepalive 64;
}

location /socket.io/ {
    proxy_pass http://yourapp_socket;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $yourapp_connection;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_buffering off;
}
```

The browser then uses **the same HTTPS origin** (`https://yourapp.akt9802.in`). Do not expose `:3005` on the firewall.

On the client, Socket.IO should connect to `window.location.origin` in production (see `src/lib/realtime.ts` in Snipio). Connecting to `hostname:3001` over HTTPS is mixed content and will fail.

---

## 7. DNS and TLS

At your DNS provider:

```text
yourapp.akt9802.in      A    <vm public IP>
www.yourapp.akt9802.in  A    <vm public IP>
```

Wait until `dig yourapp.akt9802.in +short` returns the IP, **then** run Certbot. Certbot must prove you own the name via HTTP on port 80.

---

## 8. `.env` on the server

```bash
cp env.production.example .env
nano .env
```

Rules:

- `.env` is gitignored. It lives **only** on the VM (and your password manager).
- `--env-file .env` is read from the **directory where you run `docker run`**.
- After changing **runtime** secrets: `docker restart yourapp-app` (or recreate the container).
- After changing **`NEXT_PUBLIC_*`**: rebuild the image.

Typical production keys for a Next.js + Mongo app (FinSense / Prasikshan style):

```env
PORT=3004
NODE_ENV=production
HOSTNAME=0.0.0.0
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=https://yourapp.akt9802.in
```

---

## 9. Checklist: ship a brand-new app on this VM

Replace `yourapp`, `3004`, and the domain.

### On your laptop (in the repo)

- [ ] `output: "standalone"` in Next config
- [ ] `Dockerfile` (multi-stage, `CMD ["node", "server.js"]`)
- [ ] `.dockerignore` (exclude `node_modules`, `.git`, `.env`)
- [ ] `env.production.example` with `PORT` + public URLs
- [ ] `yourapp.nginx.conf` (HTTP template is enough; Certbot adds SSL)
- [ ] Pick a **free port** (not 3000–3003 on this VM)
- [ ] Commit, push to GitHub

### On the VM

```bash
cd ~/aman
git clone https://github.com/<you>/<repo>.git YourApp
cd YourApp   # or the nested folder that has the Dockerfile

cp env.production.example .env
nano .env

docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://yourapp.akt9802.in \
  -t yourapp .

docker run -d \
  --name yourapp-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  yourapp

curl -I http://127.0.0.1:3004
```

Nginx + TLS:

```bash
sudo cp yourapp.nginx.conf /etc/nginx/sites-available/yourapp
sudo ln -sf /etc/nginx/sites-available/yourapp /etc/nginx/sites-enabled/yourapp
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourapp.akt9802.in -d www.yourapp.akt9802.in
```

Verify in a browser: `https://yourapp.akt9802.in`.

### Hook it into `~/aman/deploy.sh`

Copy the `deploy_finsense` function and change:

- folder names under `~/aman`
- image tag (`yourapp`)
- container name (`yourapp-app`)
- verify URL (`http://127.0.0.1:3004`)
- menu option `4)`

Flow inside the script is already: pull → build → stop/rm old → run → `docker image prune -f` → curl.

---

## 10. Everyday commands

```bash
docker ps
docker logs -f yourapp-app
docker restart yourapp-app

# rebuild after a git push
cd ~/aman/YourApp
git pull origin main
docker build -t yourapp .
docker stop yourapp-app && docker rm yourapp-app
docker run -d --name yourapp-app --restart unless-stopped --network host --env-file .env yourapp
docker image prune -f

sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
sudo certbot certificates
```

---

## 11. When it breaks

| Symptom | Check |
|---|---|
| Nginx **502** | `docker ps` — is the container up? `curl -I http://127.0.0.1:PORT` |
| Container restart loop | `docker logs yourapp-app` — missing env, bad `MONGO_URI`, port in use |
| Port in use | `sudo lsof -i :3004` — another app stole the port |
| Site works on HTTP, not HTTPS | Certbot / DNS; `sudo certbot certificates` |
| UI talks to `localhost` in production | `NEXT_PUBLIC_*` baked at **build** time; rebuild with `--build-arg` |
| Tablets connect, live events don’t | Websocket location missing or `proxy_read_timeout` too low |
| Redis `ECONNREFUSED` (Prasikshan-style) | Need `--network host` and `REDIS_URL=redis://127.0.0.1:6379` |
| Build ignores your code | `docker build --no-cache -t yourapp .` |

---

## 12. What *not* to copy blindly from Snipio

| Snipio-specific | Your typical Next.js app |
|---|---|
| Two ports (3002 + 3003) | One port |
| `docker-entrypoint.sh` | `CMD ["node", "server.js"]` |
| `esbuild` of `server/socketServer.ts` | Skip |
| `/socket.io/` in Nginx | Skip unless you use Socket.IO |
| Extension “Socket URL” field | Skip |

Copy instead: multi-stage Dockerfile, host-network `docker run`, one Nginx site, Certbot, unique port, `.env` on the server, rebuild when public env vars change.

---

## 13. Related files in this repo

| File | What it is |
|---|---|
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md) | Snipio operator runbook (exact commands) |
| [`../Dockerfile`](../Dockerfile) | Snipio image (web + socket) |
| [`../docker-compose.yml`](../docker-compose.yml) | Two services, host network |
| [`../docker-entrypoint.sh`](../docker-entrypoint.sh) | `web` / `socket` / `all` |
| [`../snipio.nginx.conf`](../snipio.nginx.conf) | Production Nginx including `/socket.io/` |
| [`../env.production.example`](../env.production.example) | Production `.env` template |
| `~/aman/deploy.sh` | Menu: 1 FinSense, 2 Prasikshan, 3 Snipio |
