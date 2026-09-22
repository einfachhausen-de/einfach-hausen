"""Single resident CPU model; bounded HTTP workers and one inference, no queue."""
import hmac
import json
import os
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BODY = 16384

def make_server(model, key, port=8097):
    if len(key) < 32:
        raise ValueError("LAYA_API_KEY must contain at least 32 characters")
    inference = threading.Lock()
    workers = threading.BoundedSemaphore(8)
    counters = {"completed": 0, "busy_rejections": 0, "errors": 0}
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(5)
        def log_message(self, *args):
            pass  # Never log questions, tokens or account data.
        def reply(self, status, value):
            data = json.dumps(value, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            if status == 503: self.send_header("Retry-After", "1")
            self.end_headers()
            try: self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError, socket.timeout): pass
        def do_GET(self):
            if self.path != "/health": return self.reply(404, {"error": "not_found"})
            self.reply(200, {"ready": True, "busy": inference.locked(), **counters})
        def do_POST(self):
            if self.path != "/decide": return self.reply(404, {"error": "not_found"})
            if not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + key):
                return self.reply(401, {"error": "unauthorized"})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 1 or size > MAX_BODY: return self.reply(413, {"error": "body_size"})
                body = json.loads(self.rfile.read(size))
                state, questions = body["state"], body["questions"]
                route = questions["route"]
                if not isinstance(state, str) or not state.strip() or len(state) > 4000: raise ValueError()
                if set(questions) != {"route"} or route["type"] != "choice": raise ValueError()
                if not isinstance(route["instructions"], str) or len(route["instructions"]) > 1000: raise ValueError()
                criteria = route["criteria"]
                if not isinstance(criteria, dict) or not 1 <= len(criteria) <= 20: raise ValueError()
                if any(not isinstance(k,str) or not isinstance(v,str) or len(k)>50 or len(v)>300 for k,v in criteria.items()): raise ValueError()
            except (ValueError, KeyError, TypeError, socket.timeout):
                return self.reply(400, {"error": "invalid_request"})
            if not inference.acquire(blocking=False):
                counters["busy_rejections"] += 1
                return self.reply(503, {"error": "busy"})
            started = time.monotonic()
            try:
                result = model.predict(state, questions)
                counters["completed"] += 1
                result["latency_ms"] = round((time.monotonic() - started) * 1000)
                self.reply(200, result)
            except Exception:
                counters["errors"] += 1
                self.reply(503, {"error": "inference_failed"})
            finally:
                # Client disconnect/timeout must NOT release this slot early.
                inference.release()

    class Server(ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True
        def process_request(self, request, client_address):
            if not workers.acquire(blocking=False):
                try: request.sendall(b"HTTP/1.0 503 Service Unavailable\r\nContent-Length: 0\r\n\r\n")
                except OSError: pass
                self.shutdown_request(request)
                return
            try: super().process_request(request, client_address)
            except Exception:
                workers.release()
                raise
        def process_request_thread(self, request, client_address):
            try: super().process_request_thread(request, client_address)
            finally: workers.release()
    return Server(("127.0.0.1", port), Handler)

def main():
    key = os.environ.get("LAYA_API_KEY", "")
    if len(key) < 32: raise SystemExit("Missing LAYA_API_KEY")
    import torch
    import laya
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    model = laya.load(os.environ.get("LAYA_MODEL_PATH", "convaiinnovations/laya"),
                      subfolder="multilingual", device="cpu")
    # Preserve the full small capability schema rather than truncate its tail.
    model.cfg["head_max_len"] = 512
    print("Laya multilingual ready on loopback", flush=True)
    make_server(model, key, int(os.environ.get("LAYA_PORT", "8097"))).serve_forever()

if __name__ == "__main__":
    main()
