import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='d:/Projects from me/slavey game/public/models/apple_tree.glb')
print('=== APPLE TREE MESHES ===')
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        print(f'{o.name}: {len(o.data.polygons)} polys, mats: {[m.name for m in o.data.materials]}')
    elif o.type == 'EMPTY':
        print(f'EMPTY {o.name}')
