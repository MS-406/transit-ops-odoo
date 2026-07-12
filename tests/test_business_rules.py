import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from datetime import date, timedelta

from app.main import app

BASE_URL = "http://test"

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE_URL) as ac:
        yield ac

@pytest_asyncio.fixture
async def auth_headers(client):
    response = await client.post("/api/auth/login", json={
        "email": "manager@transitops.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



@pytest.mark.asyncio
async def test_auth_invalid_credentials(client):
    response = await client.post("/api/auth/login", json={
        "email": "manager@transitops.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"



@pytest.mark.asyncio
async def test_fuel_negative_costs_rejected(client, auth_headers):
    payload = {
        "vehicle_id": 1,
        "liters": -50.0,
        "cost": 100.0,
        "log_date": date.today().isoformat()
    }
    response = await client.post("/api/fuel-logs", json=payload, headers=auth_headers)
    assert response.status_code == 422 # Pydantic validation error

    payload2 = {
        "vehicle_id": 1,
        "liters": 50.0,
        "cost": -100.0,
        "log_date": date.today().isoformat()
    }
    response2 = await client.post("/api/fuel-logs", json=payload2, headers=auth_headers)
    assert response2.status_code == 422
    
@pytest.mark.asyncio
async def test_future_date_rejected(client, auth_headers):
    payload = {
        "vehicle_id": 1,
        "liters": 50.0,
        "cost": 100.0,
        "log_date": (date.today() + timedelta(days=5)).isoformat()
    }
    response = await client.post("/api/fuel-logs", json=payload, headers=auth_headers)
    assert response.status_code == 422
