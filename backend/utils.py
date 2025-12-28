import logging
import os
import time
import functools
from typing import Any, Callable
from github import GithubException, Github

def setup_logging() -> logging.Logger:
    logger = logging.getLogger('AutoGitGrow')
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        # Create handlers
        try:
            from rich.logging import RichHandler
            c_handler: logging.Handler = RichHandler(rich_tracebacks=True)
        except ImportError:
            c_handler = logging.StreamHandler()

        from logging.handlers import RotatingFileHandler
        f_handler = RotatingFileHandler('autostargrow.log', maxBytes=5*1024*1024, backupCount=5)

        # Create formatters and add it to handlers
        c_format = logging.Formatter('%(message)s') if 'rich' in globals() else logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        c_handler.setFormatter(c_format)
        f_handler.setFormatter(f_format)

        # Add handlers to the logger
        logger.addHandler(c_handler)
        logger.addHandler(f_handler)

    return logger

logger = setup_logging()

def handle_rate_limit(gh: Github) -> None:
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

def github_retry(func: Callable[..., Any]) -> Callable[..., Any]:
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        while True:
            try:
                return func(*args, **kwargs)
            except GithubException as e:
                # PyGithub 403 rate limit handling
                if e.status == 403 and 'rate limit exceeded' in str(e):
                    # Attempt to find the Github object in args
                    gh_obj = None
                    for arg in args:
                        if hasattr(arg, 'get_rate_limit'):
                            gh_obj = arg
                            break

                    if gh_obj:
                        handle_rate_limit(gh_obj)
                    else:
                        logger.error("Rate limit exceeded but could not find Github object to check reset time.")
                        time.sleep(60) # Fallback sleep
                else:
                    logger.error(f"GitHub API error in {func.__name__}: {e}")
                    raise
    return wrapper
