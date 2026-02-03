from fastapi import APIRouter, Response, Request
from pydantic import BaseModel
from typing import Optional
import jwt
import os

from db import connect

router = APIRouter(prefix="/products")
SECRET_KEY = os.getenv("JWT_SECRET")


class ProductCreate(BaseModel):
    name: str
    price: int
    grams: int


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
def create_product(data: ProductCreate, request: Request):
    if not is_admin(request):
        return Response(status_code=401)
    with connect() as db:
        db.execute(
            "INSERT INTO products (name, price, grams) VALUES (?, ?, ?)",
            (data.name, data.price, data.grams),
        )
        return Response(status_code=201)


@router.get("")
def list_products(query: Optional[str] = None):
    with connect() as db:
        if query:
            rows = db.execute(
                "SELECT * FROM products WHERE is_archived = 0 AND name LIKE ? ORDER BY id",
                (f"%{query}%",),
            ).fetchall()
        else:
            rows = db.execute("SELECT * FROM products WHERE is_archived = 0 ORDER BY id").fetchall()
        return [dict(row) for row in rows]


@router.get("/{product_id}")
def get_product(product_id: int):
    with connect() as db:
        row = db.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
        if row is None:
            return Response(status_code=404)
        return dict(row)


@router.patch("/{product_id}")
def update_product(product_id: int, data: ProductCreate, request: Request):
    if not is_admin(request):
        return Response(status_code=401)
    with connect() as db:
        cur = db.execute(
            "UPDATE products SET name = ?, price = ?, grams = ? WHERE id = ?",
            (data.name, data.price, data.grams, product_id),
        )
        if cur.rowcount == 0:
            return Response(status_code=404)
        return Response(status_code=200)


@router.delete("/{product_id}")
def delete_product(product_id: int, request: Request):
    if not is_admin(request):
        return Response(status_code=401)
    with connect() as db:
        db.execute("UPDATE products SET is_archived = 1 WHERE id = ?", (product_id,))
    return Response(status_code=204)
