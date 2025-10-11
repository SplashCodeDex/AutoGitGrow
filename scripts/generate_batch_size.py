#!/usr/bin/env python3
import random

min_val = 5
max_val = 50

batch_size = random.randint(min_val, max_val)

with open("batch_size.env", "w") as f:
    f.write(f"FOLLOWERS_PER_RUN={batch_size}")
