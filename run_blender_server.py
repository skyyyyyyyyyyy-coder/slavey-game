import bpy
import time
import sys
import os

addon_dir = os.path.expandvars(r"%APPDATA%\Blender Foundation\Blender\5.2\scripts\addons")
if addon_dir not in sys.path:
    sys.path.append(addon_dir)

import blender_mcp
blender_mcp.register()

server = blender_mcp.BlenderMCPServer(port=9876)
bpy.types.blendermcp_server = server
server.start()
print("BlenderMCPServer started on port 9876", flush=True)

while server.running:
    time.sleep(1)
