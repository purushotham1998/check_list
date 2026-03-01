import os
from pathlib import Path

import psycopg2
from psycopg2 import OperationalError
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

app = Flask(__name__, static_folder="public", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB

DATABASE_URL = os.environ.get("DATABASE_URL")

DB_NOT_CONFIGURED_MSG = (
    "Database not configured. Set DATABASE_URL: "
    "locally use a .env file; on Render add DATABASE_URL in Web Service → Environment "
    "(use the PostgreSQL service's Internal or External URL)."
)


def _is_local_db(url):
    if not url:
        return True
    url_lower = url.lower()
    return "localhost" in url_lower or "127.0.0.1" in url_lower


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    dsn = DATABASE_URL
    # Only require SSL for remote DBs (e.g. Render); local PostgreSQL often has no SSL
    if dsn and "sslmode" not in dsn and not _is_local_db(dsn):
        dsn = dsn + ("&" if "?" in dsn else "?") + "sslmode=require"
    return psycopg2.connect(dsn)


def init_db():
    sql = """
    CREATE TABLE IF NOT EXISTS user_records (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        mobile_number VARCHAR(50) NOT NULL,
        age INTEGER NOT NULL,
        sex VARCHAR(20) NOT NULL,
        locality VARCHAR(200) NOT NULL,
        preferred_time_from VARCHAR(20) NOT NULL,
        preferred_time_to VARCHAR(20) NOT NULL,
        preferred_location VARCHAR(200) NOT NULL,
        id_proof_data TEXT,
        id_proof_filename VARCHAR(255),
        photo_proof_data TEXT,
        photo_proof_filename VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            cur.execute("ALTER TABLE user_records ADD COLUMN IF NOT EXISTS photo_proof_data TEXT")
            cur.execute("ALTER TABLE user_records ADD COLUMN IF NOT EXISTS photo_proof_filename VARCHAR(255)")
        conn.commit()


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/records", methods=["GET"])
def list_records():
    if not DATABASE_URL:
        return jsonify({"error": DB_NOT_CONFIGURED_MSG}), 503
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, first_name, last_name, mobile_number, age, sex,
                           locality, preferred_time_from, preferred_time_to,
                           preferred_location, id_proof_filename, photo_proof_filename, created_at
                    FROM user_records
                    ORDER BY created_at DESC
                    """
                )
                columns = [
                    "id", "first_name", "last_name", "mobile_number", "age", "sex",
                    "locality", "preferred_time_from", "preferred_time_to",
                    "preferred_location", "id_proof_filename", "photo_proof_filename", "created_at",
                ]
                rows = [dict(zip(columns, row)) for row in cur.fetchall()]
                for r in rows:
                    if r.get("created_at"):
                        r["created_at"] = r["created_at"].isoformat()
        return jsonify(rows)
    except OperationalError as e:
        app.logger.warning("Database connection error: %s", e)
        return jsonify({"error": "Database unavailable. Check DATABASE_URL and that PostgreSQL is running."}), 503
    except Exception as e:
        app.logger.exception(e)
        return jsonify({"error": "Failed to fetch records"}), 500


@app.route("/api/records", methods=["POST"])
def create_record():
    if not DATABASE_URL:
        return jsonify({"error": DB_NOT_CONFIGURED_MSG}), 503
    data = request.get_json(force=True, silent=True) or {}
    required = [
        "first_name", "last_name", "mobile_number", "age", "sex",
        "locality", "preferred_time_from", "preferred_time_to", "preferred_location",
    ]
    missing = [f for f in required if f != "age" and not str(data.get(f, "")).strip()]
    if not data.get("age") and data.get("age") != 0:
        missing.append("age")
    if missing:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO user_records (
                        first_name, last_name, mobile_number, age, sex, locality,
                        preferred_time_from, preferred_time_to, preferred_location,
                        id_proof_data, id_proof_filename, photo_proof_data, photo_proof_filename
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, first_name, last_name, mobile_number, age, sex,
                              locality, preferred_time_from, preferred_time_to,
                              preferred_location, id_proof_filename, photo_proof_filename, created_at
                    """,
                    (
                        (data.get("first_name") or "").strip(),
                        (data.get("last_name") or "").strip(),
                        (data.get("mobile_number") or "").strip(),
                        int(data.get("age")),
                        (data.get("sex") or "").strip(),
                        (data.get("locality") or "").strip(),
                        (data.get("preferred_time_from") or "").strip(),
                        (data.get("preferred_time_to") or "").strip(),
                        (data.get("preferred_location") or "").strip(),
                        data.get("id_proof_data") or None,
                        (data.get("id_proof_filename") or "").strip() or None,
                        data.get("photo_proof_data") or None,
                        (data.get("photo_proof_filename") or "").strip() or None,
                    ),
                )
                row = cur.fetchone()
                columns = [
                    "id", "first_name", "last_name", "mobile_number", "age", "sex",
                    "locality", "preferred_time_from", "preferred_time_to",
                    "preferred_location", "id_proof_filename", "photo_proof_filename", "created_at",
                ]
                out = dict(zip(columns, row))
                if out.get("created_at"):
                    out["created_at"] = out["created_at"].isoformat()
            conn.commit()
        return jsonify(out), 201
    except OperationalError as e:
        app.logger.warning("Database connection error: %s", e)
        return jsonify({"error": "Database unavailable. Check DATABASE_URL and that PostgreSQL is running."}), 503
    except Exception as e:
        app.logger.exception(e)
        return jsonify({"error": "Failed to save record"}), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path and (Path(app.static_folder) / path).is_file():
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


# Run init_db when using gunicorn (e.g. on Render)
def on_start():
    if DATABASE_URL:
        try:
            init_db()
        except Exception as e:
            app.logger.warning("DB init on startup: %s", e)


# Gunicorn and other WSGI servers may not run __main__; init on first request if needed
@app.before_request
def ensure_db():
    if not hasattr(ensure_db, "_inited"):
        on_start()
        ensure_db._inited = True


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    if DATABASE_URL:
        try:
            init_db()
            print("Database ready.")
        except Exception as e:
            print("Warning: Could not init database:", e)
            print("App will run; /api/records will return 503 until DB is available.")
    else:
        print("Warning: DATABASE_URL not set. Add it to .env for saving/loading records.")
    app.run(host="0.0.0.0", port=port)
