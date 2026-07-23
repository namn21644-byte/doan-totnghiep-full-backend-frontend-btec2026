import requests


class ApiClient:
    def __init__(self, base_url, device_api_key, timeout=15):
        self.base_url = base_url.rstrip('/')
        self.device_api_key = device_api_key
        self.timeout = timeout

    def send_logs(self, logs):
        if not logs:
            return {'success': True, 'message': 'Không có log mới', 'data': {'inserted': 0}}

        url = f"{self.base_url}/api/v1/logs/ingest"
        headers = {
            'X-Device-Key': self.device_api_key,
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json={'logs': logs}, headers=headers, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
