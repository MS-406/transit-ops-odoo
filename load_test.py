import asyncio
import httpx
import uuid
from datetime import date, timedelta

BASE = "http://127.0.0.1:8000/api"

async def setup_data():
    async with httpx.AsyncClient() as client:
        # 1. Login
        resp = await client.post(f"{BASE}/auth/login", json={"email": "manager@transitops.com", "password": "password123"})
        if resp.status_code not in (200, 201):
            print(f"Login failed: {resp.text}")
            return None, None
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        run_id = str(uuid.uuid4())[:8]
        
        # 2. Create Vehicle
        v_data = {
            "registration_number": f"LD-{run_id}",
            "type": "Truck",
            "name_model": "Load Test Model",
            "capacity_kg": 5000.0,
            "max_load_capacity": 5000.0,
            "region": "LoadTest",
            "status": "Available",
            "acquisition_cost": 50000.0
        }
        resp = await client.post(f"{BASE}/vehicles", json=v_data, headers=headers)
        if resp.status_code not in (200, 201):
            print(f"Vehicle create failed: {resp.text}")
            return None, None
        v_id = resp.json()["id"]
        
        # 3. Create Driver
        d_data = {
            "name": f"Load Driver {run_id}",
            "license_number": f"LDL-{run_id}",
            "license_category": "C",
            "license_expiry_date": (date.today() + timedelta(days=365)).isoformat(),
            "contact_number": "5550000",
            "status": "Available"
        }
        resp = await client.post(f"{BASE}/drivers", json=d_data, headers=headers)
        if resp.status_code not in (200, 201):
            print(f"Driver create failed: {resp.text}")
            return None, None
        d_id = resp.json()["id"]
        
        # 4. Create Trip
        t_data = {
            "source": "A",
            "destination": "B",
            "vehicle_id": v_id,
            "driver_id": d_id,
            "cargo_weight": 1000.0,
            "planned_distance": 100.0
        }
        resp = await client.post(f"{BASE}/trips", json=t_data, headers=headers)
        if resp.status_code not in (200, 201):
            print(f"Trip create failed: {resp.text}")
            return None, None
        t_id = resp.json()["id"]
        
        return token, t_id

async def dispatch_trip(client, token, trip_id):
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.patch(f"{BASE}/trips/{trip_id}/dispatch", headers=headers)
    return resp.status_code

async def main():
    print("Setting up data for load test...")
    token, trip_id = await setup_data()
    if not token or not trip_id:
        print("Setup failed, aborting.")
        return
        
    print(f"Executing 50 concurrent dispatch requests for trip {trip_id}...")
    
    async with httpx.AsyncClient() as client:
        tasks = [dispatch_trip(client, token, trip_id) for _ in range(50)]
        results = await asyncio.gather(*tasks)
        
    successes = results.count(200)
    conflicts = results.count(409) + results.count(400)
    
    print("\n--- Load Test Results ---")
    print(f"Total Requests: 50")
    print(f"Success (200): {successes}")
    print(f"Rejected (409/400): {conflicts}")
    
    if successes == 1 and conflicts == 49:
        print("\n✅ PASS: Exactly 1 dispatch succeeded. Concurrency lock is solid!")
    else:
        print("\n❌ FAIL: Concurrency violation detected or unexpected errors.")
        print(f"Statuses: {results}")

if __name__ == "__main__":
    asyncio.run(main())
