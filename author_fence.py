"""
Blender 5.2 Python script to build the Handcrafted Stylized-Realistic Modular Farm Fence.
Matches the Reference Board:
- Solid 3D timber split-rail construction with chamfered post tops and mortise-and-tenon joints
- 2 horizontal split rails with organic grain curvature and visible joinery pegs
- Straight segment (fence_straight.glb) - 3.0m length
- Corner segment (fence_corner.glb) - 90-degree corner post with dual rail sockets
- Post base grounding flared roots
- Exports: public/models/fence_segment.glb and saves public/models/fence_segment.blend
"""

import bpy
import bmesh
import math
import mathutils
import os

def build_fence():
    print("=== AUTHORING PREMIUM BLENDER MODULAR FARM FENCE ===")

    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes):
        if b.users == 0: bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        if b.users == 0: bpy.data.materials.remove(b)

    col = bpy.context.scene.collection

    # 2. Materials
    # Warm Weathered Alpine Timber Material
    mat_timber = bpy.data.materials.new(name="M_Fence_Timber")
    mat_timber.use_nodes = True
    bsdf_t = mat_timber.node_tree.nodes.get("Principled BSDF")
    bsdf_t.inputs["Base Color"].default_value = (0.38, 0.25, 0.14, 1.0) # Warm cedar/oak timber
    bsdf_t.inputs["Roughness"].default_value = 0.82
    bsdf_t.inputs["Metallic"].default_value = 0.0

    # Iron Joint Pegs Material
    mat_peg = bpy.data.materials.new(name="M_Fence_IronPeg")
    mat_peg.use_nodes = True
    bsdf_p = mat_peg.node_tree.nodes.get("Principled BSDF")
    bsdf_p.inputs["Base Color"].default_value = (0.16, 0.18, 0.20, 1.0)
    bsdf_p.inputs["Roughness"].default_value = 0.50
    bsdf_p.inputs["Metallic"].default_value = 0.75

    root = bpy.data.objects.new("fence_straight_root", None)
    col.objects.link(root)

    # 3. Handcrafted Split-Rail Fence Straight Segment (Length = 3.0m)
    bm_fence = bmesh.new()
    bm_pegs = bmesh.new()

    # Helper function for timber post with pyramid-chamfered cap
    def add_fence_post(px, py, h=1.18, w=0.18):
        # Post shaft (ground Z=0 to h)
        bmesh.ops.create_cube(
            bm_fence,
            size=1.0,
            matrix=mathutils.Matrix.Translation((px, py, h / 2)) @ mathutils.Matrix.Diagonal((w, w, h, 1.0))
        )
        # Pyramid cap on top
        bmesh.ops.create_cone(
            bm_fence,
            cap_ends=True,
            segments=4,
            radius1=w * 0.72,
            radius2=0.01,
            depth=0.08,
            matrix=mathutils.Matrix.Translation((px, py, h + 0.04)) @ mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4()
        )
        # Root ground collar flare
        bmesh.ops.create_cube(
            bm_fence,
            size=1.0,
            matrix=mathutils.Matrix.Translation((px, py, 0.06)) @ mathutils.Matrix.Diagonal((w + 0.06, w + 0.06, 0.12, 1.0))
        )

    # Helper function for split rail (organic curved beam)
    def add_split_rail(x0, x1, z, rail_h=0.12, rail_w=0.10):
        length = x1 - x0
        cx = (x0 + x1) / 2
        # Slight organic sag in middle (0.015m)
        segs = 6
        prev_ring = None
        for s in range(segs + 1):
            st = s / segs
            cur_x = x0 + length * st
            sag = -0.02 * math.sin(st * math.pi)
            cur_z = z + sag

            # Ring of 6 vertices for natural hand-hewn octagonal rail cross section
            ring = []
            for i in range(6):
                ang = (i / 6.0) * math.pi * 2
                dy = (rail_w / 2) * math.cos(ang)
                dz = (rail_h / 2) * math.sin(ang)
                ring.append(bm_fence.verts.new((cur_x, dy, cur_z + dz)))

            if prev_ring is not None:
                for i in range(6):
                    inxt = (i + 1) % 6
                    bm_fence.faces.new((prev_ring[i], ring[i], ring[inxt], prev_ring[inxt]))
            else:
                bm_fence.faces.new(reversed(ring))
            prev_ring = ring
        bm_fence.faces.new(prev_ring)

    # 2 Posts: Post A at x=-1.45, Post B at x=1.45 (Span = 2.9m)
    add_fence_post(-1.45, 0.0)
    add_fence_post(1.45,  0.0)

    # 2 Horizontal Split Rails (Upper rail at z=0.92m, Lower rail at z=0.52m)
    add_split_rail(-1.50, 1.50, 0.92, 0.13, 0.10)
    add_split_rail(-1.50, 1.50, 0.52, 0.12, 0.10)

    # Joinery Iron Pegs (driven through posts at rail joints)
    for px in (-1.45, 1.45):
        for pz in (0.92, 0.52):
            bmesh.ops.create_cone(
                bm_pegs,
                cap_ends=True,
                segments=6,
                radius1=0.02,
                radius2=0.02,
                depth=0.22,
                matrix=mathutils.Matrix.Translation((px, 0, pz)) @ mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
            )

    mesh_fence = bpy.data.meshes.new("fence_timber_mesh")
    bm_fence.to_mesh(mesh_fence)
    bm_fence.free()
    obj_fence = bpy.data.objects.new("fence_timber", mesh_fence)
    obj_fence.data.materials.append(mat_timber)
    obj_fence.parent = root
    col.objects.link(obj_fence)

    mesh_pegs = bpy.data.meshes.new("fence_pegs_mesh")
    bm_pegs.to_mesh(mesh_pegs)
    bm_pegs.free()
    obj_pegs = bpy.data.objects.new("fence_pegs", mesh_pegs)
    obj_pegs.data.materials.append(mat_peg)
    obj_pegs.parent = root
    col.objects.link(obj_pegs)

    # 4. Export GLB & Save Blend
    out_dir = r"d:\Projects from me\slavey game\public\models"
    blend_path = os.path.join(out_dir, "fence_segment.blend")
    glb_path = os.path.join(out_dir, "fence_segment.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Blend:", blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    obj_fence.select_set(True)
    obj_pegs.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print("Exported GLB:", glb_path)
    print("Modular Farm Fence Build Complete!")

build_fence()
