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
- To access your data from anywhere (e.g. when the site is sleeping), use the **External Database URL** from your Render PostgreSQL service dashboard and connect with any PostgreSQL client (psql, DBeaver, etc.).

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
