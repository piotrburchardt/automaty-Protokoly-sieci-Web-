from fastapi import APIRouter, Response
from pydantic import BaseModel

from db import connect

router = APIRouter(prefix="/machines")

class MachineCreate(BaseModel):
    city: str
    location: str
    status: str

class InventoryUpsert(BaseModel):
    product_id: int
    qty: int

class InventoryUpdateQty(BaseModel):
    qty: int


@router.post("")
def create_machine(data: MachineCreate):
    with connect() as db:
        db.execute(
            "INSERT INTO machines (city, location, status) VALUES (?,?,?)",
            (data.city, data.location, data.status)
        )
    return Response(status_code=201)

@router.get("")
def list_machines(search: str | None = None):
    with connect() as db:
        if search:
            rows = db.execute(
                """
                SELECT * FROM machines
                WHERE is_archived = 0
                  AND city || ' ' || location LIKE '%' || ? || '%'
                ORDER BY id
                """,
                (search,),
            ).fetchall()

        else:
            rows = db.execute(
                "SELECT * FROM machines WHERE is_archived = 0 ORDER BY id "
            ).fetchall()
            
        return [dict(row) for row in rows]


@router.get("/{machine_id}")
def get_machine(machine_id: int):
    with connect() as db:
        row = db.execute(
            "SELECT * FROM machines WHERE id = ? AND is_archived = 0",
            (machine_id,),
        ).fetchone()
        if row is None:
            return Response(status_code=404)
        return dict(row)


@router.get("/{machine_id}/inventory")
def get_machine_inventory(machine_id: int):
    with connect() as db:
        machine_exists = db.execute(
            "SELECT 1 FROM machines WHERE id = ? AND is_archived = 0",
            (machine_id,),
        ).fetchone()

        if machine_exists is None:
            return Response(status_code=404)

        rows = db.execute(
            """
            SELECT
              p.id AS product_id,
              p.name,
              p.price,
              p.grams,
              mi.qty
            FROM machine_inventory mi
            JOIN products p ON p.id = mi.product_id
            WHERE mi.machine_id = ?
              AND p.is_archived = 0
            ORDER BY p.name
            """,
            (machine_id,),
        ).fetchall()

        return [dict(row) for row in rows]


@router.post("/{machine_id}/inventory")
def add_or_replace_inventory(machine_id: int, data: InventoryUpsert):
    with connect() as db:
        machine_exists = db.execute(
            "SELECT 1 FROM machines WHERE id = ? AND is_archived = 0",
            (machine_id,),
        ).fetchone()
        if machine_exists is None:
            return Response(status_code=404)

        product_exists = db.execute(
            "SELECT 1 FROM products WHERE id = ? AND is_archived = 0",
            (data.product_id,),
        ).fetchone()
        if product_exists is None:
            return Response(status_code=404)

        if data.qty <= 0:
            db.execute(
                "DELETE FROM machine_inventory WHERE machine_id = ? AND product_id = ?",
                (machine_id, data.product_id),
            )
        else:
            db.execute(
                """
                INSERT OR REPLACE INTO machine_inventory (machine_id, product_id, qty)
                VALUES (?, ?, ?)
                """,
                (machine_id, data.product_id, data.qty),
            )
    return Response(status_code=204)


@router.patch("/{machine_id}/inventory/{product_id}")
def update_inventory_qty(machine_id: int, product_id: int, data: InventoryUpdateQty):
    with connect() as db:
        exists = db.execute(
            """
            SELECT 1 FROM machine_inventory mi
            JOIN machines m ON m.id = mi.machine_id
            JOIN products p ON p.id = mi.product_id
            WHERE mi.machine_id = ? AND mi.product_id = ? AND m.is_archived = 0 AND p.is_archived = 0
            """,
            (machine_id, product_id),
        ).fetchone()
        if exists is None:
            return Response(status_code=404)

        if data.qty <= 0:
            db.execute(
                "DELETE FROM machine_inventory WHERE machine_id = ? AND product_id = ?",
                (machine_id, product_id),
            )
        else:
            db.execute(
                "UPDATE machine_inventory SET qty = ? WHERE machine_id = ? AND product_id = ?",
                (data.qty, machine_id, product_id),
            )
    return Response(status_code=204)


@router.delete("/{machine_id}/inventory/{product_id}")
def delete_inventory(machine_id: int, product_id: int):
    with connect() as db:
        cur = db.execute(
            "DELETE FROM machine_inventory WHERE machine_id = ? AND product_id = ?",
            (machine_id, product_id),
        )
        if cur.rowcount == 0:
            return Response(status_code=404)
    return Response(status_code=204)


@router.patch("/{machine_id}")
def update_machine(machine_id: int, data: MachineCreate):
    with connect() as db:
        db.execute(
            "UPDATE machines SET city = ?, location = ?, status = ? WHERE id = ?",
            (data.city, data.location, data.status, machine_id))
    return  Response(status_code=200)


@router.delete("/{machine_id}")
def delete_machine(machine_id: int):
    with connect() as db:
        db.execute("UPDATE machines SET is_archived =1 WHERE id = ?", (machine_id,))
    return Response(status_code=204)
