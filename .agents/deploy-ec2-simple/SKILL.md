---
name: deploy-ec2-simple
description: Deploy production lên EC2 bằng SSH: git pull + docker compose up -d --build. Ưu tiên đơn giản, không xử lý case phức tạp.
---

## Assumptions

- Trên EC2 đã có repo clone sẵn trong $EC2_APP_DIR
- Trên EC2 đã có file env (vd .env.prod hoặc .env.production.local) đặt sẵn
- EC2 đã cài docker + docker compose

## Required inputs

- EC2_HOST
- EC2_USER
- EC2_PORT (default 22)
- EC2_APP_DIR
- (optional) HEALTHCHECK_URL

## Run (remote)

```bash
set -e
cd "$EC2_APP_DIR"
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
# optional healthcheck:
# curl -fsS "$HEALTHCHECK_URL" >/dev/null
```
