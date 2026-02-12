# CI/CD with production branch for AWS EC2

## 1) Branch strategy

- `dev`: daily development branch.
- `main`: stable integration branch (ready for release validation).
- `production`: deployment branch, only used to deploy to AWS.

Recommended flow:

1. Feature branches -> merge to `dev`.
2. `dev` -> PR to `main`.
3. `main` -> PR to `production`.
4. Push/merge to `production` triggers CD deployment.

## 2) Create production branch

Run once:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git branch production
git push -u origin production
```

## 3) GitHub Actions files

- `CI`: `.github/workflows/ci.yml`
  - Runs on `dev`, `main`, `production`.
  - Steps: install -> lint -> test -> build.
- `CD Production`: `.github/workflows/deploy-pro.yml`
  - Runs on push to `production` and manual dispatch.
  - Build Docker image on GitHub Actions and push to GHCR.
  - SSH to EC2, pull branch `production`, upload `.env.prod` from secret, pull image from GHCR, run docker compose, run prisma migrate, health check.

## 4) Required GitHub secrets

Create these in `Settings -> Secrets and variables -> Actions`:

- `EC2_HOST`
- `EC2_USER`
- `SSH_PRIVATE_KEY_GITHUB` (preferred) or `GITHUB_SSH_PRIVATE_KEY` or `EC2_SSH_PRIVATE_KEY`
- `EC2_APP_DIR` (example: `/srv/nest-auth`)
- `PROD_ENV_FILE` (full content of your production `.env` file)
- `EC2_PORT` (optional, default `22`)
- `EC2_HEALTHCHECK_URL` (optional, default `http://127.0.0.1:3301/api/v1/docs`)
- `GHCR_USERNAME` + `GHCR_TOKEN` (optional when package visibility/permissions require explicit GHCR login)

## 5) Recommended production safeguards

- Create GitHub Environment: `production`.
- Add required reviewers for environment approvals.
- Protect branch `production`:
  - Require pull request before merge.
  - Require status check `CI`.
  - Disallow force push and deletion.
