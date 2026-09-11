import http.server
import socket
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

if __name__ == '__main__':
    local_ip = get_local_ip()
    local_url = f"http://localhost:{PORT}"
    mobile_url = f"http://{local_ip}:{PORT}"

    print("=" * 60)
    print("  ☕ 모두의 음료 (Cafe Order Collector) 모바일 웹 서버")
    print("=" * 60)
    print(f"  💻 PC 브라우저 접속 주소 : {local_url}")
    print(f"  📱 스마트폰 접속 주소    : {mobile_url}")
    print("  (스마트폰과 PC가 같은 와이파이에 연결되어 있으면 바로 열립니다!)")
    print("=" * 60)
    print("  [Ctrl + C]를 누르면 서버가 종료됩니다.\n")

    # 브라우저 자동 오픈
    webbrowser.open(local_url)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버가 종료되었습니다.")
            sys.exit(0)
