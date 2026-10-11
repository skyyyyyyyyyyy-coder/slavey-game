import sys
import socket
import json

def run_blender_code(code_str):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', 9876))
    payload = json.dumps({'type': 'execute_code', 'params': {'code': code_str}})
    s.sendall(payload.encode('utf-8'))
    
    # Receive response buffer
    chunks = []
    while True:
        chunk = s.recv(16384)
        if not chunk:
            break
        chunks.append(chunk)
        # Check if full JSON arrived
        try:
            full = b''.join(chunks)
            res = json.loads(full.decode('utf-8'))
            s.close()
            return res
        except Exception:
            continue
    s.close()
    return json.loads(b''.join(chunks).decode('utf-8'))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            code = f.read()
    else:
        code = "import bpy\nresult = f'Blender {bpy.app.version_string} is ready!'"
    
    resp = run_blender_code(code)
    print("STATUS:", resp.get("status"))
    if resp.get("status") == "success":
        res = resp.get("result", {})
        if "result" in res and res["result"]:
            print("OUTPUT:\n" + str(res["result"]))
    else:
        print("ERROR:", resp.get("message"))
