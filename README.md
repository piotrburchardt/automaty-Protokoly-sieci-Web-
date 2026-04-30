# Vending Machine Management System

A full-stack web application for managing a network of vending machines — built with **FastAPI** + **React 19**.  
Features real-time updates via SSE, JWT-based auth with role separation, and a clean REST API.

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20httpOnly%20cookie-orange)

---

## Features

- **Full CRUD REST API** — products, machines, orders, issues
- **Authentication** — register / login / logout with JWT stored in `httpOnly` cookie (XSS-safe)
- **Role-based access** — `guest` (no token), `user`, `admin`
- **Real-time admin dashboard** — SSE stream pushes new orders, issues, and machine status changes in near real-time (3s interval), eliminating the need for client polling
- **Machine inventory** — track stock per machine, per product
- **Purchase history** — per-user order log with payment method
- **Issue reporting** — users can report broken machines

---

## Tech Stack

### Backend
| Tech | Role |
|---|---|
| **FastAPI** | REST framework, routing, request validation (Pydantic) |
| **SQLite** (`stdlib sqlite3`) | Database — raw SQL, no ORM |
| **PyJWT** | JWT generation & verification |
| **bcrypt** | Password hashing |
| **SSE** (Server-Sent Events) | Real-time push to frontend |
| **Uvicorn** | ASGI server |
| **python-dotenv** | Environment variables |

### Frontend
| Tech | Role |
|---|---|
| **React 19** | UI |
| **React Router DOM v7** | SPA navigation |
| **Vite** | Build tool / dev server |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│                                                     │
│  React 19 SPA (Vite)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │HomePage  │ │ Machines │ │  AdminLivePage        │ │
│  │ Products │ │  Orders  │ │  (SSE EventSource)    │ │
│  │  Issues  │ │ Auth     │ └──────────────────────┘ │
│  └──────────┘ └──────────┘                          │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / SSE
┌───────────────────▼─────────────────────────────────┐
│                FastAPI (Uvicorn)                     │
│                                                     │
│  /products   /machines   /orders   /issues          │
│  /auth       /sse/admin                             │
│                                                     │
│  JWT middleware  │  bcrypt  │  Pydantic models      │
└───────────────────┬─────────────────────────────────┘
                    │ sqlite3
┌───────────────────▼─────────────────────────────────┐
│                  SQLite (app.db)                     │
│                                                     │
│  products · machines · machine_inventory            │
│  users · orders · issues                            │
└─────────────────────────────────────────────────────┘
```

---

## How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/piotrburchardt/vending-machine-manager.git
cd vending-machine-manager
```

### 2. Backend

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your-random-secret-here
```

Generate a secure secret with:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Run backend

```bash
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Login, sets cookie |
| `POST` | `/auth/logout` | cookie | Clear session |
| `GET` | `/auth/me` | cookie | Current user info |
| `GET` | `/products` | — | List products |
| `POST` | `/products` | admin | Create product |
| `PUT` | `/products/{id}` | admin | Update product |
| `DELETE` | `/products/{id}` | admin | Archive product |
| `GET` | `/machines` | — | List machines |
| `GET` | `/machines/{id}` | — | Machine detail + inventory |
| `POST` | `/orders` | user | Place order |
| `GET` | `/orders` | user | Purchase history |
| `POST` | `/issues` | user | Report issue |
| `GET` | `/issues` | admin | List issues |
| `GET` | `/sse/admin` | admin | Real-time event stream |

---

## Database Schema

```
products          machines             users
─────────         ────────────         ─────────
id                id                   id
name              city                 username (unique)
price             location             password_hash
grams             status               role
is_archived       is_archived

machine_inventory          orders                issues
─────────────────          ──────                ──────
machine_id (FK)            id                    id
product_id (FK)            machine_id (FK)       machine_id (FK)
qty                        product_id (FK)       title
                           price                 description
                           created_at            created_at
                           payment_method
                           user_id (FK)
```
