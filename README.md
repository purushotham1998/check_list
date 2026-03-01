# User Details Registration

A simple, user-friendly website to record user details (name, mobile, age, sex, locality, preferred time slot, preferred location, ID proof upload). All records are stored in a PostgreSQL database and the UI updates when new data is added.

**Backend:** Python (Flask). **Frontend:** HTML, CSS, JavaScript.

## Features

- **Form fields:** First name, last name, mobile number, age, sex, locality, preferred time slot (from–to), preferred location, ID proof upload (PDF/JPG/PNG, max 5MB).
- **Database:** PostgreSQL; table is created automatically on first run.
- **UI:** Accessible, responsive form with validation and a “Saved records” list that refreshes when you submit.

## Project structure

```
USER_DETAIL_RECORD/
├── app.py              # Flask app, API routes, DB init
├── requirements.txt    # Python dependencies
├── render.yaml         # Render Blueprint (optional)
├── .env.example
├── public/             # Static frontend
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## Data storage

- Every form submission is stored in the **PostgreSQL** database configured by `DATABASE_URL`.
- The database **does not reset** when the app restarts or when the Render web service goes to sleep (the database is a separate service and keeps all data).

---

## Fixing "Database not configured"

If you see **"Database not configured. Set DATABASE_URL..."** when submitting the form:

### On Render

1. Open the [Render Dashboard](https://dashboard.render.com).
2. Open your **Web Service** (the app), then go to **Environment**.
3. Add an environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** The connection URL of your PostgreSQL database.
     - If the database is on Render: open your **PostgreSQL** service → copy **Internal Database URL** (for same Render account) or **External Database URL** (for access from your PC or other apps).
4. Save. Render will redeploy; after that, form submit should work.

If you used a **Blueprint**, the Web Service should already be linked to the database and have `DATABASE_URL` set. If it’s missing, link the database in the service’s **Environment** tab or add `DATABASE_URL` manually with the URL from the PostgreSQL service.

### Running locally

1. Create a `.env` file in the project root (see `.env.example`).
2. Set `DATABASE_URL` to your PostgreSQL connection string, for example:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/user_details
   ```
3. If the database is on Render, use the **External Database URL** from the Render PostgreSQL service (so your local app can reach it over the internet).

---

## Accessing the database separately

You can query or export data without using the website.

### 1. Get the connection URL

- **Render:** Open your **PostgreSQL** service in the dashboard.
  - **Internal Database URL** – use only from another Render service in the same account.
  - **External Database URL** – use from your computer, pgAdmin, DBeaver, etc. Copy this for local access.

The URL looks like:
`postgresql://user:password@hostname:5432/database_name`

### 2. Connect with a client

**Option A: Command line (psql)**

- Install [PostgreSQL](https://www.postgresql.org/download/) (includes `psql`), then run:
  ```bash
  psql "postgresql://user:password@hostname:5432/database_name"
  ```
  Replace with your **External Database URL** from Render (in one string, or split into host/user/db and pass separately).

- Example query:
  ```sql
  SELECT * FROM user_records ORDER BY created_at DESC;
  ```

**Option B: GUI (pgAdmin, DBeaver, etc.)**

1. Create a new PostgreSQL connection.
2. From the External URL, fill in:
   - **Host:** from the URL (e.g. `dpg-xxxx.a.oregon-postgres.render.com`)
   - **Port:** 5432
   - **Database:** database name (e.g. `user_details`)
   - **Username / Password:** from the URL (often in the form `user:password` before `@`)
3. For Render’s External URL, enable **SSL** (e.g. SSL mode “require”).
4. Connect and open the `user_records` table or run SQL.

**Option C: From another app or script**

Use the same **External Database URL** (with SSL) in any PostgreSQL client library (e.g. Python’s `psycopg2`, Node’s `pg`, etc.). The table name is `user_records`.

## Deploy on Render

### Option A: One-click with Blueprint

1. Push this repo to GitHub (or GitLab).
2. In [Render Dashboard](https://dashboard.render.com), click **New** → **Blueprint**.
3. Connect your repo and select it. Render will read `render.yaml` and create:
   - A **PostgreSQL** database.
   - A **Web Service** (Python) that runs `gunicorn app:app` and gets `DATABASE_URL` from the database.
4. Deploy. The site will be at `https://<your-service>.onrender.com`.

### Option B: Manual setup

1. **Create a PostgreSQL database**
   - In Render: **New** → **PostgreSQL**.
   - Note the **Internal Database URL** (or **External** if you need it elsewhere).

2. **Create a Web Service**
   - **New** → **Web Service**, connect your repo.
   - **Runtime:** Python.
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
   - **Environment:** Add variable `DATABASE_URL` = the database URL from step 1.

3. Deploy. The app creates the `user_records` table on first request.

## Run locally

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file (see `.env.example`):
   ```
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/user_details
   ```
4. Start the server:
   ```bash
   python app.py
   ```
   Or with gunicorn: `gunicorn app:app`
5. Open http://localhost:3000.

## Tech stack

- **Backend:** Python, Flask, psycopg2 (PostgreSQL), Gunicorn.
- **Frontend:** HTML, CSS, JavaScript (vanilla).
- **Deploy:** Render (Web Service + PostgreSQL).
