import sys
import os
import asyncio

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

async def verify_robustness():
    print("Verifying Phase 2: System Robustness...")

    try:
        print("1. Testing Scheduler Import...")
        from backend.scheduler import scheduler, start_scheduler, shutdown_scheduler
        print("   - Scheduler module imported successfully.")

        print("2. Testing Rate Limiter Import...")
        from backend.rate_limiter import RateLimiter, RateLimitMiddleware
        print("   - Rate Limiter module imported successfully.")

        print("3. Testing Rate Limiter Logic...")
        limiter = RateLimiter(capacity=2, refill_rate=1)
        assert limiter.check("test_key") == True, "First check should pass"
        assert limiter.check("test_key") == True, "Second check should pass"
        assert limiter.check("test_key") == False, "Third check should fail (capacity 2)"
        print("   - Rate Limiter logic verified.")

        print("4. Testing Scheduler Startup (Mock)...")
        # We won't actually start it to avoid async loop issues in this script,
        # but we verified the import and function existence.
        assert hasattr(scheduler, 'add_job'), "Scheduler should have add_job method"
        print("   - Scheduler instance looks correct.")

        print("Phase 2 Verification PASSED!")

    except Exception as e:
        print(f"Phase 2 Verification FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(verify_robustness())
