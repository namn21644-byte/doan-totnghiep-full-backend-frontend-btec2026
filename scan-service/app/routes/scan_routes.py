from flask import Blueprint, request, jsonify

from app.services.nmap_scanner import run_scan, cancel_scan
from app.schemas.scan_schema import validate_scan_request
from app.utils.xml_parser import parse_nmap_xml
from app.utils.logger import logger

scan_bp = Blueprint('scan', __name__)


@scan_bp.route('/scan/run', methods=['POST'])
def run_scan_route():
    payload = request.get_json(silent=True) or {}
    errors = validate_scan_request(payload)
    if errors:
        return jsonify({'success': False, 'message': 'Dữ liệu không hợp lệ', 'errors': errors}), 400

    scan_id = payload['scanId']
    target = payload['target']
    ports = payload.get('ports', '')
    arguments = payload.get('arguments', [])
    timeout_seconds = payload.get('timeoutSeconds', 300)

    try:
        xml_output = run_scan(scan_id, target, ports, arguments, timeout_seconds)
    except TimeoutError as e:
        logger.warning(str(e))
        return jsonify({'success': False, 'message': str(e)}), 408
    except RuntimeError as e:
        logger.error(str(e))
        return jsonify({'success': False, 'message': str(e)}), 500
    except FileNotFoundError:
        return jsonify({
            'success': False,
            'message': 'Không tìm thấy lệnh nmap trên hệ thống. Vui lòng cài đặt Nmap.'
        }), 500

    try:
        hosts = parse_nmap_xml(xml_output)
    except Exception as e:
        logger.error(f"Parse XML thất bại: {e}")
        return jsonify({'success': False, 'message': f'Lỗi phân tích kết quả XML: {e}'}), 500

    # QUAN TRỌNG (Phase 5): Scan Service chỉ trả dữ liệu THÔ (port/service/product/version).
    # Việc gắn riskSeverity/riskScore đã được chuyển sang Risk Engine phía Node.js Backend
    # (đọc rule động từ MongoDB) thay vì hardcode tại đây như ở Phase 3.
    results = [
        {
            'hostIp': host['hostIp'],
            'hostStatus': host['hostStatus'],
            'ports': host['ports'],
            'osGuess': host['osGuess']
        }
        for host in hosts
    ]

    return jsonify({'success': True, 'data': {'scanId': scan_id, 'results': results}}), 200


@scan_bp.route('/scan/cancel/<scan_id>', methods=['POST'])
def cancel_scan_route(scan_id):
    cancelled = cancel_scan(scan_id)
    if not cancelled:
        return jsonify({
            'success': False,
            'message': 'Không tìm thấy scan đang chạy với scanId này'
        }), 404
    return jsonify({'success': True, 'message': 'Đã gửi tín hiệu huỷ scan'}), 200
