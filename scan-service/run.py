from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    # threaded=True BẮT BUỘC: cho phép request /scan/cancel được xử lý song song
    # trong lúc /scan/run của cùng scan đó vẫn đang block chờ subprocess Nmap.
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG, threaded=True)
