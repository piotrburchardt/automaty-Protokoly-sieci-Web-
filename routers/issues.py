from fastapi import APIRouter, Response, Request
from pydantic import BaseModel
import jwt
import os

from db import connect

router = APIRouter(prefix="/issues")
SECRET_KEY = os.getenv("JWT_SECRET")


class IssueCreate(BaseModel):
    machine_id: int
    title: str
    description: str
    created_at: str


def is_admin(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return False
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("role") == "admin"
    except Exception:
        return False


@router.post("")
def create_issue(data: IssueCreate):
    with connect() as db:
        db.execute(
            "INSERT INTO issues (machine_id, title, description, created_at) "
            "VALUES (?, ?, ?, ?)",
            (
                data.machine_id,
                data.title,
                data.description,
                data.created_at,
            ),
        )
    return Response(status_code=201)


@router.get("")
def list_issues(request: Request):
    if not is_admin(request):
        return Response(status_code=401)
    with connect() as db:
        rows = db.execute("SELECT * FROM issues ORDER BY id").fetchall()
        return [dict(row) for row in rows]


@router.get("/{issue_id}")
def get_issue(issue_id: int):
    with connect() as db:
        row = db.execute(
            "SELECT * FROM issues WHERE id = ?",
            (issue_id,),
        ).fetchone()
        if row is None:
            return Response(status_code=404)
        return dict(row)


@router.patch("/{issue_id}")
def update_issue(issue_id: int, data: IssueCreate):
    with connect() as db:
        cur = db.execute(
            "UPDATE issues SET machine_id = ?, title = ?, description = ?, created_at = ? "
            "WHERE id = ?",
            (
                data.machine_id,
                data.title,
                data.description,
                data.created_at,
                issue_id,
            ),
        )
        if cur.rowcount == 0:
            return Response(status_code=404)
    return Response(status_code=200)


@router.delete("/{issue_id}")
def delete_issue(issue_id: int, request: Request):
    if not is_admin(request):
        return Response(status_code=401)
    with connect() as db:
        cur = db.execute("DELETE FROM issues WHERE id = ?", (issue_id,))
        if cur.rowcount == 0:
            return Response(status_code=404)
    return Response(status_code=204)
