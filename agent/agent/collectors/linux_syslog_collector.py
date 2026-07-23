import os
import re
import datetime

SYSLOG_PATTERN = re.compile(
    r'^(?P<month>\w{3})\s+(?P<day>\d{1,2})\s+(?P<time>\d{2}:\d{2}:\d{2})\s+'
    r'(?P<host>\S+)\s+(?P<process>[^:]+):\s+(?P<message>.*)$'
)

SEVERITY_KEYWORDS = {
    'critical': 'critical',
    'error': 'error',
    'fail': 'error',
    'denied': 'warning',
    'warn': 'warning'
}


class LinuxSyslogCollector:
    def __init__(self, log_paths=None):
        self.log_paths = log_paths or ['/var/log/syslog', '/var/log/auth.log']

    def collect(self, offsets_state):
        results = []
        for path in self.log_paths:
            if not os.path.exists(path):
                continue

            offset = offsets_state.get(path, 0)
            new_offset, lines = self._read_new_lines(path, offset)
            offsets_state[path] = new_offset

            for line in lines:
                if line.strip():
                    results.append(self._parse_line(line, path))

        return results, offsets_state

    def _read_new_lines(self, path, offset):
        try:
            file_size = os.path.getsize(path)
            start_offset = offset if offset <= file_size else 0  # file bị xoay vòng (logrotate)

            with open(path, 'r', errors='ignore') as f:
                f.seek(start_offset)
                lines = [line.rstrip('\n') for line in f]
                new_offset = f.tell()
            return new_offset, lines
        except Exception:
            return offset, []

    def _parse_line(self, line, source_path):
        match = SYSLOG_PATTERN.match(line)
        severity = 'info'
        lowered = line.lower()
        for keyword, sev in SEVERITY_KEYWORDS.items():
            if keyword in lowered:
                severity = sev
                break

        if match:
            now_year = datetime.datetime.now().year
            ts_str = f"{now_year} {match.group('month')} {match.group('day')} {match.group('time')}"
            try:
                timestamp = datetime.datetime.strptime(ts_str, '%Y %b %d %H:%M:%S')
            except ValueError:
                timestamp = datetime.datetime.utcnow()

            return {
                'logType': 'linux_syslog',
                'source': os.path.basename(source_path),
                'severity': severity,
                'eventId': None,
                'rawMessage': line[:2000],
                'parsedData': {
                    'process': match.group('process').strip(),
                    'host': match.group('host')
                },
                'timestamp': timestamp.isoformat()
            }

        return {
            'logType': 'linux_syslog',
            'source': os.path.basename(source_path),
            'severity': severity,
            'eventId': None,
            'rawMessage': line[:2000],
            'parsedData': {},
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
