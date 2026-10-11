"""
Blender 5.2 Python script to build the Handcrafted Stylized-Realistic Weeping Birch Tree.
Matches the Reference Board:
- Slender, gracefully curved white trunk with subtle taper (Z=0 to 6.2m)
- Tasteful dark horizontal lenticel bark markings
- 4 organic sweeping branches with visible joinery
- Airy, clustered weeping foliage clouds with natural sky openings
- Sunny chartreuse-lime foliage with multi-tone depth (linear sRGB)
- Exports: public/models/tree_birch.glb and saves public/models/tree_birch.blend
"""

import bpy
import bmesh
import math
import mathutils
import os

def build_birch():
    print("=== AUTHORING PREMIUM BLENDER BIRCH TREE ===")

    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes):
        if b.users == 0: bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        if b.users == 0: bpy.data.materials.remove(b)

    col = bpy.context.scene.collection

    # 2. Materials
    # Weeping Birch Foliage Material with Vertex Color
    mat_foliage = bpy.data.materials.new(name="M_Birch_Foliage")
    mat_foliage.use_nodes = True
    mat_foliage.use_backface_culling = False
    nodes_f = mat_foliage.node_tree.nodes
    links_f = mat_foliage.node_tree.links
    nodes_f.clear()

    vc_f = nodes_f.new(type="ShaderNodeVertexColor")
    vc_f.layer_name = "Col"
    bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
    bsdf_f.inputs["Roughness"].default_value = 0.58
    bsdf_f.inputs["Metallic"].default_value = 0.0
    out_f = nodes_f.new(type="ShaderNodeOutputMaterial")
    links_f.new(vc_f.outputs["Color"], bsdf_f.inputs["Base Color"])
    links_f.new(bsdf_f.outputs["BSDF"], out_f.inputs["Surface"])

    # Off-White Birch Bark Material with Vertex Colors
    mat_bark = bpy.data.materials.new(name="M_Birch_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()

    vc_b = nodes_b.new(type="ShaderNodeVertexColor")
    vc_b.layer_name = "Col"
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Roughness"].default_value = 0.75
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(vc_b.outputs["Color"], bsdf_b.inputs["Base Color"])
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    # Root Empty
    root = bpy.data.objects.new("tree_birch_root", None)
    col.objects.link(root)

    # 3. Slender Curved Trunk & 4 Primary Branches (BMesh)
    bm_wood = bmesh.new()
    col_bark = bm_wood.loops.layers.color.new("Col")

    # Bark Palette
    c_white = (0.92, 0.90, 0.85, 1.0) # Warm chalky paper bark
    c_lent  = (0.16, 0.15, 0.14, 1.0) # Dark charcoal lenticel ring
    c_base  = (0.28, 0.24, 0.20, 1.0) # Weathered brownish base collar

    # Trunk spline (12 rings from Z=0 to Z=6.2m)
    rings = 12
    trunk_h = 6.2
    ring_verts = []

    for r_idx in range(rings + 1):
        t = r_idx / rings
        z = t * trunk_h
        rad = 0.28 * math.pow(1.0 - t * 0.75, 0.7)
        if r_idx == 0:
            rad = 0.38 # Ground flare

        # Graceful sweeping S-curve
        lx = 0.22 * math.sin(t * math.pi * 1.1)
        ly = 0.12 * math.sin(t * math.pi * 0.6)

        ring = []
        sides = 8
        for i in range(sides):
            ang = (i / sides) * math.pi * 2
            vx = lx + rad * math.cos(ang)
            vy = ly + rad * math.sin(ang)
            ring.append(bm_wood.verts.new((vx, vy, z)))
        ring_verts.append(ring)

    for r_idx in range(rings):
        is_lenticel = (r_idx in (2, 5, 8, 10))
        for i in range(8):
            i_next = (i + 1) % 8
            face = bm_wood.faces.new((
                ring_verts[r_idx][i],
                ring_verts[r_idx+1][i],
                ring_verts[r_idx+1][i_next],
                ring_verts[r_idx][i_next]
            ))
            # Color assignment
            f_col = c_lent if (is_lenticel and (i % 2 == 0)) else (c_base if r_idx == 0 else c_white)
            for loop in face.loops:
                loop[col_bark] = f_col

    # Cap base
    bm_wood.faces.new(reversed(ring_verts[0]))

    # Helper function to extrude an organic branch from trunk
    def add_branch(start_pt, dir_vec, length, r_start, r_end, has_lenticel=False):
        b_rings = 4
        prev_verts = None
        for step in range(b_rings + 1):
            st = step / b_rings
            pos = start_pt + dir_vec * (length * st)
            # Add slight downward weeping arc at branch ends
            pos.z -= 0.18 * (st * st)
            cur_r = r_start + (r_end - r_start) * st

            # Local perpendiculars
            up = mathutils.Vector((0, 0, 1))
            right = dir_vec.cross(up).normalized()
            true_up = right.cross(dir_vec).normalized()

            b_verts = []
            sides = 6
            for i in range(sides):
                ang = (i / sides) * math.pi * 2
                offset = (right * math.cos(ang) + true_up * math.sin(ang)) * cur_r
                b_verts.append(bm_wood.verts.new(pos + offset))

            if prev_verts is not None:
                for i in range(sides):
                    i_next = (i + 1) % sides
                    f = bm_wood.faces.new((prev_verts[i], b_verts[i], b_verts[i_next], prev_verts[i_next]))
                    c = c_lent if (has_lenticel and step == 2 and (i % 2 == 0)) else c_white
                    for loop in f.loops:
                        loop[col_bark] = c

            prev_verts = b_verts
        # Cap end
        bm_wood.faces.new(prev_verts)

    # 4 Sweeping Branches
    branches = [
        (mathutils.Vector((0.14, 0.05, 3.2)), mathutils.Vector((0.75, 0.35, 0.55)).normalized(), 1.6, 0.12, 0.04, True),
        (mathutils.Vector((-0.08, 0.12, 3.8)), mathutils.Vector((-0.70, 0.45, 0.52)).normalized(), 1.8, 0.11, 0.04, True),
        (mathutils.Vector((0.12, -0.10, 4.5)), mathutils.Vector((0.45, -0.75, 0.48)).normalized(), 1.7, 0.10, 0.03, False),
        (mathutils.Vector((-0.10, -0.06, 5.2)), mathutils.Vector((-0.55, -0.60, 0.58)).normalized(), 1.5, 0.09, 0.03, False),
    ]

    for b_start, b_dir, b_len, br0, br1, b_lent in branches:
        add_branch(b_start, b_dir, b_len, br0, br1, b_lent)

    mesh_wood = bpy.data.meshes.new("tree_birch_wood_mesh")
    bm_wood.to_mesh(mesh_wood)
    bm_wood.free()
    obj_wood = bpy.data.objects.new("tree_birch_wood", mesh_wood)
    obj_wood.data.materials.append(mat_bark)
    obj_wood.parent = root
    col.objects.link(obj_wood)

    # 4. Handcrafted Weeping Canopy Clouds (Foliage Clusters)
    # Airy, clustered masses matching Reference Board
    bm_foliage = bmesh.new()
    col_foliage = bm_foliage.loops.layers.color.new("Col")

    # Birch Foliage Colors (Lush Spring Lime to Golden Chartreuse)
    c_f_deep   = (0.24, 0.46, 0.12, 1.0) # Shaded inner leaf mass
    c_f_mid    = (0.42, 0.68, 0.14, 1.0) # Fresh lime canopy
    c_f_bright = (0.58, 0.82, 0.18, 1.0) # Sunlit chartreuse tips
    c_f_sun    = (0.72, 0.90, 0.22, 1.0) # Brilliant top highlight

    # 7 Airy weeping foliage cloud clusters
    # (center_x, center_y, center_z, radius_x, radius_y, radius_z)
    cloud_clusters = [
        (0.18, 0.08, 6.2,  1.15, 1.10, 1.05), # Apical top crown
        (1.20, 0.55, 4.2,  1.25, 1.15, 0.95), # Branch 1 weeping cloud
        (-1.15, 0.70, 4.8, 1.20, 1.20, 1.00), # Branch 2 weeping cloud
        (0.75, -1.10, 5.2, 1.10, 1.15, 0.90), # Branch 3 weeping cloud
        (-0.90, -0.85, 5.7, 1.05, 1.00, 0.85), # Branch 4 weeping cloud
        (0.45, 0.35, 5.4,  1.30, 1.25, 1.10), # Center-fill cloud
        (-0.35, 0.15, 4.4, 1.10, 1.05, 0.90), # Lower mid canopy
    ]

    for cx, cy, cz, rx, ry, rz in cloud_clusters:
        # Build multi-faceted low-poly icosphere / dodecahedron cluster with organic irregularity
        sub_bm = bmesh.new()
        bmesh.ops.create_icosphere(sub_bm, subdivisions=2, radius=1.0)

        # Deform vertices into stylized weeping leaf cluster
        for v in sub_bm.verts:
            p = v.co
            # Subtle drooping teardrop asymmetry: wider at bottom, narrower at top
            weep = 1.0 - 0.25 * p.z
            # Noise-like faceted perturbation
            pert = 1.0 + 0.18 * math.sin(p.x * 4.2) * math.cos(p.y * 3.8)
            v.co.x = (p.x * rx * weep * pert) + cx
            v.co.y = (p.y * ry * weep * pert) + cy
            v.co.z = (p.z * rz * pert) + cz

        # Copy to main foliage bmesh and set vertex colors
        vert_map = {}
        for v in sub_bm.verts:
            vert_map[v] = bm_foliage.verts.new(v.co)

        for f in sub_bm.faces:
            new_face = bm_foliage.faces.new([vert_map[v] for v in f.verts])
            # Color by height and orientation
            norm_z = f.normal.z
            cen_z = f.calc_center_median().z
            rel_h = (cen_z - 3.2) / 3.5

            if norm_z > 0.4:
                face_col = c_f_sun if rel_h > 0.6 else c_f_bright
            elif norm_z < -0.3:
                face_col = c_f_deep
            else:
                face_col = c_f_bright if rel_h > 0.5 else c_f_mid

            for loop in new_face.loops:
                loop[col_foliage] = face_col

        sub_bm.free()

    mesh_foliage = bpy.data.meshes.new("tree_birch_foliage_mesh")
    bm_foliage.to_mesh(mesh_foliage)
    bm_foliage.free()
    obj_foliage = bpy.data.objects.new("tree_birch_foliage", mesh_foliage)
    obj_foliage.data.materials.append(mat_foliage)
    obj_foliage.parent = root
    col.objects.link(obj_foliage)

    # 5. Export GLB & Save Blend
    out_dir = r"d:\Projects from me\slavey game\public\models"
    blend_path = os.path.join(out_dir, "tree_birch.blend")
    glb_path = os.path.join(out_dir, "tree_birch.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Blend:", blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    obj_wood.select_set(True)
    obj_foliage.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print("Exported GLB:", glb_path)
    print("Birch Model Build Complete!")

build_birch()
