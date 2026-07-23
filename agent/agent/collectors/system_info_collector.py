import platform
import socket
import datetime


class SystemInfoCollector:
    def collect(self):
        return {
            'logType': 'agent_heartbeat',
            'source': 'agent',
            'severity': 'info',
            'eventId': None,
            'rawMessage': f"Agent heartbeat from {socket.gethostname()}",
            'parsedData': {
                'hostname': socket.gethostname(),
                'osType': platform.system(),
                'osVersion': platform.version(),
                'architecture': platform.machine()
            },
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
