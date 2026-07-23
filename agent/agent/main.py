import json
import os
import platform
import time
import datetime

from agent.config import AgentConfig
from agent.sender.api_client import ApiClient
from agent.collectors.system_info_collector import SystemInfoCollector
from agent.collectors.linux_syslog_collector import LinuxSyslogCollector

IS_WINDOWS = platform.system().lower() == 'windows'

if IS_WINDOWS:
    from agent.collectors.windows_event_collector import WindowsEventCollector


def load_state():
    if os.path.exists(AgentConfig.STATE_FILE_PATH):
        try:
            with open(AgentConfig.STATE_FILE_PATH, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_state(state):
    with open(AgentConfig.STATE_FILE_PATH, 'w') as f:
        json.dump(state, f)


def run():
    if not AgentConfig.DEVICE_API_KEY:
        raise RuntimeError('DEVICE_API_KEY chưa được cấu hình trong .env')

    client = ApiClient(AgentConfig.BACKEND_URL, AgentConfig.DEVICE_API_KEY)
    system_collector = SystemInfoCollector()
    state = load_state()

    if IS_WINDOWS:
        windows_collector = WindowsEventCollector()
        last_ts_str = state.get('windows_last_timestamp')
        last_ts = (
            datetime.datetime.fromisoformat(last_ts_str)
            if last_ts_str
            else datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
        )
    else:
        linux_collector = LinuxSyslogCollector()
        linux_offsets = state.get('linux_offsets', {})

    print(f"[Agent] Bắt đầu chạy trên {platform.system()}, gửi log về {AgentConfig.BACKEND_URL}")

    while True:
        try:
            batch = []

            if AgentConfig.ENABLE_HEARTBEAT:
                batch.append(system_collector.collect())

            if IS_WINDOWS:
                events = windows_collector.collect(last_ts)
                if events:
                    batch.extend(events)
                    last_ts = datetime.datetime.utcnow()
                    state['windows_last_timestamp'] = last_ts.isoformat()
            else:
                logs, linux_offsets = linux_collector.collect(linux_offsets)
                batch.extend(logs)
                state['linux_offsets'] = linux_offsets

            if batch:
                result = client.send_logs(batch)
                print(f"[Agent] Đã gửi {len(batch)} log(s) - {result.get('message', '')}")

            save_state(state)

        except Exception as e:
            print(f"[Agent] Lỗi trong vòng lặp thu thập/gửi log: {e}")

        time.sleep(AgentConfig.POLL_INTERVAL_SECONDS)


if __name__ == '__main__':
    run()
