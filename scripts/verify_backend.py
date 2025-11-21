import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    print("Attempting to import backend.main...")
    import backend.main
    print("Successfully imported backend.main")

    print("Attempting to import backend.services.growth_service...")
    import backend.services.growth_service
    print("Successfully imported backend.services.growth_service")

    print("Attempting to import backend.services.star_service...")
    import backend.services.star_service
    print("Successfully imported backend.services.star_service")

    print("Attempting to import backend.automation...")
    import backend.automation
    print("Successfully imported backend.automation")

    print("Attempting to import backend.database...")
    import backend.database
    print("Successfully imported backend.database")

    print("Backend verification successful!")
except Exception as e:
    print(f"Backend verification failed: {e}")
    sys.exit(1)
