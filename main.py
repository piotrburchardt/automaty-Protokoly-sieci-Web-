from fastapi import FastAPI

from db import init_db
from routers.products import router as products_router

app = FastAPI(title="automaty")


@app.on_event("startup")
def _startup():
    init_db()

app.include_router(products_router)
