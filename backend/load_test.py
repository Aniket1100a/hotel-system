import requests
import concurrent.futures
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"

CREDENTIALS = {
    "owner": ("owner1", "owner123"),
    "manager": ("manager1", "manager123"),
    "waiter": ("waiter1", "waiter123"),
}

def get_auth_token(username, password):
    try:
        res = requests.post(f"{BASE_URL}/auth/login/", json={"username": username, "password": password}, timeout=5)
        if res.status_code == 200:
            return res.json().get("access")
        else:
            print(f"Failed to authenticate {username}: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Authentication exception for {username}: {e}")
    return None

def manager_action(token, worker_id):
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        f"{BASE_URL}/tables/",
        f"{BASE_URL}/menu/items/",
        f"{BASE_URL}/billing/",
        f"{BASE_URL}/orders/",
    ]
    target_url = endpoints[worker_id % len(endpoints)]

    start_time = time.time()
    try:
        res = requests.get(target_url, headers=headers, timeout=10)
        duration = time.time() - start_time
        if res.status_code in [200, 201]:
            return {"success": True, "duration": duration, "status_code": res.status_code}
        else:
            return {"success": False, "duration": duration, "status_code": res.status_code, "error": res.text}
    except Exception as e:
        duration = time.time() - start_time
        return {"success": False, "duration": duration, "error": str(e)}

def place_order(token, menu_items, tables, worker_id):
    if not menu_items or not tables:
        return {"success": False, "error": "No menu items or tables available"}

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    table = tables[worker_id % len(tables)]
    menu_item = menu_items[worker_id % len(menu_items)]

    payload = {
        "table": table["id"],
        "order_type": "DINE_IN",
        "notes": f"Load test order from worker {worker_id}",
        "items": [
            {
                "menu_item": menu_item["id"],
                "quantity": (worker_id % 3) + 1,
                "note": "Fast preparation please"
            }
        ]
    }

    start_time = time.time()
    try:
        res = requests.post(f"{BASE_URL}/orders/", json=payload, headers=headers, timeout=10)
        duration = time.time() - start_time
        if res.status_code in [200, 201]:
            return {"success": True, "duration": duration, "status_code": res.status_code}
        else:
            return {"success": False, "duration": duration, "status_code": res.status_code, "error": res.text}
    except Exception as e:
        duration = time.time() - start_time
        return {"success": False, "duration": duration, "error": str(e)}

def fetch_setup_data(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        menu_res = requests.get(f"{BASE_URL}/menu/items/", headers=headers, timeout=5)
        tables_res = requests.get(f"{BASE_URL}/tables/", headers=headers, timeout=5)

        menu_data = menu_res.json() if menu_res.status_code == 200 else []
        menu_items = menu_data.get("results", menu_data) if isinstance(menu_data, dict) else menu_data

        table_data = tables_res.json() if tables_res.status_code == 200 else []
        tables = table_data.get("results", table_data) if isinstance(table_data, dict) else table_data

        return list(menu_items), list(tables)
    except Exception as e:
        print(f"Error fetching setup data: {e}")
        return [], []

def run_load_test(role="waiter", num_requests=50, max_workers=10):
    username, password = CREDENTIALS.get(role, CREDENTIALS["waiter"])
    print(f"Starting load test for role '{role}' ({username}): {num_requests} requests with {max_workers} concurrent workers...")

    token = get_auth_token(username, password)
    if not token:
        print(f"Aborting load test due to authentication failure for role {role}.")
        return

    menu_items, tables = fetch_setup_data(token)
    print(f"Fetched {len(menu_items)} menu items and {len(tables)} tables.")

    results = []
    start_all = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        if role == "manager":
            futures = [executor.submit(manager_action, token, i) for i in range(num_requests)]
        else:
            futures = [executor.submit(place_order, token, menu_items, tables, i) for i in range(num_requests)]

        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    total_duration = time.time() - start_all

    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    durations = [r["duration"] for r in successful]
    avg_duration = sum(durations) / len(durations) if durations else 0

    print(f"\n--- Load Test Results ({role.upper()}) ---")
    print(f"Total Requests: {num_requests}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")
    print(f"Total Time: {total_duration:.2f} seconds")
    print(f"Throughput: {num_requests / total_duration:.2f} requests/sec")
    print(f"Average Latency: {avg_duration * 1000:.2f} ms")

    if failed:
        print("\nSample Errors:")
        for f in failed[:5]:
            print(f"- Status: {f.get('status_code')}, Error: {f.get('error')}")

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "waiter"
    n_req = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    n_workers = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    run_load_test(role, n_req, n_workers)
