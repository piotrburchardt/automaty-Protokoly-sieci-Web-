from db import connect
from security import hash_password


def seed_db():
    with connect() as db:
        # USERS
        users = [
            ("admin", "admin", "admin"),
            ("user", "user", "user"),
            ("user2", "123", "user")
        ]
        
        for username, password, role in users:
            db.execute(
                "INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?);",
                (username, hash_password(password), role),
            )

        # PRODUCTS
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (1, 'Baton', 299, 50);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (2, 'Woda', 249, 500);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (3, 'Cola', 399, 500);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (4, 'Czipsy', 599, 140);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (5, 'Kawa', 699, 250);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (6, 'Herbata', 499, 250);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (7, 'Ciastko', 299, 80);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (8, 'Bułka', 199, 60);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (9, 'Kanapka', 699, 220);")
        db.execute("INSERT OR IGNORE INTO products (id, name, price, grams) VALUES (10, 'Sałatka', 1299, 300);")

        # MACHINES
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (1, 'Gdańsk', 'Dworzec', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (2, 'Gdynia', 'Uniwersytet', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (3, 'Sopot', 'Dworzec', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (4, 'Gdańsk', 'Uniwersytet', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (5, 'Gdańsk', 'Centrum', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (6, 'Gdańsk', 'Park', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (7, 'Malbork', 'Dworzec', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (8, 'Malbrok', 'Zamek', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (9, 'Gdańsk', 'Rynek', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (10, 'Malbork', 'Rynek', 'aktywny');")
        db.execute("INSERT OR IGNORE INTO machines (id, city, location, status) VALUES (11, 'Malbrok', 'Ratusz', 'aktywny');")

        # INVENTORY
        for machine_id in range(1, 9):
            for product_id in range(1, 11):
                db.execute(
                    "INSERT OR REPLACE INTO machine_inventory (machine_id, product_id, qty) VALUES (?, ?, ?);",
                    (machine_id, product_id, 5),)

        # ORDERS 
        db.execute(
            "INSERT INTO orders (machine_id, product_id, price, created_at, payment_method, user_id) "
            "VALUES (1, 1, 450, '2026-01-30 12:00:00', 'blik', 2);"
        )
        db.execute(
            "INSERT INTO orders (machine_id, product_id, price, created_at, payment_method, user_id) "
            "VALUES (2, 3, 550, '2026-01-30 12:05:00', 'blik', 2);"
        )

        # ISSUES
        db.execute(
            "INSERT OR IGNORE INTO issues (id, machine_id, title, description, created_at) "
            "VALUES (1, 1, 'Brak monet', 'Automat nie wydaje monet', '2026-01-28 09:00');"
        )
        db.execute(
            "INSERT OR IGNORE INTO issues (id, machine_id, title, description, created_at) "
            "VALUES (2, 2, 'Zacięty produkt', 'Produkt utknął', '2026-01-29 11:30');"
        )

seed_db()
