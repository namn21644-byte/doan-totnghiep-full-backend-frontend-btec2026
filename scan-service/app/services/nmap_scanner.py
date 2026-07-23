import subprocess
import threading

from app.utils.logger import logger

_running_processes = {}
_lock = threading.Lock()


def build_nmap_command(target, ports, arguments):
    # arguments đã được validate bằng allowlist ở tầng schema trước khi tới đây
    cmd = ['nmap', '-oX', '-']
    cmd.extend(arguments)
    if ports:
        cmd.extend(['-p', ports])
    cmd.append(target)
    return cmd


def run_scan(scan_id, target, ports, arguments, timeout_seconds=300):
    cmd = build_nmap_command(target, ports, arguments)
    logger.info(f"[{scan_id}] Executing: {' '.join(cmd)}")

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    with _lock:
        _running_processes[scan_id] = process

    try:
        stdout_bytes, stderr_bytes = process.communicate(timeout=timeout_seconds)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate()
        raise TimeoutError(f"Scan {scan_id} vượt quá thời gian cho phép ({timeout_seconds}s)")
    finally:
        with _lock:
            _running_processes.pop(scan_id, None)

    if process.returncode not in (0, None) and not stdout_bytes:
        error_message = stderr_bytes.decode('utf-8', errors='ignore').strip()
        raise RuntimeError(f"Nmap thoát với mã lỗi {process.returncode}: {error_message}")

    # python-nmap trả XML dưới dạng bytes -> luôn decode tường minh trước khi parse
    xml_output = stdout_bytes.decode('utf-8', errors='ignore')
    return xml_output


def cancel_scan(scan_id):
    with _lock:
        process = _running_processes.get(scan_id)
        if not process:
            return False
        process.terminate()
        return True
