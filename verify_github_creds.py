import os
import requests
from dotenv import load_dotenv

load_dotenv()

owner = os.getenv("GITHUB_REPO_OWNER")
repo = os.getenv("GITHUB_REPO_NAME")
token = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")

print(f"Checking access for {owner}/{repo}...")

if not token:
    print("Error: No GITHUB_PAT or PAT_TOKEN found in environment.")
    exit(1)

headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github.v3+json"
}

# Check Repo
url = f"https://api.github.com/repos/{owner}/{repo}"
resp = requests.get(url, headers=headers)

if resp.status_code == 200:
    print("SUCCESS: Repository found and accessible.")
    print(f"Permissions: {resp.json().get('permissions')}")
else:
    print(f"FAILED: Could not access repository. Status: {resp.status_code}")
    print(f"Response: {resp.text}")

# Check Workflow
workflow_file = "run.yml"
url_workflow = f"https://api.github.com/repos/{owner}/{repo}/contents/.github/workflows/{workflow_file}"
resp_workflow = requests.get(url_workflow, headers=headers)

if resp_workflow.status_code == 200:
    print(f"SUCCESS: Workflow file '{workflow_file}' found.")
else:
    print(f"FAILED: Workflow file '{workflow_file}' not found. Status: {resp_workflow.status_code}")
