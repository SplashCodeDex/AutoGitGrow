# Start Docker Compose in detached mode
Write-Host "Starting AutoGitGrow in Docker..."
docker compose up --build -d

# Wait for a moment to ensure containers are initializing
Write-Host "Waiting for services to initialize..."
Start-Sleep -Seconds 5

# Open the frontend in the default browser
Write-Host "Opening http://localhost..."
Start-Process "http://localhost"

Write-Host "Done! App is running at http://localhost"
Write-Host "To stop the app, run: docker compose down"
