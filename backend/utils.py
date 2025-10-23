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
