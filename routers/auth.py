from fastapi import APIRouter, Response, Request
from pydantic import BaseModel

import jwt
import os

from db import connect
from security import verify_password, hash_password

router = APIRouter(prefix="/auth")

SECRET_KEY = os.getenv("JWT_SECRET")

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(data: LoginRequest, response: Response):
    with connect() as db:
        row = db.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            (data.username,),
        ).fetchone()
        if row is None:
            return Response(status_code=401)

        user = dict(row)
        if not verify_password(data.password, user["password_hash"]):
            return Response(status_code=401)
        
        token = jwt.encode(
            {
                "user_id": user["id"],
                "role": user["role"]
             },
            SECRET_KEY,
            algorithm="HS256"
        )

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True
        )

        return {"okay": True}

@router.post("/register")
def register(data: RegisterRequest):
    with connect() as db:
        exists = db.execute(
            "SELECT 1 FROM users WHERE username = ?",
            (data.username,),
        ).fetchone()

        if exists:
            return Response(status_code=409)

        password_hash = hash_password(data.password)
        db.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (data.username, password_hash, "user"),
        )
    return Response(status_code=201)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", httponly=True, samesite="lax")
    response.status_code = 204
    return response


@router.get("/me")
def auth_me(request: Request):
    token = request.cookies.get("access_token") # zwraca value po kluczu
    if not token:
        return Response(status_code=401)
    
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

    return {
        "user_id": payload["user_id"],
        "role": payload["role"]
    }
