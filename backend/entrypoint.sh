#!/bin/sh
set -e

python - <<'PY'
import os
import time

import pymysql

host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "3306"))
user = os.environ.get("DB_USER", "smart_user")
password = os.environ.get("DB_PASSWORD", "smart_pass")
database = os.environ.get("DB_NAME", "smart_ordering")

for attempt in range(30):
    try:
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
        )
        connection.close()
        print("Database connection established.")
        break
    except Exception as exc:
        print(f"Waiting for database ({attempt + 1}/30): {exc}")
        time.sleep(2)
else:
    raise SystemExit("Database did not become available in time.")
PY

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
