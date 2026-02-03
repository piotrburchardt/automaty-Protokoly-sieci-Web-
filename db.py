import sqlite3

DB = "app.db"


def connect():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON;")
    return db


def init_db():
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS products (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              price INTEGER NOT NULL,
              grams INTEGER NOT NULL,
              is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS machines (
              id INTEGER PRIMARY KEY,
              city TEXT NOT NULL,
              location TEXT NOT NULL,
              status TEXT NOT NULL,
              is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS machine_inventory (
              machine_id INTEGER NOT NULL,
              product_id INTEGER NOT NULL,
              qty INTEGER NOT NULL,
              PRIMARY KEY (machine_id, product_id),
              FOREIGN KEY (machine_id) REFERENCES machines (id) ON DELETE CASCADE,
              FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY,
              username TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS orders (
              id INTEGER PRIMARY KEY,
              machine_id INTEGER NOT NULL,
              product_id INTEGER NOT NULL,
              price INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              payment_method TEXT NOT NULL,
              user_id INTEGER,
              FOREIGN KEY (machine_id) REFERENCES machines (id),
              FOREIGN KEY (product_id) REFERENCES products (id),
              FOREIGN KEY (user_id) REFERENCES users (id)
            );

            CREATE TABLE IF NOT EXISTS issues (
              id INTEGER PRIMARY KEY,
              machine_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (machine_id) REFERENCES machines (id)
            );
            """
        )
        