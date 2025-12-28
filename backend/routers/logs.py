import os
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["logs"])

async def log_generator():
    """Generates a stream of log lines from autostargrow.log."""
    log_file = "autostargrow.log"
    if not os.path.exists(log_file):
        yield f"data: Log file {log_file} not found.\\n\\n"
        return

    try:
        # Open file in non-blocking mode or just read line by line
        with open(log_file, "r") as f:
            # Seek to end to only show new logs? Or show last N lines?
            # For now, let's show the last 1000 bytes and then tail
            f.seek(0, os.SEEK_END)
            file_size = f.tell()
            f.seek(max(file_size - 2000, 0), os.SEEK_SET)

            while True:
                line = f.readline()
                if line:
                    yield f"data: {line.strip()}\\n\\n"
                else:
                    await asyncio.sleep(0.5)
    except Exception as e:
        yield f"data: Error reading log file: {e}\\n\\n"

@router.get("/api/automation/logs/stream")
async def stream_logs(request: Request):
    return StreamingResponse(log_generator(), media_type="text/event-stream")
