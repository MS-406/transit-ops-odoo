# TransitOps: Smart Transport Operations Platform

TransitOps is a comprehensive transport and fleet operations platform designed to streamline the management of vehicles, drivers, trips, maintenance, and expenses. It features a modern, responsive web application powered by React and Vite on the frontend, and a robust, async FastAPI and PostgreSQL architecture on the backend.

## Project Report

### Overview
The goal of this project is to provide a single pane of glass for transport logistics, allowing different stakeholders in an organization to monitor, manage, and analyze operations based on their specific roles.

### Key Features
- **Unified Dashboard**: Live metrics, recent alerts, and real-time operational status.
- **Role-Based Access Control (RBAC)**: Secure access tailored for Admins, Fleet Managers, Dispatchers, Drivers, Safety Officers, and Financial Analysts.
- **Fleet & Driver Management**: Maintain detailed records of vehicles and driver compliance.
- **Trip Tracking**: Monitor ongoing trips and historical routes.
- **Maintenance Logs**: Track scheduled and reactive maintenance to minimize downtime.
- **Fuel & Expenses**: Log fuel consumption and calculate operational costs.
- **Audit Logs**: Maintain a secure, tamper-proof history of critical system actions.

### 🌟 Extraordinary Enhancements
- **Smart Operational Insights Panel**: Dynamic dashboard cards calculating key metrics natively from live database data, including top performing drivers/vehicles, best fuel efficiency, highest maintenance costs, and total fleet utilization.
- **Automated Driver Compliance Alerts**: Real-time driver license expiry monitoring with color-coded warning badges (valid, <30 days, <7 days, expired) actively integrated into the dashboard and driver management portal to ensure strict legal compliance.
- **Advanced Dashboard Analytics**: Rich visualization charts detailing vehicle/driver status distributions, monthly fuel & maintenance expenses, and precise operational costs per vehicle, complete with historical trend indicators (↑/↓).
- **Advanced Trip Workflows**: Comprehensive lifecycle management including Dispatching, Completing, Canceling, and Rejecting trips with strict real-time state validations.
- **Driver Empowerment**: A dedicated driver portal allowing drivers to manage their own dispatched trips, complete journeys, and immediately log associated data, bridging the gap between the road and the back-office.
- **Smart Expense Integration**: Seamlessly connects Trip completion with the Fuel & Expenses ledger. Fuel costs are auto-calculated and logged, and a smart persistent banner instantly reminds drivers to log pending toll/maintenance expenses right after a trip finishes.
- **Real-Time Automated Data Pipelines**: Fleet, Trips, Fuel, and Audit logs interact with live data natively. Completing a trip automatically frees up the vehicle, updates its odometer, logs fuel consumption to the unified ledger, and generates immutable audit trails—all without any hardcoded mock data.

### Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Zustand (State Management), React Router, React Query.
- **Backend**: Python, FastAPI, SQLAlchemy (Async), Alembic (Migrations), PostgreSQL.

---

## How to Start the App

Follow these steps to run the application locally on your machine.

### 1. Database Setup
Ensure you have **PostgreSQL** installed and running on your machine.
1. Create a local PostgreSQL database for the project, or let the initialization script handle it.
2. Ensure your `.env` file or `app/core/config.py` contains the correct database URL (e.g., `postgresql+asyncpg://postgres:password@localhost:5432/transitops`).

### 2. Backend Setup
The backend is built with FastAPI. Open a terminal and run the following commands from the root directory:

```bash
# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# Install the required Python dependencies
pip install -r requirements.txt

# Create the database (if it doesn't exist)
python create_db.py

# Run Alembic migrations to set up the database schema
alembic upgrade head

# Seed the database with default roles and test users
python seed.py

# Start the FastAPI server
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup
The frontend is built with React and Vite. Open a **new terminal tab/window**, keep the backend running, and run the following commands:

```bash
# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```
The web application will be available at `http://localhost:5173`.

### 4. Logging In
Once both servers are running, navigate to `http://localhost:5173/login` in your browser.

You can log in using the live server API with the seeded test accounts. All passwords are `password123`:
- `admin@transitops.com` (System Admin)
- `manager@transitops.com` (Fleet Manager)
- `driver@transitops.com` (Driver)
- `safety@transitops.com` (Safety Officer)
- `analyst@transitops.com` (Financial Analyst)

Alternatively, you can toggle **Sandbox Mode** on the login page to explore the UI without requiring the backend server to be online.
