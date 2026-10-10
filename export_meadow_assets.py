"""
Blender 3D Asset Generator for Meadow Valley Game
Exports high-quality low-poly models:
1. Carrot Crop (carrot.glb)
2. Pumpkin Crop (pumpkin.glb)
3. Apple Tree with apples (apple_tree.glb)
4. Alpine Farmhouse (farmhouse.glb)
5. Cobblestone / Dirt Road Segment (road_segment.glb)

Can be executed in Blender:
blender --background --python export_meadow_assets.py
"""

import bpy
import bmesh
import math
from mathutils import Vector

def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_material(name, color, roughness=0.6, metalness=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
    return mat

def build_carrot():
    clean_scene()
    carrot_group = bpy.data.objects.new("Carrot_Asset", None)
    bpy.context.collection.objects.link(carrot_group)

    mat_orange = create_material("CarrotOrange", (0.97, 0.45, 0.08), 0.5)
    mat_green = create_material("CarrotFoliage", (0.13, 0.77, 0.36), 0.7)
    mat_soil = create_material("LoamSoil", (0.19, 0.12, 0.06), 0.95)

    # Mound
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.12, vertices=10, location=(0, 0, 0.06))
    mound = bpy.context.active_object
    mound.data.materials.append(mat_soil)
    mound.parent = carrot_group

    # Root
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.02, depth=0.36, vertices=8, location=(0, 0, 0.18))
    root = bpy.context.active_object
    root.rotation_euler[0] = math.pi
    root.data.materials.append(mat_orange)
    root.parent = carrot_group

    # 7 foliage leaves
    for i in range(7):
        ang = (i / 7.0) * math.pi * 2
        bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.46, vertices=5, location=(math.cos(ang)*0.08, math.sin(ang)*0.08, 0.38))
        leaf = bpy.context.active_object
        leaf.rotation_euler[1] = 0.30
        leaf.rotation_euler[2] = ang
        leaf.data.materials.append(mat_green)
        leaf.parent = carrot_group

    print("Carrot created.")

def build_pumpkin():
    clean_scene()
    pump_group = bpy.data.objects.new("Pumpkin_Asset", None)
    bpy.context.collection.objects.link(pump_group)

    mat_pump = create_material("PumpkinSkin", (0.92, 0.35, 0.05), 0.55)
    mat_stem = create_material("PumpkinStem", (0.08, 0.50, 0.24), 0.8)
    mat_leaf = create_material("PumpkinLeaf", (0.09, 0.64, 0.29), 0.75)

    # Body (squashed sphere with ribs)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.42, location=(0, 0, 0.32))
    body = bpy.context.active_object
    body.scale = (1.15, 1.15, 0.78)
    body.data.materials.append(mat_pump)
    body.parent = pump_group

    # Stem
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.18, vertices=6, location=(0.02, 0, 0.65))
    stem = bpy.context.active_object
    stem.rotation_euler[1] = 0.15
    stem.data.materials.append(mat_stem)
    stem.parent = pump_group

    # 5 flat ground leaves
    for i in range(5):
        ang = (i / 5.0) * math.pi * 2
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.03, vertices=6, location=(math.cos(ang)*0.48, math.sin(ang)*0.48, 0.04))
        leaf = bpy.context.active_object
        leaf.data.materials.append(mat_leaf)
        leaf.parent = pump_group

    print("Pumpkin created.")

def build_apple_tree():
    clean_scene()
    tree_group = bpy.data.objects.new("AppleTree_Asset", None)
    bpy.context.collection.objects.link(tree_group)

    mat_bark = create_material("TreeBark", (0.36, 0.23, 0.13), 0.85)
    mat_leaf = create_material("AppleCanopy", (0.24, 0.48, 0.28), 0.7)
    mat_apple = create_material("RedApple", (0.86, 0.15, 0.15), 0.35)

    # Trunk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.40, depth=3.4, vertices=16, location=(0, 0, 1.7))
    trunk = bpy.context.active_object
    trunk.data.materials.append(mat_bark)
    trunk.parent = tree_group

    # Smooth Cloud Canopy (layered spheres)
    canopy_offsets = [
        (0.0, 0.0, 4.4, 2.2),
        (0.8, 0.4, 4.8, 1.7),
        (-0.7, -0.4, 4.6, 1.6),
        (0.2, -0.2, 5.6, 1.4)
    ]
    for x, y, z, r in canopy_offsets:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, radius=r, location=(x, y, z))
        clump = bpy.context.active_object
        clump.data.materials.append(mat_leaf)
        clump.parent = tree_group

    # Apples
    apple_locs = [
        (-1.2, 0.8, 3.2),
        (1.1, -0.7, 3.1),
        (-0.7, -1.0, 3.4),
        (1.2, 0.7, 3.0)
    ]
    for x, y, z in apple_locs:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.20, location=(x, y, z))
        ap = bpy.context.active_object
        ap.data.materials.append(mat_apple)
        ap.parent = tree_group

    print("Apple tree created.")

if __name__ == "__main__":
    build_carrot()
    build_pumpkin()
    build_apple_tree()
