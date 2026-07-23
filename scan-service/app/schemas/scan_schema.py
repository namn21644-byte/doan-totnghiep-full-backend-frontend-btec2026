import ipaddress
import re

PORT_SPEC_PATTERN = re.compile(r'^[\d,\-]+$')

# Allowlist cờ Nmap được phép truyền vào - chặn command injection dù target
# gửi lên từ Backend, vẫn kiểm tra lại độc lập ở tầng Scan Service.
ALLOWED_ARGUMENTS = {
    '-sT',              # TCP connect scan (không cần quyền root)
    '-sV',              # Service/version detection
    '-O',               # OS detection (cần quyền root/Administrator)
    '-T2', '-T3', '-T4',  # Timing template
    '-Pn',              # Bỏ qua host discovery (ping)
    '--version-light'
}


def validate_scan_request(payload):
    errors = []

    scan_id = payload.get('scanId')
    if not scan_id or not isinstance(scan_id, str):
        errors.append('scanId là bắt buộc')

    target = payload.get('target')
    if not target:
        errors.append('target là bắt buộc')
    else:
        try:
            ipaddress.IPv4Address(target)
        except ValueError:
            errors.append('target phải là địa chỉ IPv4 hợp lệ')

    ports = payload.get('ports', '')
    if ports and not PORT_SPEC_PATTERN.match(ports):
        errors.append('ports chỉ được chứa số, dấu phẩy, dấu gạch ngang (vd: 22,80,1-1000)')

    arguments = payload.get('arguments', [])
    if not isinstance(arguments, list):
        errors.append('arguments phải là một mảng')
    else:
        invalid_args = [a for a in arguments if a not in ALLOWED_ARGUMENTS]
        if invalid_args:
            errors.append(f'arguments chứa cờ không được phép: {invalid_args}')

    return errors
