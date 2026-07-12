"""Phase 3 CRUD, RBAC, and Business Rules verification script."""
import urllib.request
import urllib.error
import json
import sys
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = "http://127.0.0.1:8000/api"
PASS = 0
FAIL = 0

def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, {"detail": str(e)}

def check(name, condition, res=None):
    global PASS, FAIL
    if condition:
        print(f"✅ PASS: {name}")
        PASS += 1
    else:
        print(f"❌ FAIL: {name}")
        if res:
            print(f"   Response: {res}")
        FAIL += 1

import uuid

def main():
    print("\n--- Starting Phase 3 Integration Tests ---\n")
    
    # Generate unique suffixes for this run
    run_id = str(uuid.uuid4())[:8]
    
    # 1. Login to get tokens for different roles
    status, res = req("POST", "/auth/login", {"email": "manager@transitops.com", "password": "password123"})
    check("Admin login successful", status == 200, res)
    admin_token = res.get("access_token")
    
    status, res = req("POST", "/auth/login", {"email": "driver@transitops.com", "password": "password123"})
    check("Driver login successful", status == 200, res)
    driver_token = res.get("access_token")
    
    # 2. Vehicle CRUD (Admin)
    vehicle_payload = {
        "registration_number": f"TEST-{run_id}",
        "name_model": "Volvo VNL",
        "type": "Heavy Duty",
        "max_load_capacity": 20000.0,
        "acquisition_cost": 150000.0,
        "region": "North"
    }
    
    status, res = req("POST", "/vehicles", vehicle_payload, admin_token)
    check("Admin can create vehicle", status == 201, res)
    vehicle_id = res.get("id")
    
    # Check unauthorized creation
    status, res = req("POST", "/vehicles", vehicle_payload, driver_token)
    check("Driver CANNOT create vehicle (RBAC)", status == 403, res)
    
    # Duplicate registration check
    status, res = req("POST", "/vehicles", vehicle_payload, admin_token)
    check("Duplicate vehicle registration rejected", status == 400 and res.get("code") == "DUPLICATE_REGISTRATION", res)
    
    # Vehicle get and list
    status, res = req("GET", f"/vehicles/{vehicle_id}", token=driver_token)
    check("Driver can GET vehicle", status == 200, res)
    
    status, res = req("GET", "/vehicles", token=driver_token)
    check("Driver can list vehicles", status == 200 and len(res) >= 1, res)
    
    # Update vehicle
    status, res = req("PUT", f"/vehicles/{vehicle_id}", {"odometer": 500.5}, admin_token)
    check("Admin can update vehicle", status == 200 and res.get("odometer") == 500.5, res)
    
    # 3. Driver CRUD (Admin)
    driver_payload = {
        "name": "Test Driver",
        "license_number": f"LIC-{run_id}",
        "license_category": "Class A",
        "license_expiry_date": "2030-12-31",
        "contact_number": "555-0100"
    }
    
    status, res = req("POST", "/drivers", driver_payload, admin_token)
    check("Admin can create driver", status == 201, res)
    test_driver_id = res.get("id")
    
    # Expired license check
    expired_payload = {**driver_payload, "license_number": f"LIC-EXP-{run_id}", "license_expiry_date": "2020-01-01"}
    status, res = req("POST", "/drivers", expired_payload, admin_token)
    check("Cannot create driver with expired license", status == 400 and res.get("code") == "EXPIRED_LICENSE", res)
    
    # 4. Trip Lifecycle
    trip_payload = {
        "source": "Warehouse A",
        "destination": "Store B",
        "vehicle_id": vehicle_id,
        "driver_id": test_driver_id,
        "cargo_weight": 15000.0,
        "planned_distance": 100.0
    }
    
    status, res = req("POST", "/trips", trip_payload, admin_token)
    check("Admin can create trip (Draft)", status == 201 and res.get("status") == "Draft", res)
    trip_id = res.get("id")
    
    # Overweight check
    heavy_payload = {**trip_payload, "cargo_weight": 25000.0} # Exceeds 20000 limit
    status, res = req("POST", "/trips", heavy_payload, admin_token)
    check("Overweight trip rejected", status == 400 and res.get("code") == "OVERWEIGHT")
    
    # Dispatch trip
    status, res = req("POST", f"/trips/{trip_id}/dispatch", token=admin_token)
    check("Admin can dispatch trip", status == 200 and res.get("status") == "Dispatched")
    
    # Check vehicle and driver statuses changed to On Trip
    status, v_res = req("GET", f"/vehicles/{vehicle_id}", token=admin_token)
    check("Vehicle status updated to On Trip", v_res.get("status") == "On Trip")
    status, d_res = req("GET", f"/drivers/{test_driver_id}", token=admin_token)
    check("Driver status updated to On Trip", d_res.get("status") == "On Trip")
    
    # Complete trip without actuals (should fail)
    status, res = req("POST", f"/trips/{trip_id}/complete", token=admin_token)
    check("Cannot complete trip without actuals", status == 400 and res.get("code") == "MISSING_DATA")
    
    # Update actuals then complete (using driver token)
    status, res = req("PUT", f"/trips/{trip_id}", {"actual_distance": 105.0, "fuel_consumed": 20.5, "final_odometer": 605.5}, admin_token)
    status, res = req("POST", f"/trips/{trip_id}/complete", token=driver_token)
    check("Driver can complete trip with actuals", status == 200 and res.get("status") == "Completed")
    
    # Check vehicle and driver statuses reverted to Available
    status, v_res = req("GET", f"/vehicles/{vehicle_id}", token=admin_token)
    check("Vehicle status reverted to Available, odometer updated", v_res.get("status") == "Available" and v_res.get("odometer") == 605.5)
    
    # 5. Cleanup
    status, res = req("DELETE", f"/drivers/{test_driver_id}", token=admin_token)
    check("Cannot delete driver with trips (FK check)", status == 400 and res.get("code") == "FOREIGN_KEY_VIOLATION")

    print(f"\n--- Summary: {PASS} Passed, {FAIL} Failed ---")
    if FAIL > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
