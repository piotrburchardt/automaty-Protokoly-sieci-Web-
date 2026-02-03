from fastapi import FastAPI

from dotenv import load_dotenv
load_dotenv()

from db import init_db
from routers.products import router as products_router
from routers.machines import router as machines_router
from routers.orders import router as orders_router
from routers.issues import router as issues_router
from routers.auth import router as auth_router
from routers.sse import router as sse_router

app = FastAPI(title="automaty")


@app.on_event("startup")
def _startup():
    init_db()

app.include_router(products_router)
app.include_router(machines_router)
app.include_router(orders_router)
app.include_router(issues_router)
app.include_router(auth_router)
app.include_router(sse_router)
