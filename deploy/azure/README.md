# Deploying CampusConsult to Azure

Single container (`Dockerfile.monolith`: nginx serving the built frontend +
gunicorn/uvicorn on :8000) on **App Service for Containers**, with a managed
**PostgreSQL Flexible Server**. No VMs, no Kubernetes.

## One-time setup

```bash
brew install azure-cli      # if you don't have it
az login
```

## Deploy

```bash
./deploy/azure/deploy.sh
```

First run takes ~15 minutes: Postgres provisioning (~4 min) and the image build
(~8 min, since `npm ci` and `pip install` run remotely). Re-runs are much faster
and skip anything that already exists.

At the end it prints your public URL: `https://campusconsult-<suffix>.azurewebsites.net`

## Seed the database

The app comes up with empty tables. From your Mac:

```bash
./deploy/azure/deploy.sh info      # prints the exact commands with the real URL

cd backend && source venv/bin/activate
export AZ_DB='<the DATABASE_URL from info>'

python -m scripts.seed_programs_heroku --file data/program_details.json --db-url "$AZ_DB"
python -m scripts.create_admin --email admin@campusconsult.app --password '<strong>' --db-url "$AZ_DB"
python -m scripts.seed_community --db-url "$AZ_DB"     # optional demo content
```

`deploy.sh` opens the Postgres firewall for your current IP automatically. If
your IP changes, re-run `./deploy/azure/deploy.sh` to add the new one.

## Day to day

```bash
./deploy/azure/deploy.sh app        # code changed → rebuild + redeploy
./deploy/azure/deploy.sh settings   # backend/.env changed → push settings
./deploy/azure/deploy.sh logs       # tail live container logs
./deploy/azure/deploy.sh destroy    # delete everything
```

## Decisions worth knowing

**The build runs in Azure, not on your Mac.** `az acr build` uses Azure's amd64
agents. An Apple Silicon Mac produces arm64 images, which App Service pulls
successfully and then fails to start with no useful error message. This is the
single most common way this deployment goes wrong.

**ChromaDB lives in `/home/chroma_db`.** `/home` is the only persistent path in
an App Service container, and it needs `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`
(the script sets it). Without this the vector index is lost on every restart and
gets rebuilt by re-embedding every program through Azure OpenAI — slow, and it
spends credits each time.

**Postgres requires TLS.** The connection string carries `?sslmode=require`.
Omitting it fails with a confusing SSL error rather than a clear one.

**Secrets are never committed.** Resource names and the generated Postgres
password go to `deploy/azure/.env.azure`, which is gitignored. Keep that file —
it's how the script finds your resources on later runs. Everything else is read
from `backend/.env` at deploy time and pushed to App Service settings.

**`create_default_admin` works here but not locally.** It reads
`settings.ADMIN_PASSWORD`, and on Azure these are real environment variables, so
the admin is created on first boot. Locally it depends on the `.env` fix made
earlier.

## Sizing

`B1` (1.75 GB) fits the image — no torch, just `chromadb` + `onnxruntime`. If
you see the container restarting under load, move to B2:

```bash
az appservice plan update -n campusconsult-plan -g campusconsult-rg --sku B2
```

## Before this is genuinely public

- `/health` returns your database password. Fix or remove it.
- `app/auth.py` logs plaintext passwords and password hashes on every login.
- Demo community content reads as real users — clear it or label it.
- `admin@daad.de` impersonates a domain you don't own.
