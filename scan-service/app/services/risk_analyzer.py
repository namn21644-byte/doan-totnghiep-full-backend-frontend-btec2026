# GHI CHÚ (Phase 5): File này KHÔNG còn được import/sử dụng trong luồng chính
# kể từ Phase 5 - Risk Analysis. Việc đánh giá rủi ro đã được chuyển sang
# Risk Engine phía Node.js Backend (đọc rule động từ MongoDB collection
# `risk_rules`) thay vì hardcode tại Scan Service.
# Giữ lại file này chỉ để tham khảo/đối chiếu lịch sử phát triển (Phase 3).

COMMON_PORT_RISKS = {
    21: {'severity': 'high', 'score': 70, 'description': 'FTP - truyền dữ liệu/thông tin đăng nhập không mã hoá'},
    22: {'severity': 'medium', 'score': 40, 'description': 'SSH - cần cấu hình an toàn (key-based auth, chặn root login)'},
    23: {'severity': 'critical', 'score': 90, 'description': 'Telnet - giao thức không mã hoá, nên vô hiệu hoá'},
    25: {'severity': 'medium', 'score': 45, 'description': 'SMTP - có thể bị lợi dụng relay/spam nếu cấu hình sai'},
    53: {'severity': 'medium', 'score': 40, 'description': 'DNS - nguy cơ DNS amplification nếu là open resolver'},
    80: {'severity': 'low', 'score': 20, 'description': 'HTTP - nên chuyển sang HTTPS'},
    110: {'severity': 'medium', 'score': 45, 'description': 'POP3 không mã hoá'},
    135: {'severity': 'high', 'score': 65, 'description': 'MS RPC - thường là mục tiêu khai thác trên Windows'},
    139: {'severity': 'high', 'score': 65, 'description': 'NetBIOS - nguy cơ rò rỉ thông tin, khai thác SMB'},
    143: {'severity': 'medium', 'score': 45, 'description': 'IMAP không mã hoá'},
    443: {'severity': 'info', 'score': 5, 'description': 'HTTPS - an toàn nếu cấu hình TLS đúng chuẩn'},
    445: {'severity': 'critical', 'score': 90, 'description': 'SMB - lịch sử nhiều lỗ hổng nghiêm trọng (EternalBlue...)'},
    1433: {'severity': 'high', 'score': 70, 'description': 'MSSQL - không nên public ra ngoài'},
    3306: {'severity': 'high', 'score': 70, 'description': 'MySQL - không nên public ra ngoài'},
    3389: {'severity': 'critical', 'score': 85, 'description': 'RDP - mục tiêu phổ biến cho tấn công brute-force/khai thác'},
    5432: {'severity': 'high', 'score': 70, 'description': 'PostgreSQL - không nên public ra ngoài'},
    6379: {'severity': 'critical', 'score': 85, 'description': 'Redis - thường bị bỏ quên không xác thực'},
    27017: {'severity': 'critical', 'score': 85, 'description': 'MongoDB - thường bị bỏ quên không xác thực'}
}

DEFAULT_RISK = {
    'severity': 'info',
    'score': 10,
    'description': 'Cổng không nằm trong danh sách rủi ro phổ biến, cần rà soát thủ công'
}


def analyze_port_risk(port_number):
    return COMMON_PORT_RISKS.get(port_number, DEFAULT_RISK)


def enrich_ports_with_risk(ports):
    enriched = []
    for p in ports:
        risk = analyze_port_risk(p['port'])
        enriched.append({
            **p,
            'riskSeverity': risk['severity'],
            'riskScore': risk['score'],
            'riskDescription': risk['description']
        })
    return enriched


def compute_host_risk_summary(ports):
    if not ports:
        return {'highestSeverity': 'info', 'totalScore': 0}

    severity_order = ['info', 'low', 'medium', 'high', 'critical']
    highest = max(ports, key=lambda p: severity_order.index(p['riskSeverity']))
    total_score = sum(p['riskScore'] for p in ports)

    return {'highestSeverity': highest['riskSeverity'], 'totalScore': total_score}
