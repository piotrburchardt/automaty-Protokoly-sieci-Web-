import time
import json
import jwt
import os
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse

from db import connect

router = APIRouter(prefix="/sse")

SECRET_KEY = os.getenv("JWT_SECRET")


def is_admin(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return False
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("role") == "admin"
    except Exception:
        return False


@router.get("/admin")
def admin_stream(request: Request):
    if not is_admin(request):
        return Response(status_code=401)

    with connect() as db:
        last_order_id = db.execute("SELECT COALESCE(MAX(id), 0) FROM orders").fetchone()[0]
        last_issue_id = db.execute("SELECT COALESCE(MAX(id), 0) FROM issues").fetchone()[0]
        last_machines = [dict(row) for row in db.execute(
            "SELECT id, city, location, status FROM machines WHERE is_archived = 0 ORDER BY id"
        ).fetchall()]

    def gen():
        nonlocal last_order_id, last_issue_id, last_machines
        heartbeat = 0
        first = True
        while True:
            payload = {}
            with connect() as db:
                orders = db.execute(
                    "SELECT id, machine_id, product_id, price, created_at, payment_method "
                    "FROM orders WHERE id > ? ORDER BY id",
                    (last_order_id,),
                ).fetchall()
                issues = db.execute(
                    "SELECT id, machine_id, title, description, created_at FROM issues WHERE id > ? ORDER BY id",
                    (last_issue_id,),
                ).fetchall()
                machines = [dict(row) for row in db.execute(
                    "SELECT id, city, location, status FROM machines WHERE is_archived = 0 ORDER BY id"
                ).fetchall()]

            if orders:
                payload["orders"] = [dict(o) for o in orders]
                last_order_id = orders[-1]["id"]
            if issues:
                payload["issues"] = [dict(i) for i in issues]
                last_issue_id = issues[-1]["id"]
            if machines != last_machines:
                payload["machines"] = machines
                last_machines = machines
            if first:
                payload.setdefault("machines", machines)
                first = False

            if payload:
                yield f"data: {json.dumps(payload)}\n\n"
                heartbeat = 0
            else:
                heartbeat += 1
                if heartbeat >= 20:
                    yield ":ping\n\n"
                    heartbeat = 0

            time.sleep(3)

    return StreamingResponse(gen(), media_type="text/event-stream")
