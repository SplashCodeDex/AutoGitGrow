#!/usr/bin/env python3
import random
import sys
from pathlib import Path

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger

min_val = 5
max_val = 50

batch_size = random.randint(min_val, max_val)
logger.info(f"Generated batch size: {batch_size}")

with open("batch_size.env", "w") as f:
    f.write(f"FOLLOWERS_PER_RUN={batch_size}")
