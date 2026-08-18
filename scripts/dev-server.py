# Lokal test uchun kichik server — faqat Python standart kutubxonasidan foydalanadi
# (Node/npm shart emas). Vercel'ning cleanUrls xatti-harakatini takrorlaydi:
# "/level" so'ralsa "level.html" fayli qaytariladi, "/" so'ralsa "index.html".
# Topilmagan sahifalar uchun 404.html ko'rsatiladi.
#
# Ishlatish:  python scripts/dev-server.py [port]
# Standart port: 8000. Keyin brauzerda http://localhost:8000 ni oching.
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path, _, query = self.path.partition("?")
        if path == "/":
            path = "/index.html"
        elif "." not in os.path.basename(path):
            candidate = path + ".html"
            if os.path.isfile(os.path.join(ROOT, candidate.lstrip("/"))):
                path = candidate
        self.path = path + ("?" + query if query else "")
        return super().do_GET()

    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.isfile(os.path.join(ROOT, "404.html")):
            self.path = "/404.html"
            return super().do_GET()
        return super().send_error(code, message, explain)


if __name__ == "__main__":
    print(f"LearningEnglishStat dev-server: http://localhost:{PORT} (to'xtatish uchun Ctrl+C)")
    http.server.test(HandlerClass=CleanUrlHandler, port=PORT)
