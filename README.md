# 🐳 The Oops Bay

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Go](https://img.shields.io/badge/backend-Go_%2B_Fiber-00ADD8.svg)
![React](https://img.shields.io/badge/frontend-React_%2B_Vite-61DAFB.svg)
![Vibe Coded](https://img.shields.io/badge/Vibe_Coded-AI_Assisted-8A2BE2)

**A simple, lightweight Docker dashboard for your homelab.**

I built this because I found Portainer too heavy for my needs, and Dozzle (while great) didn't show me historical resource usage. I just wanted to see *why* my server spiked at 3 AM without setting up Prometheus + Grafana.

---

![Dashboard Preview](image.png)

---

## ⚠️ "Vibe Coding" Disclaimer

**Honesty time:** I am learning Go. This project was built with heavy assistance from AI tools ("vibe coding").
It works great on my machine and in my rack, but the code might not follow best practices. I built it to solve my own problem. Use at your own risk! ✌️

---

## ✨ Features

* **Resources History:** See CPU & RAM usage charts for the last 24h (saved to SQLite).
* **Lightweight:** Written in Go (Fiber) + React. Minimal footprint.
* **Simple Control:** Start, Stop, Restart containers.
* **Customization:** Give containers custom aliases and icons so they look nice.

---

## 🚀 Quick Start

### Docker CLI

```bash
docker run -d \
  --name the-oops-bay \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ./oops-data:/app/data \
  medzhidovomar/the-oops-bay
Docker Compose
YAML
```
```yaml
services:
  the-oops-bay:
    image: medzhidovomar/the-oops-bay:latest
    container_name: the-oops-bay
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./oops-data:/app/data
```
Note: Open at http://localhost:3000. The data folder is needed to save your icons and metrics history.

🔒 Security Note
This app has no authentication.

Do not expose this directly to the internet.

Use a VPN (Tailscale/Wireguard) or a Reverse Proxy (Nginx/Traefik) with Basic Auth if you need remote access.

Or bind to localhost only: -p 127.0.0.1:3000:3000.

📝 License
GNU AGPL v3.0 Feel free to fork it or use it. If you fix my bugs, that's cool too.