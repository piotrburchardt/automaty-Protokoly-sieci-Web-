from fastapi import APIRouter, Response
from pydantic import BaseModel

from db import connect

router = APIRouter(prefix="/products")


class ProductCreate(BaseModel):
    name: str
    price: int
    grams: int


@router.post("", status_code=201)
def create_product(data: ProductCreate):
    with connect() as db:
        db.execute(
            "INSERT INTO products (name, price, grams) VALUES (?, ?, ?)",
            (data.name, data.price, data.grams),
        )
        return Response(status_code=201)


@router.get("")
def list_products():
    with connect() as db:
        rows = db.execute("SELECT id, name, price, grams FROM products ORDER BY id").fetchall()
        return [dict(row) for row in rows]


@router.patch("/{product_id}")
def update_product(product_id: int, data: ProductCreate):
    with connect() as db:
        cur = db.execute(
            "UPDATE products SET name = ?, price = ?, grams = ? WHERE id = ?",
            (data.name, data.price, data.grams, product_id),
        )
        if cur.rowcount == 0:
            return Response(status_code=404)
        return Response(status_code=200)


@router.delete("/{product_id}")
def delete_product(product_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        if cur.rowcount == 0:
            return Response(status_code=404)
        return Response(status_code=204)
