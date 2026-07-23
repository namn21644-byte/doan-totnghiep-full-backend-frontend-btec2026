# NetScan - Hệ thống dò quét mạng TCP ứng dụng Nmap

Đồ án tốt nghiệp: Xây dựng hệ thống dò quét mạng TCP ứng dụng Nmap nhằm phát hiện
các rủi ro bảo mật trong hệ thống mạng.

## Cấu trúc thư mục

```
netscan-project/
├── backend/          Node.js + Express + MongoDB (API chính)
├── scan-service/     Flask + Nmap (dịch vụ quét TCP)
├── agent/            Python agent (thu thập log Windows/Linux)
├── frontend/         (trống - phần ReactJS Dashboard chưa triển khai)
└── 00-kien-truc-tong-the.md   Tài liệu kiến trúc tổng thể ban đầu
```

## Thứ tự cài đặt

### 1. MongoDB
```bash
docker run -d --name netscan-mongo -p 27017:27017 mongo:7
```

### 2. Backend (Node.js)
```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env: MONGO_URI, JWT secrets, SMTP_USER/SMTP_PASS
npm run dev
# http://localhost:5000
```

### 3. Scan Service (Flask) - cần cài Nmap trước
```bash
# Cài Nmap: sudo apt-get install -y nmap  (hoặc tải cho Windows tại nmap.org)

cd scan-service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
# http://localhost:6000
```

### 4. Agent (Python) - chạy trên máy cần giám sát
```bash
cd agent
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Dán DEVICE_API_KEY lấy từ API tạo thiết bị (Phase 2) vào .env
python -m agent.main
```

## Lộ trình module đã triển khai

| Phase | Module | Trạng thái |
|---|---|---|
| 1 | Authentication (JWT, OTP, RBAC) | ✅ |
| 2 | Device Management (CRUD + API Key) | ✅ |
| 3 | TCP Scan (Flask + Nmap, đồng bộ) | ✅ |
| 4 | Log Management (Agent Windows/Linux) | ✅ |
| 5 | Risk Analysis (Risk Rule động trong MongoDB) | ✅ |
| 6 | Alert (tự động sinh + Socket.IO realtime) | ✅ |
| 7 | Report (PDF/Excel: scan_summary, risk_summary, device_report) | ✅ |
| - | Frontend Dashboard (ReactJS) | ⏳ Chưa triển khai |

## Ghi chú quan trọng

- Kiến trúc xử lý scan: **đồng bộ** (Backend gọi thẳng Flask, chờ response) —
  không dùng Redis/BullMQ theo lựa chọn khi thiết kế.
- Risk Engine đã được chuyển hoàn toàn sang Node.js Backend từ Phase 5 (đọc
  `risk_rules` động trong MongoDB), Scan Service chỉ trả dữ liệu thô.
- Toàn bộ API dùng chuẩn response `{ success, message, data }`.
- Xem chi tiết thiết kế đầy đủ (ERD, sequence diagram, API design...) trong
  file `00-kien-truc-tong-the.md`.
