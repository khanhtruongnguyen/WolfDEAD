#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WolfDEAD v3.0 - Ma Sói Offline Web Server & Multi-Model AI Proxy
Hỗ trợ:
- Mỗi Role chạy 1 Model AI riêng biệt + Xoay vòng dự phòng khi lỗi
- Kiến trúc 2 Lõi: Lõi Tính Cách (PersonaCore) + Lõi Kho (VaultCore)
- Chống lộ thông tin Người Chơi thật (Blind Human Rule)
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
PUBLIC_DIR = os.path.dirname(os.path.abspath(__file__))

DEFAULT_API_KEY = "sk-6e5bd68e2310d13bcf3747838f1cf8138d68e14e318e4e7e68cfb62a30aff59b"
DEFAULT_BASE_URL = "https://api.xah.io/v1"

# Danh sách các Model thông minh theo yêu cầu người dùng
DEFAULT_MODELS = [
    "dungcsnd113/gemini-flash-3.8",
    "levuphong2909/gemini-3.8-flash-high",
    "dungcsnd113/gemini-4-argon",
    "thanhnhan9023/gemini-3.7-flash-high",
    "sypham98/claude-fable-5-1",
    "tanynguyen97/gemini-4-argon",
    "devdoclang/gemini-3.8-flash"
]

class WolfDeadHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            self.send_json_response(200, {
                'status': 'ok',
                'server_time': time.strftime('%Y-%m-%d %H:%M:%S'),
                'default_models': DEFAULT_MODELS
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/chat':
            self.handle_chat()
        elif self.path == '/api/test-models':
            self.handle_test_models()
        else:
            self.send_error(404, "Endpoint not found")

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            return json.loads(body)
        except Exception:
            return {}

    def send_json_response(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def handle_chat(self):
        """
        Gọi AI API ưu tiên Model riêng của Role đó trước, nếu lỗi mới xoay vòng sang các model khác
        """
        req_data = self.read_json_body()
        messages = req_data.get('messages', [])
        models = req_data.get('models', DEFAULT_MODELS)
        preferred_model = req_data.get('preferred_model')
        api_key = req_data.get('api_key') or DEFAULT_API_KEY
        base_url = (req_data.get('base_url') or DEFAULT_BASE_URL).rstrip('/')
        temperature = req_data.get('temperature', 0.85)
        max_tokens = req_data.get('max_tokens', 900)

        if not messages:
            self.send_json_response(400, {'error': 'No messages provided'})
            return

        # Đưa preferred_model (Model riêng của Role) lên đầu hàng đợi thử nghiệm
        ordered_models = []
        if preferred_model:
            ordered_models.append(preferred_model)
        for m in models:
            if m not in ordered_models:
                ordered_models.append(m)

        chat_url = f"{base_url}/chat/completions"
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        attempts = []
        for model in ordered_models:
            payload = {
                'model': model,
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            }
            start_time = time.time()
            try:
                req = urllib.request.Request(
                    chat_url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers=headers
                )
                with urllib.request.urlopen(req, timeout=20) as response:
                    raw_res = response.read().decode('utf-8')
                    res_json = json.loads(raw_res)
                    content = res_json['choices'][0]['message']['content']
                    elapsed = round((time.time() - start_time) * 1000)

                    self.send_json_response(200, {
                        'success': True,
                        'model_used': model,
                        'latency_ms': elapsed,
                        'content': content,
                        'attempts': attempts
                    })
                    return
            except urllib.error.HTTPError as e:
                err_body = ''
                try:
                    err_body = e.read().decode('utf-8')
                except Exception:
                    pass
                attempts.append({
                    'model': model,
                    'error': f"HTTP {e.code}: {e.reason}",
                    'detail': err_body[:150]
                })
                print(f"[!] Model {model} thất bại (HTTP {e.code}). Xoay vòng sang model kế tiếp...")
            except Exception as e:
                attempts.append({
                    'model': model,
                    'error': str(e)
                })
                print(f"[!] Model {model} lỗi ({e}). Xoay vòng sang model kế tiếp...")

        self.send_json_response(502, {
            'success': False,
            'error': 'Toàn bộ danh sách model đều không phản hồi.',
            'attempts': attempts
        })

    def handle_test_models(self):
        req_data = self.read_json_body()
        models = req_data.get('models', DEFAULT_MODELS)
        api_key = req_data.get('api_key') or DEFAULT_API_KEY
        base_url = (req_data.get('base_url') or DEFAULT_BASE_URL).rstrip('/')

        chat_url = f"{base_url}/chat/completions"
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        results = []
        for model in models:
            payload = {
                'model': model,
                'messages': [{'role': 'user', 'content': 'Say OK.'}],
                'max_tokens': 10
            }
            start_time = time.time()
            try:
                req = urllib.request.Request(
                    chat_url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers=headers
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    elapsed = round((time.time() - start_time) * 1000)
                    results.append({
                        'model': model,
                        'status': 'online',
                        'latency_ms': elapsed
                    })
            except urllib.error.HTTPError as e:
                results.append({
                    'model': model,
                    'status': 'error',
                    'error': f"HTTP {e.code}"
                })
            except Exception as e:
                results.append({
                    'model': model,
                    'status': 'error',
                    'error': 'Timeout / Offline'
                })

        self.send_json_response(200, {'results': results})

def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, WolfDeadHandler)
    url = f"http://localhost:{PORT}"
    print("=" * 60)
    print(" 🐺  WolfDEAD v3.0 - GAME MA SÓI ĐẤU KHẨU & MULTI-MODEL AI 🐺")
    print("=" * 60)
    print(f"[*] Máy chủ đang chạy tại: {url}")
    print("=" * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Đang tắt máy chủ...")
        httpd.server_close()

if __name__ == '__main__':
    main()
