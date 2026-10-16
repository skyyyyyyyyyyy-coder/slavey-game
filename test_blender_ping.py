import bpy
print("BLENDER IS ALIVE AND TALKING!")
print("Version:", bpy.app.version_string)
print("Objects in scene:", [o.name for o in bpy.context.scene.objects])
