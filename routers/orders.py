from fastapi import APIRouter, Response, Request
from pydantic import BaseModel
import jwt
import os

from db import connect

router = APIRouter(prefix="/orders")

SECRET_KEY = os.getenv("JWT_SECRET")


class OrderCreate(BaseModel):
    machine_id: int
    product_id: int
    status: str
    price: int
    created_at: str
    payment_method: str


def get_user_info(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {"user_id": payload.get("user_id"), "role": payload.get("role")}
    except Exception:
        return None


@router.post("")
def create_order(data: OrderCreate, request: Request):
    info = get_user_info(request)
    user_id = info["user_id"] if info else None
    with connect() as db:
        stock = db.execute(
            "SELECT qty FROM machine_inventory WHERE machine_id = ? AND product_id = ?",
            (data.machine_id, data.product_id),
        ).fetchone()
        if stock is None or stock["qty"] <= 0:
            return Response(status_code=400)
        db.execute(
            "UPDATE machine_inventory SET qty = qty - 1 WHERE machine_id = ? AND product_id = ?",
            (data.machine_id, data.product_id),
        )
        db.execute(
            "INSERT INTO orders (machine_id, product_id, status, price, created_at, payment_method, user_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                data.machine_id,
                data.product_id,
                data.status,
                data.price,
                data.created_at,
                data.payment_method,
                user_id,
            ),
        )
    return Response(status_code=201)


@router.get("")
def list_orders():
    with connect() as db:
        rows = db.execute("SELECT * FROM orders ORDER BY id").fetchall()
        return [dict(row) for row in rows]


@router.get("/my")
def list_my_orders(request: Request):
    info = get_user_info(request)
    if info is None:
        return Response(status_code=401)
    user_id = info["user_id"]
    role = info["role"]
    with connect() as db:
        if role == "admin":
            rows = db.execute(
                "SELECT * FROM orders ORDER BY created_at DESC",
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]


@router.get("/{order_id}")
def get_order(order_id: int):
    with connect() as db:
        row = db.execute(
            "SELECT * FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        if row is None:
            return Response(status_code=404)
        return dict(row)


@router.patch("/{order_id}")
def update_order(order_id: int, data: OrderCreate):
    with connect() as db:
        db.execute(
            "UPDATE orders SET machine_id = ?, product_id = ?, status = ?, price = ?, created_at = ?, payment_method = ? "
            "WHERE id = ?",
            (
                data.machine_id,
                data.product_id,
                data.status,
                data.price,
                data.created_at,
                data.payment_method,
                order_id,
            ),
        )
    return Response(status_code=200)


@router.delete("/{order_id}")
def delete_order(order_id: int):
    with connect() as db:
        db.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    return Response(status_code=204)
