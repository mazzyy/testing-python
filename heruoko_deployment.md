# Docker Pipeline Optimization

## Completed Changes
We have significantly improved your Docker infrastructure to ensure faster builds and more robust production deployments.

1. **Context Size Optimization ([.dockerignore](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/.dockerignore) files)**:
   Added [.dockerignore](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/.dockerignore) files to the [root](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/.dockerignore), [frontend](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/frontend/.dockerignore), and [backend](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/backend/.dockerignore) directories. This prevents copying massive local directories like `node_modules`, python virtual environments (`venv`), and local SQLite database files into the Docker image, cutting your build times drastically.

2. **Database Connection Fixes**:
   The [docker-compose.yml](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/docker-compose.yml) environment block for the backend service was updated to correctly map `DATABASE_URL` to the Postgres container ([db](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/daad_app.db)), overriding the [.env](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/backend/.env) value of `localhost`.

3. **Cleanup of Redundant Mounts**:
   - Removed the obsolete and malformed [backend/init.sql](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/backend/init.sql) script and its associated volume mount. The PostgreSQL container handles initialization automatically using the `POSTGRES_USER` and `POSTGRES_DB` values.
   - Removed local SQLite database volume mappings ([daad_app.db](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/daad_app.db) and `uni_advisor.db`) which were causing Docker to incorrectly mount empty directories.

## Verification
   - Executed `docker-compose config` to validate that the changes resulted in a clean, correctly typed compose definition, with [db](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/daad_app.db) resolving flawlessly as the database host and volume mappings correctly targeting only `postgres_data`, `chroma_db`, and `uploads`.

---

# Heroku Deployment Preparation

## Completed Enhancements
We adapted your monolithic Docker setup specifically to satisfy Heroku runtime requirements while letting it integrate with an independent managed database cleanly.

1. **Dynamic `$PORT` Binding ([Dockerfile.monolith](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/Dockerfile.monolith))**:
   - Web applications deployed via Docker on Heroku *must* listen on a randomized port passed via the `$PORT` environment variable.
   - We updated your container to install `gettext-base` and use `envsubst` inside your `start.sh` boot sequence. Nginx now dynamically ingests the Heroku-provided `$PORT` (falling back to `80` locally).

2. **Database Connection Hardening ([app/config.py](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/backend/app/config.py))**:
   - When Heroku attaches its managed Postgres service, it provides the connection credentials in a `DATABASE_URL` environment variable. 
   - Historically, Heroku utilized the `postgres://` schema, which is deprecated in modern SQLAlchemy setups. Added a Pydantic `validator` intercept that seamlessly rewrites `postgres://` to `postgresql://` if inherited from the environment.

3. **Heroku Instruction Pipeline ([heroku.yml](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/heroku.yml))**:
   - Created a strict [heroku.yml](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/heroku.yml) to define the Docker build stack, declaring the web process explicitly correlates to your monolithic Dockerfile.

---

# How to Test Locally

Because your app depends on a PostgreSQL database and AI services, the most reliable way to test the full monolithic Docker container locally is through `docker-compose`.

> [!WARNING]
> Please ensure you stop your currently running local dev servers (`uvicorn` and `npm run dev`) before testing this, as they will conflict with Docker trying to bind to ports `8000` and `3000`.

1. **Stop local servers** first.
2. In your terminal, build and start the container suite in detached mode:
   ```bash
   docker-compose up --build -d
   ```
3. Open `http://localhost:3000` in your browser. The monolithic container (which includes the frontend and Nginx proxying to the backend) will be live.
4. To view live logs:
   ```bash
   docker-compose logs -f
   ```
5. When finished testing, shut down the containers securely without removing your database volume:
   ```bash
   docker-compose down
   ```

---

# How to Deploy to Heroku

With the fixes we've pushed, deploying this monolithic setup to Heroku is streamlined. Since we implemented the [heroku.yml](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/heroku.yml) manifest, we will use Heroku's Container Stack.

1. **Install Heroku CLI and Login**
   If you haven't already install the Heroku CLI, then log in:
   ```bash
   heroku login
   ```

2. **Create the Heroku App**
   Create a new app in your Heroku account:
   ```bash
   heroku create uniadvisor-ai
   ```

3. **Provision the Managed Postgres Database**
   Attach a free/essential tier postgres database to your app:
   ```bash
   heroku addons:create heroku-postgresql:essential-0 -a uniadvisor-ai
   ```
   *Heroku will automatically inject the `DATABASE_URL` config var into your app.*

4. **Add Necessary Environment Variables**
   Set your specific application secrets inside Heroku's configuration:
   ```bash
   heroku config:set AZURE_OPENAI_API_KEY="your-key" -a uniadvisor-ai
   heroku config:set SECRET_KEY="your-super-secret-key" -a uniadvisor-ai
   # Add any other required .env variables here
   ```

5. **Set the App Stack to Container**
   Tell Heroku not to look for the default Python/Node buildup, but to use Docker:
   ```bash
   heroku stack:set container -a uniadvisor-ai
   ```

6. **Deploy!**
   Push your code to Heroku's git remote. Heroku will read [heroku.yml](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/heroku.yml), build [Dockerfile.monolith](file:///Users/soomro/Desktop/Projects/UniAdvisorAI/Dockerfile.monolith), and deploy it:
   ```bash
   git push heroku main
   ```
   *(If you are on a different branch locally, use `git push heroku your-branch:main`)*

7. **Verify Deployment**
   Monitor the release and open the app:
   ```bash
   heroku logs --tail -a uniadvisor-ai
   heroku open -a uniadvisor-ai
   ```
