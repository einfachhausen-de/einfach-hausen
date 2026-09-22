import importlib.util
import json
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path

spec = importlib.util.spec_from_file_location("laya_service", Path(__file__).with_name("server.py"))
module = None
if Path(__file__).with_name("server.py").exists():
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

class ServiceTests(unittest.TestCase):
    def test_service_exists(self):
        self.assertIsNotNone(module)
    @unittest.skipIf(module is None, "implementation missing")
    def test_auth_validation_health_and_busy(self):
        entered, release = threading.Event(), threading.Event()
        class Model:
            def predict(self, state, questions):
                entered.set()
                release.wait(2)
                return {"answers": {"route": {"choice": "jobs", "confidence": .99}}}
        server = module.make_server(Model(), "x" * 32, port=0)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = "http://127.0.0.1:" + str(server.server_port)
        body = {"state": "Meine Aufträge", "questions": {"route": {"type": "choice", "instructions": "Bereich", "criteria": {"jobs": "Aufträge"}}}}
        def request(data=body, key="x"*32):
            req=urllib.request.Request(base+"/decide",data=json.dumps(data).encode(),headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"})
            try:
                with urllib.request.urlopen(req, timeout=4) as response: return response.status
            except urllib.error.HTTPError as error: return error.code
        try:
            self.assertEqual(request(key="wrong"),401)
            self.assertEqual(request({"state":"x","questions":{}}),400)
            first=[]
            worker=threading.Thread(target=lambda:first.append(request()))
            worker.start(); self.assertTrue(entered.wait(1))
            self.assertEqual(request(),503)
            with urllib.request.urlopen(base+"/health") as r:
                health=json.load(r)
                self.assertTrue(health["ready"])
                self.assertIs(health["busy"], True)
                self.assertEqual(health["busy_rejections"], 1)
            release.set();worker.join();self.assertEqual(first,[200])
        finally:
            release.set();server.shutdown();server.server_close()

if __name__ == "__main__": unittest.main()
