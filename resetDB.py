from db import connect


def reset_db() -> None:
    with connect() as db:
        db.execute("PRAGMA foreign_keys = ON;")
        db.execute("DELETE FROM machine_inventory;")
        db.execute("DELETE FROM orders;")
        db.execute("DELETE FROM issues;")
        db.execute("DELETE FROM users;")
        db.execute("DELETE FROM machines;")
        db.execute("DELETE FROM products;")


reset_db()

