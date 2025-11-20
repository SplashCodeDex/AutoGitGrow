import os
import requests
from dotenv import load_dotenv

load_dotenv()

owner = "SplashCodeDex"
repo = "AutoGitGrow" # Trying the directory name
token = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")

print(f"Checking access for {owner}/{repo}...")

headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github.v3+json"
}

# Check Repo
url = f"https://api.github.com/repos/{owner}/{repo}"
resp = requests.get(url, headers=headers)

if resp.status_code == 200:
    print("SUCCESS: Repository found.")
else:
    print(f"FAILED: Repository not found. Status: {resp.status_code}")

# Check Workflow
workflow_file = "run.yml"
url_workflow = f"https://api.github.com/repos/{owner}/{repo}/contents/.github/workflows/{workflow_file}"
resp_workflow = requests.get(url_workflow, headers=headers)

if resp_workflow.status_code == 200:
    print(f"SUCCESS: Workflow file '{workflow_file}' found.")
else:
    print(f"FAILED: Workflow file '{workflow_file}' not found. Status: {resp_workflow.status_code}")
