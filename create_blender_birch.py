import bpy
import bmesh
import math
import mathutils
import os

def create_birch_asset():
    print("=== CREATING BLENDER BIRCH TREE ASSET ===")

    # 1. Clear scene safely
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

    col = bpy.context.scene.collection

    # 2. Materials
    # Stylized Weeping Birch Foliage Material with Vertex Color modulation
    mat_foliage = bpy.data.materials.new(name="M_Birch_Foliage")
    mat_foliage.use_nodes = True
    mat_foliage.use_backface_culling = False
    nodes_f = mat_foliage.node_tree.nodes
    links_f = mat_foliage.node_tree.links
    nodes_f.clear()

    vc_f = nodes_f.new(type="ShaderNodeVertexColor")
    vc_f.layer_name = "Col"
    bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
    bsdf_f.inputs["Roughness"].default_value = 0.60
    bsdf_f.inputs["Metallic"].default_value = 0.0
    out_f = nodes_f.new(type="ShaderNodeOutputMaterial")
    links_f.new(vc_f.outputs["Color"], bsdf_f.inputs["Base Color"])
    links_f.new(bsdf_f.outputs["BSDF"], out_f.inputs["Surface"])

    # Off-White Birch Bark with Dark Markings
    mat_bark = bpy.data.materials.new(name="M_Birch_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()

    vc_b = nodes_b.new(type="ShaderNodeVertexColor")
    vc_b.layer_name = "Col"
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Roughness"].default_value = 0.78
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(vc_b.outputs["Color"], bsdf_b.inputs["Base Color"])
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    root = bpy.data.objects.new("tree_birch_root", None)
    col.objects.link(root)

    # 3. Slender Tapered Trunk & Forking Branches (BMesh)
    bm_wood = bmesh.new()
    col_bark_layer = bm_wood.loops.layers.color.new("Col")

    # Bark Colors (Linear sRGB)
    c_white_bark = (0.92, 0.91, 0.88, 1.0) # Papery off-white
    c_grey_shadow = (0.75, 0.74, 0.71, 1.0)
    c_dark_lenticel = (0.16, 0.13, 0.11, 1.0) # Dark charcoal-brown markings

    # Main Trunk spline with graceful sweep
    trunk_pts = [
        ((0, 0, 0), 0.22),
        ((0.04, 0.02, 1.0), 0.18),
        ((0.09, -0.03, 2.0), 0.16),
        ((0.06, -0.08, 3.0), 0.14),
        ((-0.02, -0.06, 4.0), 0.11),
        ((-0.08, 0.02, 5.0), 0.08),
        ((-0.05, 0.06, 6.0), 0.05),
    ]

    trunk_rings = []
    for s_idx, (pos, rad) in enumerate(trunk_pts):
        px, py, pz = pos
        ring_v = []
        num_sides = 8
        for i in range(num_sides):
            ang = (i / num_sides) * math.pi * 2
            vx = px + rad * math.cos(ang)
            vy = py + rad * math.sin(ang)
            vz = pz
            ring_v.append(bm_wood.verts.new((vx, vy, vz)))
        trunk_rings.append(ring_v)

    for s_idx in range(len(trunk_rings) - 1):
        for i in range(8):
            i_next = (i + 1) % 8
            f = bm_wood.faces.new((trunk_rings[s_idx][i], trunk_rings[s_idx+1][i], trunk_rings[s_idx+1][i_next], trunk_rings[s_idx][i_next]))
            # Lenticel markings: alternate dark rings along trunk
            has_lenticel = (s_idx % 2 == 1 and (i % 3 == 0 or i % 3 == 1))
            for loop in f.loops:
                loop[col_bark_layer] = c_dark_lenticel if has_lenticel else c_white_bark

    # Cap bottom at Z=0
    f_bot = bm_wood.faces.new(reversed(trunk_rings[0]))
    for loop in f_bot.loops: loop[col_bark_layer] = c_grey_shadow

    # 4 Secondary Forking Branches
    branch_specs = [
        # (start_pt, mid_pt, end_pt, r_start, r_end)
        ((0.08, -0.05, 2.6), (0.35, -0.15, 3.2), (0.75, -0.32, 3.8), 0.08, 0.03),
        ((-0.01, -0.07, 3.4), (-0.42, -0.12, 4.0), (-0.85, -0.18, 4.5), 0.07, 0.025),
        ((-0.04, 0.00, 4.2), (0.12, 0.38, 4.8), (0.32, 0.72, 5.2), 0.06, 0.02),
        ((-0.07, 0.04, 4.9), (-0.35, 0.22, 5.4), (-0.62, 0.45, 5.7), 0.05, 0.018),
    ]

    for p0, p1, p2, r0, r1 in branch_specs:
        pts = [mathutils.Vector(p0), mathutils.Vector(p1), mathutils.Vector(p2)]
        rads = [r0, (r0+r1)*0.55, r1]
        b_rings = []
        for b_i, (pt, r) in enumerate(zip(pts, rads)):
            tangent = (pts[b_i+1] - pt).normalized() if b_i < len(pts)-1 else (pt - pts[b_i-1]).normalized()
            normal = tangent.orthogonal().normalized()
            binormal = tangent.cross(normal).normalized()
            r_verts = []
            for s in range(6):
                ang = (s / 6) * math.pi * 2
                offset = (normal * math.cos(ang) + binormal * math.sin(ang)) * r
                r_verts.append(bm_wood.verts.new(pt + offset))
            b_rings.append(r_verts)

        for b_i in range(len(b_rings) - 1):
            for s in range(6):
                s_next = (s + 1) % 6
                f = bm_wood.faces.new((b_rings[b_i][s], b_rings[b_i+1][s], b_rings[b_i+1][s_next], b_rings[b_i][s_next]))
                for loop in f.loops: loop[col_bark_layer] = c_white_bark

    mesh_wood = bpy.data.meshes.new("tree_birch_wood_mesh")
    bm_wood.to_mesh(mesh_wood)
    bm_wood.free()
    obj_wood = bpy.data.objects.new("tree_birch_wood", mesh_wood)
    obj_wood.data.materials.append(mat_bark)
    obj_wood.parent = root
    col.objects.link(obj_wood)

    # 4. Asymmetric Weeping Foliage Clouds (BMesh)
    bm_foliage = bmesh.new()
    col_foliage_layer = bm_foliage.loops.layers.color.new("Col")

    # Sparkling Birch Color Palette (Linear sRGB)
    c_birch_deep = (0.12, 0.42, 0.15, 1.0)   # Deep inner canopy
    c_birch_mid = (0.24, 0.62, 0.18, 1.0)    # Natural birch emerald
    c_birch_light = (0.42, 0.78, 0.22, 1.0)  # Bright spring lime
    c_birch_sun = (0.60, 0.88, 0.26, 1.0)    # Sunlight yellow-green tip

    # Drooping ellipsoidal foliage clouds at branch tips & crown
    canopy_clusters = [
        # (center, rx, ry, rz, droop, weight)
        ((0.82, -0.35, 3.6), 0.85, 0.80, 0.65, 0.22, 0.5),   # Lower East bough
        ((-0.90, -0.20, 4.3), 0.90, 0.85, 0.70, 0.25, 0.4),  # Lower West bough
        ((0.36, 0.75, 5.0), 0.80, 0.80, 0.65, 0.20, 0.6),    # Mid North-East
        ((-0.65, 0.48, 5.5), 0.75, 0.75, 0.60, 0.18, 0.7),   # Mid North-West
        ((-0.08, 0.05, 5.6), 1.05, 1.00, 0.85, 0.15, 0.7),   # Central main canopy
        ((-0.05, 0.08, 6.4), 0.70, 0.65, 0.60, 0.10, 0.9),   # Upper crown spire
    ]

    for (cx, cy, cz), rx, ry, rz, droop, w in canopy_clusters:
        cluster_col = (
            c_birch_deep[0] * (1 - w) + c_birch_sun[0] * w,
            c_birch_deep[1] * (1 - w) + c_birch_sun[1] * w,
            c_birch_deep[2] * (1 - w) + c_birch_sun[2] * w,
            1.0
        )

        rings = 5
        sectors = 8
        c_rings = []
        for ri in range(rings + 1):
            theta = (ri / rings) * math.pi
            ring_v = []
            for si in range(sectors):
                phi = (si / sectors) * math.pi * 2
                noise = 1.0 + 0.12 * math.sin(si * 2.5 + ri * 3.0)
                # Droop formula: lower vertices stretch downward slightly (weeping birch)
                droop_stretch = 1.0 + (math.sin(theta) if theta > math.pi/2 else 0) * droop
                vx = cx + rx * math.sin(theta) * math.cos(phi) * noise
                vy = cy + ry * math.sin(theta) * math.sin(phi) * noise
                vz = cz + rz * math.cos(theta) * droop_stretch
                ring_v.append(bm_foliage.verts.new((vx, vy, vz)))
            c_rings.append(ring_v)

        for ri in range(rings):
            for si in range(sectors):
                s_next = (si + 1) % sectors
                if ri == 0:
                    f = bm_foliage.faces.new((c_rings[ri][si], c_rings[ri+1][si], c_rings[ri+1][s_next]))
                elif ri == rings - 1:
                    f = bm_foliage.faces.new((c_rings[ri][si], c_rings[ri+1][si], c_rings[ri][s_next]))
                else:
                    f = bm_foliage.faces.new((c_rings[ri][si], c_rings[ri+1][si], c_rings[ri+1][s_next], c_rings[ri][s_next]))

                for loop in f.loops:
                    vert_z = loop.vert.co.z
                    z_ratio = max(0.0, min(1.0, (vert_z - (cz - rz)) / (2 * rz)))
                    loop[col_foliage_layer] = (
                        cluster_col[0] * (0.8 + 0.3 * z_ratio),
                        cluster_col[1] * (0.8 + 0.3 * z_ratio),
                        cluster_col[2] * (0.8 + 0.3 * z_ratio),
                        1.0
                    )

    mesh_foliage = bpy.data.meshes.new("tree_birch_foliage_mesh")
    bm_foliage.to_mesh(mesh_foliage)
    bm_foliage.free()
    obj_foliage = bpy.data.objects.new("tree_birch_foliage", mesh_foliage)
    obj_foliage.data.materials.append(mat_foliage)
    obj_foliage.parent = root
    col.objects.link(obj_foliage)

    # 5. Smooth Shading
    for obj in [obj_wood, obj_foliage]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        obj.select_set(False)

    # 6. Save .blend and export .glb
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "tree_birch.blend")
    glb_path = os.path.join(out_dir, "tree_birch.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Birch Tree Blend to {blend_path}")

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for ch in root.children:
        ch.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    print(f"[SUCCESS] Exported Birch Tree GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

create_birch_asset()
