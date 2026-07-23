import datetime

import win32evtlog
import win32evtlogutil
import win32con

SEVERITY_MAP = {
    win32con.EVENTLOG_ERROR_TYPE: 'error',
    win32con.EVENTLOG_WARNING_TYPE: 'warning',
    win32con.EVENTLOG_INFORMATION_TYPE: 'info',
    win32con.EVENTLOG_AUDIT_SUCCESS: 'info',
    win32con.EVENTLOG_AUDIT_FAILURE: 'warning'
}


class WindowsEventCollector:
    def __init__(self, log_types=None):
        self.log_types = log_types or ['Security', 'System', 'Application']

    def collect(self, since_timestamp):
        events = []
        for log_type in self.log_types:
            events.extend(self._read_log(log_type, since_timestamp))
        return events

    def _read_log(self, log_type, since_timestamp):
        results = []
        try:
            handle = win32evtlog.OpenEventLog(None, log_type)
        except Exception:
            # Log type không tồn tại hoặc không có quyền đọc -> bỏ qua, không crash agent
            return results

        flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ

        while True:
            events = win32evtlog.ReadEventLog(handle, flags, 0)
            if not events:
                break

            stop = False
            for event in events:
                et = event.TimeGenerated
                event_time_dt = datetime.datetime(
                    et.year, et.month, et.day, et.hour, et.minute, et.second
                )

                if event_time_dt <= since_timestamp:
                    stop = True
                    break

                try:
                    message = win32evtlogutil.SafeFormatMessage(event, log_type)
                except Exception:
                    message = str(event.StringInserts)

                results.append({
                    'logType': 'windows_event',
                    'source': log_type,
                    'severity': SEVERITY_MAP.get(event.EventType, 'info'),
                    'eventId': event.EventID & 0xFFFF,
                    'rawMessage': (message or '')[:2000],
                    'parsedData': {
                        'sourceName': event.SourceName,
                        'recordNumber': event.RecordNumber,
                        'category': event.EventCategory
                    },
                    'timestamp': event_time_dt.isoformat()
                })

            if stop:
                break

        win32evtlog.CloseEventLog(handle)
        return results
