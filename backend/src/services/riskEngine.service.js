import { riskRuleRepository } from '../repositories/riskRule.repository.js';

export const DEFAULT_RISK_RULES = [
  { matchType: 'port', port: 21, protocol: 'any', severity: 'high', score: 70, description: 'FTP - truyền dữ liệu/thông tin đăng nhập không mã hoá', recommendation: 'Chuyển sang SFTP/FTPS hoặc vô hiệu hoá nếu không cần thiết' },
  { matchType: 'port', port: 22, protocol: 'any', severity: 'medium', score: 40, description: 'SSH - cần cấu hình an toàn', recommendation: 'Dùng key-based auth, chặn root login' },
  { matchType: 'port', port: 23, protocol: 'any', severity: 'critical', score: 90, description: 'Telnet - giao thức không mã hoá', recommendation: 'Vô hiệu hoá Telnet, chuyển sang SSH' },
  { matchType: 'port', port: 25, protocol: 'any', severity: 'medium', score: 45, description: 'SMTP - có thể bị lợi dụng relay/spam nếu cấu hình sai', recommendation: 'Kiểm tra cấu hình open relay' },
  { matchType: 'port', port: 53, protocol: 'any', severity: 'medium', score: 40, description: 'DNS - nguy cơ DNS amplification nếu là open resolver', recommendation: 'Giới hạn truy vấn đệ quy từ bên ngoài' },
  { matchType: 'port', port: 80, protocol: 'any', severity: 'low', score: 20, description: 'HTTP - không mã hoá', recommendation: 'Chuyển sang HTTPS' },
  { matchType: 'port', port: 110, protocol: 'any', severity: 'medium', score: 45, description: 'POP3 không mã hoá', recommendation: 'Dùng POP3S' },
  { matchType: 'port', port: 135, protocol: 'any', severity: 'high', score: 65, description: 'MS RPC - mục tiêu khai thác phổ biến trên Windows', recommendation: 'Hạn chế truy cập từ mạng ngoài bằng firewall' },
  { matchType: 'port', port: 139, protocol: 'any', severity: 'high', score: 65, description: 'NetBIOS - nguy cơ rò rỉ thông tin, khai thác SMB', recommendation: 'Vô hiệu hoá nếu không dùng chia sẻ file Windows' },
  { matchType: 'port', port: 143, protocol: 'any', severity: 'medium', score: 45, description: 'IMAP không mã hoá', recommendation: 'Dùng IMAPS' },
  { matchType: 'port', port: 443, protocol: 'any', severity: 'info', score: 5, description: 'HTTPS - an toàn nếu cấu hình TLS đúng chuẩn', recommendation: 'Kiểm tra chứng chỉ TLS định kỳ' },
  { matchType: 'port', port: 445, protocol: 'any', severity: 'critical', score: 90, description: 'SMB - lịch sử nhiều lỗ hổng nghiêm trọng (EternalBlue...)', recommendation: 'Cập nhật vá lỗi, hạn chế truy cập từ Internet' },
  { matchType: 'port', port: 1433, protocol: 'any', severity: 'high', score: 70, description: 'MSSQL - không nên public ra ngoài', recommendation: 'Chỉ cho phép truy cập nội bộ, dùng firewall/VPN' },
  { matchType: 'port', port: 3306, protocol: 'any', severity: 'high', score: 70, description: 'MySQL - không nên public ra ngoài', recommendation: 'Chỉ cho phép truy cập nội bộ' },
  { matchType: 'port', port: 3389, protocol: 'any', severity: 'critical', score: 85, description: 'RDP - mục tiêu phổ biến cho brute-force/khai thác', recommendation: 'Bật NLA, giới hạn IP truy cập, dùng VPN' },
  { matchType: 'port', port: 5432, protocol: 'any', severity: 'high', score: 70, description: 'PostgreSQL - không nên public ra ngoài', recommendation: 'Chỉ cho phép truy cập nội bộ' },
  { matchType: 'port', port: 6379, protocol: 'any', severity: 'critical', score: 85, description: 'Redis - thường bị bỏ quên không xác thực', recommendation: 'Bật requirepass, bind về localhost nếu có thể' },
  { matchType: 'port', port: 27017, protocol: 'any', severity: 'critical', score: 85, description: 'MongoDB - thường bị bỏ quên không xác thực', recommendation: 'Bật authentication, bind về localhost nếu có thể' }
];

const DEFAULT_RISK = {
  severity: 'info',
  score: 10,
  description: 'Cổng không nằm trong danh sách rủi ro đã cấu hình, cần rà soát thủ công'
};

const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'];

function pickHighestSeverityRule(rules) {
  return rules.reduce((best, r) =>
    SEVERITY_ORDER.indexOf(r.severity) > SEVERITY_ORDER.indexOf(best.severity) ? r : best
  );
}

function matchRule(rules, port) {
  const portRules = rules.filter(
    (r) =>
      r.matchType === 'port' &&
      r.port === port.port &&
      (r.protocol === 'any' || r.protocol === port.protocol)
  );
  if (portRules.length > 0) return pickHighestSeverityRule(portRules);

  const serviceName = (port.service || '').toLowerCase();
  const serviceRules = rules.filter(
    (r) => r.matchType === 'service' && serviceName && r.serviceName === serviceName
  );
  if (serviceRules.length > 0) return pickHighestSeverityRule(serviceRules);

  return DEFAULT_RISK;
}

export function computeHostRiskSummary(ports) {
  if (!ports || ports.length === 0) {
    return { highestSeverity: 'info', totalScore: 0 };
  }
  const highest = ports.reduce((best, p) =>
    SEVERITY_ORDER.indexOf(p.riskSeverity) > SEVERITY_ORDER.indexOf(best.riskSeverity) ? p : best
  );
  const totalScore = ports.reduce((sum, p) => sum + (p.riskScore || 0), 0);
  return { highestSeverity: highest.riskSeverity, totalScore };
}

export async function evaluateHostPorts(ports) {
  const rules = await riskRuleRepository.findActiveRules();

  const enrichedPorts = ports.map((p) => {
    const matched = matchRule(rules, p);
    return {
      port: p.port,
      protocol: p.protocol,
      state: p.state,
      service: p.service,
      product: p.product,
      version: p.version,
      riskSeverity: matched.severity,
      riskScore: matched.score,
      riskDescription: matched.description
    };
  });

  const riskSummary = computeHostRiskSummary(enrichedPorts);

  return { enrichedPorts, riskSummary };
}
