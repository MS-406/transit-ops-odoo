# TransitOps: Smart Transport Operations Platform

TransitOps is a full-featured transport and fleet operations platform built to simplify how organizations manage vehicles, drivers, trips, maintenance, and expenses. It pairs a modern, responsive frontend (React + Vite) with a robust, async backend (FastAPI + PostgreSQL) to give every stakeholder a single, reliable source of truth for daily operations.

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-see%20LICENSE-lightgrey)

## Table of Contents
- [Project Report](#project-report)
  - [Overview](#overview)
  - [Key Features](#key-features)
  - [Standout Enhancements](#-standout-enhancements)
  - [Languages & Technology Stack](#languages--technology-stack)
  - [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#0-prerequisites)
  - [Database Setup](#1-database-setup)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [Logging In](#4-logging-in)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

## Project Report

### Overview
TransitOps is designed to give an entire organization one unified view of its transport logistics — letting Admins, Fleet Managers, Dispatchers, Drivers, Safety Officers, and Financial Analysts each monitor, manage, and analyze the operations that matter to their role.

### Key Features
- **Unified Dashboard** — live metrics, recent alerts, and real-time operational status at a glance.
- **Role-Based Access Control (RBAC)** — secure, tailored access for Admins, Fleet Managers, Dispatchers, Drivers, Safety Officers, and Financial Analysts.
- **Fleet & Driver Management** — detailed, up-to-date records of vehicles and driver compliance.
- **Trip Tracking** — visibility into ongoing trips as well as historical routes.
- **Maintenance Logs** — scheduled and reactive maintenance tracking to minimize vehicle downtime.
- **Fuel & Expenses** — fuel consumption logging and operational cost calculation.
- **Audit Logs** — a secure, tamper-proof history of every critical system action.

### 🌟 Standout Enhancements
- **Smart Operational Insights Panel** — dashboard cards that compute key metrics directly from live database data, including top-performing drivers/vehicles, best fuel efficiency, highest maintenance costs, and overall fleet utilization.
- **Automated Driver Compliance Alerts** — real-time license expiry monitoring with color-coded badges (valid, <30 days, <7 days, expired), surfaced on both the dashboard and the driver management portal to keep the fleet legally compliant.
- **Advanced Dashboard Analytics** — rich charts covering vehicle/driver status distribution, monthly fuel and maintenance spend, and per-vehicle operational costs, complete with trend indicators (↑/↓).
- **Advanced Trip Workflows** — full trip lifecycle management (dispatch, complete, cancel, reject) backed by strict real-time state validation.
- **Driver Empowerment** — a dedicated driver portal so drivers can manage their own dispatched trips, complete journeys, and log related data directly from the road.
- **Smart Expense Integration** — trip completion connects automatically to the Fuel & Expenses ledger: fuel costs are auto-calculated and logged, and a persistent banner reminds drivers to log any outstanding toll or maintenance expenses right after a trip ends.
- **Real-Time Automated Data Pipelines** — Fleet, Trips, Fuel, and Audit logs are all wired to live data. Completing a trip automatically frees the vehicle, updates its odometer, logs fuel consumption to the shared ledger, and creates an immutable audit trail — no mock data involved.

### Languages & Technology Stack

**Languages**
- **Python 3.11+** — backend services, data models, and business logic.
- **JavaScript (ES2022+) / JSX** — frontend application code and components.
- **SQL** — schema design and query logic (via SQLAlchemy and Alembic migrations).
- **HTML5 & CSS3** — markup and styling, augmented with Tailwind CSS utility classes.

**Frontend**
| Tool | Purpose |
|---|---|
| React 18 | Component-based UI library |
| Vite | Dev server and build tooling |
| Tailwind CSS | Utility-first styling |
| Zustand | Lightweight state management |
| React Router | Client-side routing |
| React Query | Server-state fetching, caching, and sync |

**Backend**
| Tool | Purpose |
|---|---|
| FastAPI | Async Python web framework and REST API layer |
| SQLAlchemy (async) | ORM and database access layer |
| Alembic | Database schema migrations |
| PostgreSQL | Primary relational data store |
| Pydantic | Request/response validation and settings management |
| Uvicorn | ASGI server |

**Tooling & Ops**
- **npm** — frontend package management.
- **pip / venv** — backend dependency and environment management.
- **ESLint / Prettier** (if configured) — frontend linting and formatting.
- **pytest** (if configured) — backend testing.

### Project Structure

A typical layout for the project (adjust to match your actual repo):

```
transitops/
├── app/                  # FastAPI backend
│   ├── api/              # Route handlers / endpoints
│   ├── core/             # Config, security, settings
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   └── main.py           # App entry point
├── alembic/              # Database migration scripts
├── src/                  # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level views
│   ├── store/            # Zustand stores
│   └── main.jsx          # Frontend entry point
├── seed.py               # Seed script for default roles/users
├── create_db.py          # Database initialization script
├── requirements.txt      # Python dependencies
├── package.json          # Node dependencies
└── README.md
```

---

## Getting Started

Follow these steps to run TransitOps locally.

### 0. Prerequisites
Make sure you have the following installed before you begin:
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **PostgreSQL 14+**
- **git** (to clone the repository)

### 1. Database Setup
Make sure **PostgreSQL** is installed and running on your machine.
1. Create a local PostgreSQL database for the project, or let the initialization script handle it for you.
2. Confirm your `.env` file (or `app/core/config.py`) has the correct database URL, e.g.:
   ```
   postgresql+asyncpg://postgres:password@localhost:5432/transitops
   ```

### 2. Backend Setup
The backend runs on FastAPI. From the project root:

```bash
# Create and activate a virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create the database (if it doesn't already exist)
python create_db.py

# Run Alembic migrations to set up the schema
alembic upgrade head

# Seed the database with default roles and test users
python seed.py

# Start the FastAPI server
uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup
The frontend runs on React and Vite. Open a **new terminal tab/window** (keep the backend running) and run:

```bash
# Install Node.js dependencies
npm install

# Start the Vite dev server
npm run dev
```

The web app will be available at `http://localhost:5173`.

### 4. Logging In
With both servers running, go to `http://localhost:5173/login`.

Log in with any of the seeded test accounts — all use the password `password123`:

| Email | Role |
|---|---|
| `admin@transitops.com` | System Admin |
| `manager@transitops.com` | Fleet Manager |
| `driver@transitops.com` | Driver |
| `safety@transitops.com` | Safety Officer |
| `analyst@transitops.com` | Financial Analyst |

Prefer to skip the backend? Toggle **Sandbox Mode** on the login page to explore the UI without a live server.

---

## Environment Variables

Configure the backend via a `.env` file in the project root (or directly in `app/core/config.py`):

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:password@localhost:5432/transitops` |
| `SECRET_KEY` | Key used to sign auth tokens | `change-me-in-production` |
| `ENVIRONMENT` | Runtime environment flag | `development` / `production` |

> Never commit real secrets or production credentials — keep `.env` in `.gitignore`.

## Running Tests

```bash
# Backend tests
pytest

# Frontend tests (if configured)
npm run test
```

## Contributing

Contributions are welcome. To propose a change:
1. Fork the repository and create a feature branch.
2. Make your changes, following the existing code style.
3. Add or update tests where relevant.
4. Open a pull request describing what changed and why.

Please open an issue first for larger changes so they can be discussed before implementation.

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file included in this repository.
