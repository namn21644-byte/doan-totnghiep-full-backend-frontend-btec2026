import os


class Config:
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    DEFAULT_SCAN_TIMEOUT = int(os.getenv('DEFAULT_SCAN_TIMEOUT', '300'))
    PORT = int(os.getenv('PORT', '6000'))
