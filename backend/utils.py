import logging
import os

def setup_logging():
    logger = logging.getLogger('AutoGitGrow')
    logger.setLevel(logging.INFO)

    # Create handlers
    c_handler = logging.StreamHandler()
    f_handler = logging.FileHandler('autostargrow.log')

    # Create formatters and add it to handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    c_handler.setFormatter(formatter)
    f_handler.setFormatter(formatter)

    # Add handlers to the logger
    if not logger.handlers: # Prevent adding multiple handlers if setup_logging is called multiple times
        logger.addHandler(c_handler)
        logger.addHandler(f_handler)
    return logger

logger = setup_logging()

import time
import functools
from github import GithubException

def handle_rate_limit(gh):
    """Pauses script execution until the GitHub API rate limit is reset."""
    try:
        rate_limit = gh.get_rate_limit()
        reset_time = rate_limit.core.reset.timestamp()
        sleep_duration = max(0, reset_time - time.time())
        if sleep_duration > 0:
            logger.warning(f"Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
            time.sleep(sleep_duration)
    except Exception as e:
        logger.error(f"Error handling rate limit: {e}")

def github_retry(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        while True:
            try:
                return func(*args, **kwargs)
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data.get('message', ''):
                    # Attempt to find the Github object in args
                    gh_obj = None
                    for arg in args:
                        if hasattr(arg, 'get_rate_limit'):
                            gh_obj = arg
                            break

                    if gh_obj:
                        handle_rate_limit(gh_obj)
                    else:
                        logger.error(f"Rate limit exceeded but could not find Github object to check reset time.")
                        time.sleep(60) # Fallback sleep
                else:
                    logger.error(f"GitHub API error in {func.__name__}: {e}")
                    raise
    return wrapper
