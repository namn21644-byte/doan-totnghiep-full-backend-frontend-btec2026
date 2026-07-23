import os
from dotenv import load_dotenv

load_dotenv()


class AgentConfig:
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
    DEVICE_API_KEY = os.getenv('DEVICE_API_KEY', '')
    POLL_INTERVAL_SECONDS = int(os.getenv('POLL_INTERVAL_SECONDS', '60'))
    STATE_FILE_PATH = os.getenv('STATE_FILE_PATH', 'agent_state.json')
    ENABLE_HEARTBEAT = os.getenv('ENABLE_HEARTBEAT', 'true').lower() == 'true'
