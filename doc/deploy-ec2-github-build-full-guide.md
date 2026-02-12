# Full guide: Deploy NestJS len AWS EC2 (build tren GitHub, khong build tren EC2)

Tai lieu nay dung cho flow hien tai:

- Build Docker image tren GitHub Actions.
- Push image len GHCR.
- SSH vao EC2 de pull image + run `docker compose`.
- Nhan file env tu GitHub Secret (khong phu thuoc file env local tren EC2).

Ap dung voi cac file:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pro.yml`
- `docker-compose.prod.yml`

## 1) Kien truc va branch strategy

- `dev`: branch phat trien hang ngay.
- `main`: branch on dinh sau khi merge tu `dev`.
- `production`: branch deploy that len EC2.

Flow:

1. Feature -> `dev`.
2. `dev` -> PR vao `main`.
3. `main` -> PR vao `production`.
4. Merge vao `production` se trigger CD.

## 2) Cac secret can tao tren GitHub

Vao: `Repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

Bat buoc:

- `EC2_HOST`: Public IPv4 hoac Elastic IP cua EC2.
- `EC2_USER`: user SSH de deploy (de xuat `deploy`).
- `EC2_APP_DIR`: duong dan app tren EC2 (de xuat `/srv/nest-auth`).
- `PROD_ENV_FILE`: toan bo noi dung file env production.
- `SSH_PRIVATE_KEY_GITHUB` hoac `GITHUB_SSH_PRIVATE_KEY` hoac `EC2_SSH_PRIVATE_KEY`: private key dung de SSH.

Khuyen nghi:

- `EC2_PORT`: default `22`.
- `EC2_HEALTHCHECK_URL`: default `http://127.0.0.1:3301/api/v1/docs`.
- `GHCR_USERNAME`: ten user GitHub dung pull GHCR private.
- `GHCR_TOKEN`: token co quyen `read:packages` (can neu pull image bi deny).

Luu y quan trong:

- Key ban add vao EC2 la public key (`*.pub`) trong `authorized_keys`.
- Secret tren GitHub phai la private key tuong ung (`-----BEGIN OPENSSH PRIVATE KEY-----`).

## 3) Chuan bi EC2 (lam 1 lan)

### 3.1 Tao user deploy va quyen thu muc

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

sudo mkdir -p /srv/nest-auth
sudo chown -R deploy:deploy /srv/nest-auth
sudo chmod 755 /srv/nest-auth
```

### 3.2 Cau hinh SSH key cho user deploy

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy bash -c 'cat >> /home/deploy/.ssh/authorized_keys'
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

Paste public key vao lenh `cat` o tren, nhan `Ctrl + D` de luu.

### 3.3 Clone repo tren EC2

Dang nhap bang user `deploy`:

```bash
sudo -iu deploy
cd /srv/nest-auth
git clone <repo-url> .
git checkout production
```

Neu repo private, can setup deploy key/token tren EC2 de `git fetch` va `git pull` chay duoc.

## 4) Cau hinh Security Group va network

De GitHub-hosted runner SSH truc tiep vao EC2:

- Inbound rule can co:
  - `SSH TCP 22` tu `0.0.0.0/0` (test de cho chay thong).
  - Co the them `::/0` neu dung IPv6.
- Instance phai co Public IP/Elastic IP.
- Subnet phai co route `0.0.0.0/0` ra Internet Gateway.

Kiem tra tren EC2:

```bash
sudo systemctl status ssh
sudo ss -lntp | grep ':22' || true
sudo ufw status
```

## 5) Docker compose production

`docker-compose.prod.yml` can dung image cho service app (khong build tren EC2):

```yaml
app:
  image: ${APP_IMAGE}
  env_file:
    - .env.prod
```

Workflow se export `APP_IMAGE` tu image vua build tren GitHub.

## 6) Workflow CD production dang dung

`deploy-pro.yml` co 2 job:

1. `build`

- Build image `linux/arm64` bang Buildx.
- Push len `ghcr.io/<owner>/<repo>:sha-<commit>` va tag `:production`.

2. `deploy`

- Tao file `.env.prod` tu secret `PROD_ENV_FILE`.
- SSH vao EC2.
- Upload `.env.prod` len `$EC2_APP_DIR`.
- `git fetch/pull` branch `production`.
- `docker login ghcr.io`.
- `docker compose pull app`.
- `docker compose up -d --remove-orphans`.
- `prisma migrate deploy`.
- Health check URL.

## 7) Cach nhap secret PROD_ENV_FILE dung

Tren may local, mo file `.env.production.local`, copy toan bo noi dung va paste vao secret `PROD_ENV_FILE`.

Dieu kien:

- Moi dong phai dung format `KEY=VALUE`.
- Khong them ky tu la o dau/cuoi file.
- Neu co ky tu xuong dong Windows, workflow da co buoc `sed -i 's/\r$//'`.

## 8) Chay deploy lan dau

1. Push code workflow + compose len branch `production`.
2. Vao tab `Actions`.
3. Chay workflow `CD Production` bang `Run workflow` hoac push commit moi vao `production`.
4. Theo doi log 2 job `build` va `deploy`.

Kiem tra tren EC2:

```bash
cd /srv/nest-auth
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=100 app
```

## 9) Loi thuong gap va cach xu ly nhanh

### 9.1 `Cannot connect to <host>:22`

- `EC2_HOST` dang la private IP (`172.31.x.x`) -> doi sang Public/Elastic IP.
- Security Group chua mo `22`.
- Route table/NACL chan ket noi.

### 9.2 `cd: <EC2_APP_DIR>: Permission denied`

- User deploy khong co quyen ghi vao thu muc app.
- Fix:

```bash
sudo chown -R deploy:deploy /srv/nest-auth
sudo chmod 755 /srv/nest-auth
```

### 9.3 `Permission denied (publickey)`

- Secret private key khong dung cap voi public key tren EC2.
- Kiem tra lai:
  - Secret `SSH_PRIVATE_KEY_GITHUB` (hoac key fallback).
  - `/home/deploy/.ssh/authorized_keys`.

### 9.4 `pull access denied` khi keo image GHCR

- Them `GHCR_USERNAME` + `GHCR_TOKEN` (PAT co `read:packages`).
- Dam bao package visibility va quyen truy cap dung repo.

### 9.5 `.env.prod not found`

- Secret `PROD_ENV_FILE` chua duoc tao hoac rong.
- Kiem tra step "Generate .env.prod from secret" trong workflow.

## 10) Baseline security cho SSH production

Sau khi deploy on dinh, hardening SSH:

```bash
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
echo 'AllowUsers deploy' | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart ssh
```

Neu muon tang bao mat hon nua:

- Dung self-hosted runner trong VPC.
- Hoac deploy qua AWS SSM thay vi mo SSH public.

## 11) Checklist truoc khi bam deploy

- [ ] Branch `production` da ton tai va co code moi nhat.
- [ ] `EC2_HOST` la Public/Elastic IP.
- [ ] Security Group mo SSH 22.
- [ ] `EC2_APP_DIR` ton tai va user deploy co quyen ghi.
- [ ] Secret `PROD_ENV_FILE` da dung noi dung env production.
- [ ] SSH private key secret khop voi public key tren EC2.
- [ ] `docker`, `docker compose`, `git` da cai tren EC2.
