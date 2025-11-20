import requests
import os

API_KEY = "kwkeirjwejrwejrw123123"
URL = "http://localhost:8000/api/automation/run"

try:
    resp = requests.post(
        URL,
        json={"action": "gitgrow"},
        headers={"X-Automation-Key": API_KEY}
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
