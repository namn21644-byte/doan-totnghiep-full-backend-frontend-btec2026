import logging
import sys

logger = logging.getLogger('scan-service')
logger.setLevel(logging.DEBUG)

_handler = logging.StreamHandler(sys.stdout)
_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')
_handler.setFormatter(_formatter)

if not logger.handlers:
    logger.addHandler(_handler)
