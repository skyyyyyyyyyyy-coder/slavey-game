import bpy
import bmesh
import math
import mathutils
import os

def create_bush_asset():
    print("=== CREATING BLENDER SHRUB BUSH ASSET ===")

    # 1. Clear scene safely
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

    col = bpy.context.scene.collection

    # 2. Materials
    # Stylized Bush Foliage Material with Vertex Color modulation
    mat_foliage = bpy.data.materials.new(name="M_Bush_Foliage")
    mat_foliage.use_nodes = True
    mat_foliage.use_backface_culling = False
    nodes_f = mat_foliage.node_tree.nodes
    links_f = mat_foliage.node_tree.links
    nodes_f.clear()

    vc_f = nodes_f.new(type="ShaderNodeVertexColor")
    vc_f.layer_name = "Col"
    bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
    bsdf_f.inputs["Roughness"].default_value = 0.68
    bsdf_f.inputs["Metallic"].default_value = 0.0
    out_f = nodes_f.new(type="ShaderNodeOutputMaterial")
    links_f.new(vc_f.outputs["Color"], bsdf_f.inputs["Base Color"])
    links_f.new(bsdf_f.outputs["BSDF"], out_f.inputs["Surface"])

    # Woody Stems Material
    mat_bark = bpy.data.materials.new(name="M_Bush_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Base Color"].default_value = (0.22, 0.14, 0.08, 1.0)
    bsdf_b.inputs["Roughness"].default_value = 0.85
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    # Berry Accent Material
    mat_berry = bpy.data.materials.new(name="M_Bush_Berry")
    mat_berry.use_nodes = True
    nodes_by = mat_berry.node_tree.nodes
    links_by = mat_berry.node_tree.links
    nodes_by.clear()
    bsdf_by = nodes_by.new(type="ShaderNodeBsdfPrincipled")
    bsdf_by.inputs["Base Color"].default_value = (0.85, 0.12, 0.15, 1.0) # ripe mountain currant
    bsdf_by.inputs["Roughness"].default_value = 0.35
    bsdf_by.inputs["Metallic"].default_value = 0.05
    out_by = nodes_by.new(type="ShaderNodeOutputMaterial")
    links_by.new(bsdf_by.outputs["BSDF"], out_by.inputs["Surface"])

    root = bpy.data.objects.new("shrub_bush_root", None)
    col.objects.link(root)

    # 3. Build Organic Woody Stem Structure (BMesh)
    bm_bark = bmesh.new()
    # Central root flare grounded at Y=0
    main_branches = [
        # (start, mid, end, rad_start, rad_end)
        ((0, 0, 0), (0.05, 0.02, 0.15), (0.08, 0.05, 0.38), 0.055, 0.025),
        ((0, 0, 0.04), (-0.12, -0.05, 0.18), (-0.28, -0.15, 0.35), 0.045, 0.020),
        ((0, 0, 0.04), (0.15, -0.08, 0.16), (0.32, -0.18, 0.32), 0.045, 0.020),
        ((0, 0, 0.03), (-0.05, 0.14, 0.16), (-0.12, 0.28, 0.32), 0.040, 0.018),
        ((0, 0, 0.03), (0.08, 0.12, 0.18), (0.22, 0.25, 0.36), 0.042, 0.018),
        # Secondary twig forks
        ((0.08, 0.05, 0.38), (0.02, 0.10, 0.48), (-0.05, 0.16, 0.58), 0.025, 0.012),
        ((0.08, 0.05, 0.38), (0.16, -0.02, 0.50), (0.24, -0.06, 0.60), 0.025, 0.012),
        ((-0.28, -0.15, 0.35), (-0.38, -0.18, 0.42), (-0.46, -0.22, 0.48), 0.020, 0.010),
        ((0.32, -0.18, 0.32), (0.42, -0.15, 0.40), (0.50, -0.12, 0.45), 0.020, 0.010),
    ]

    for p0, p1, p2, r0, r1 in main_branches:
        # Create 6-sided tapered cylinder along curve
        pts = [mathutils.Vector(p0), mathutils.Vector(p1), mathutils.Vector(p2)]
        rads = [r0, (r0+r1)*0.55, r1]
        rings = []
        for i, (pt, r) in enumerate(zip(pts, rads)):
            # tangent vector
            if i < len(pts) - 1:
                tangent = (pts[i+1] - pt).normalized()
            else:
                tangent = (pt - pts[i-1]).normalized()
            normal = tangent.orthogonal().normalized()
            binormal = tangent.cross(normal).normalized()

            ring_verts = []
            for s in range(6):
                ang = (s / 6) * math.pi * 2
                offset = (normal * math.cos(ang) + binormal * math.sin(ang)) * r
                ring_verts.append(bm_bark.verts.new(pt + offset))
            rings.append(ring_verts)

        for i in range(len(rings) - 1):
            for s in range(6):
                s_next = (s + 1) % 6
                bm_bark.faces.new((rings[i][s], rings[i+1][s], rings[i+1][s_next], rings[i][s_next]))

    mesh_bark = bpy.data.meshes.new("shrub_bush_bark_mesh")
    bm_bark.to_mesh(mesh_bark)
    bm_bark.free()
    obj_bark = bpy.data.objects.new("shrub_bush_stems", mesh_bark)
    obj_bark.data.materials.append(mat_bark)
    obj_bark.parent = root
    col.objects.link(obj_bark)

    # 4. Build Organic Layered Foliage Clouds & Leaf Blades (BMesh)
    bm_foliage = bmesh.new()
    col_layer = bm_foliage.loops.layers.color.new("Col")

    # Foliage clusters: centers, radii, and color weight
    foliage_clusters = [
        # Center main crown (tallest, medium deep green)
        {"center": (0.02, 0.05, 0.58), "rx": 0.38, "ry": 0.35, "rz": 0.32, "weight": 0.5},
        {"center": (0.05, 0.12, 0.72), "rx": 0.28, "ry": 0.26, "rz": 0.24, "weight": 0.8}, # bright sunny top
        # West lobe
        {"center": (-0.36, -0.15, 0.44), "rx": 0.34, "ry": 0.32, "rz": 0.28, "weight": 0.3},
        {"center": (-0.24, 0.22, 0.42), "rx": 0.30, "ry": 0.32, "rz": 0.26, "weight": 0.4},
        # East lobe
        {"center": (0.38, -0.12, 0.40), "rx": 0.36, "ry": 0.34, "rz": 0.28, "weight": 0.4},
        {"center": (0.28, 0.26, 0.46), "rx": 0.32, "ry": 0.30, "rz": 0.26, "weight": 0.6},
        # Low skirts framing ground contact
        {"center": (-0.18, -0.28, 0.28), "rx": 0.28, "ry": 0.26, "rz": 0.22, "weight": 0.2},
        {"center": (0.20, -0.26, 0.26), "rx": 0.28, "ry": 0.25, "rz": 0.22, "weight": 0.2},
        {"center": (0.02, 0.34, 0.32), "rx": 0.30, "ry": 0.28, "rz": 0.24, "weight": 0.4},
    ]

    # Organic Color Palette (Linear sRGB)
    c_deep = (0.08, 0.28, 0.12, 1.0)    # Deep shadow green
    c_mid = (0.16, 0.48, 0.18, 1.0)     # Natural meadow emerald
    c_light = (0.28, 0.68, 0.22, 1.0)   # Fresh spring leaf
    c_sun = (0.42, 0.78, 0.24, 1.0)     # Sun-kissed golden tip

    # Construct stylized multi-faceted leaf volumes with organic frills
    for cl in foliage_clusters:
        cx, cy, cz = cl["center"]
        rx, ry, rz = cl["rx"], cl["ry"], cl["rz"]
        w = cl["weight"]

        # Base color for this cluster based on elevation & light exposure
        cluster_col = (
            c_deep[0] * (1 - w) + c_sun[0] * w,
            c_deep[1] * (1 - w) + c_sun[1] * w,
            c_deep[2] * (1 - w) + c_sun[2] * w,
            1.0
        )

        # Build an icosahedral faceted clump with vertex displacement
        # Using a 2-segment UV sphere or geosphere
        rings = 5
        sectors = 8
        cluster_rings = []
        for ri in range(rings + 1):
            theta = (ri / rings) * math.pi
            ring_v = []
            for si in range(sectors):
                phi = (si / sectors) * math.pi * 2
                # Asymmetric natural jitter
                noise = 1.0 + 0.14 * math.sin(si * 3.0 + ri * 2.0) - 0.08 * math.cos(si * 2.0)
                vx = cx + rx * math.sin(theta) * math.cos(phi) * noise
                vy = cy + ry * math.sin(theta) * math.sin(phi) * noise
                vz = cz + rz * math.cos(theta) * noise
                v = bm_foliage.verts.new((vx, vy, vz))
                ring_v.append(v)
            cluster_rings.append(ring_v)

        for ri in range(rings):
            for si in range(sectors):
                s_next = (si + 1) % sectors
                v_bl = cluster_rings[ri][si]
                v_br = cluster_rings[ri][s_next]
                v_tl = cluster_rings[ri+1][si]
                v_tr = cluster_rings[ri+1][s_next]

                if ri == 0:
                    f = bm_foliage.faces.new((v_bl, v_tl, v_tr))
                elif ri == rings - 1:
                    f = bm_foliage.faces.new((v_bl, v_tl, v_br))
                else:
                    f = bm_foliage.faces.new((v_bl, v_tl, v_tr, v_br))

                # Color vertex loops
                for loop in f.loops:
                    # Slightly brighten upper loops
                    vert_z = loop.vert.co.z
                    z_ratio = max(0.0, min(1.0, (vert_z - (cz - rz)) / (2 * rz)))
                    loop[col_layer] = (
                        cluster_col[0] * (0.8 + 0.3 * z_ratio),
                        cluster_col[1] * (0.8 + 0.3 * z_ratio),
                        cluster_col[2] * (0.8 + 0.3 * z_ratio),
                        1.0
                    )

    # Add projecting stylized outer leaf blade cards along perimeter for silhouette depth
    num_blades = 22
    for b_idx in range(num_blades):
        ang = (b_idx / num_blades) * math.pi * 2 + 0.15 * math.sin(b_idx)
        elev = 0.32 + 0.35 * (b_idx % 4) / 3.0
        rad = 0.42 + 0.12 * (b_idx % 3)
        bx = rad * math.cos(ang)
        by = rad * math.sin(ang)
        bz = elev

        blade_len = 0.16
        blade_w = 0.08
        tip_x = bx + blade_len * math.cos(ang)
        tip_y = by + blade_len * math.sin(ang)
        tip_z = bz + blade_len * 0.4

        perp_ang = ang + math.pi/2
        v_base = bm_foliage.verts.new((bx, by, bz))
        v_tip = bm_foliage.verts.new((tip_x, tip_y, tip_z))
        v_l = bm_foliage.verts.new((bx*0.5 + tip_x*0.5 - blade_w*math.cos(perp_ang),
                                    by*0.5 + tip_y*0.5 - blade_w*math.sin(perp_ang),
                                    bz*0.5 + tip_z*0.5))
        v_r = bm_foliage.verts.new((bx*0.5 + tip_x*0.5 + blade_w*math.cos(perp_ang),
                                    by*0.5 + tip_y*0.5 + blade_w*math.sin(perp_ang),
                                    bz*0.5 + tip_z*0.5))
        f_b1 = bm_foliage.faces.new((v_base, v_l, v_tip))
        f_b2 = bm_foliage.faces.new((v_base, v_tip, v_r))
        for f in [f_b1, f_b2]:
            for loop in f.loops:
                loop[col_layer] = c_sun

    mesh_foliage = bpy.data.meshes.new("shrub_bush_foliage_mesh")
    bm_foliage.to_mesh(mesh_foliage)
    bm_foliage.free()
    obj_foliage = bpy.data.objects.new("shrub_bush_foliage", mesh_foliage)
    obj_foliage.data.materials.append(mat_foliage)
    obj_foliage.parent = root
    col.objects.link(obj_foliage)

    # 5. Wild Mountain Currant Berries (small spherical jewels nestled in foliage)
    bm_berries = bmesh.new()
    berry_locs = [
        (0.24, 0.28, 0.55), (0.28, 0.25, 0.52), (0.26, 0.31, 0.51), # cluster 1
        (-0.28, -0.16, 0.48), (-0.32, -0.18, 0.45), # cluster 2
        (0.36, -0.08, 0.42), (0.40, -0.06, 0.40), # cluster 3
        (-0.16, 0.26, 0.46), (-0.14, 0.30, 0.44), # cluster 4
        (0.08, -0.25, 0.35), (0.12, -0.27, 0.33)  # cluster 5
    ]
    for bx, by, bz in berry_locs:
        # 6-segment jewel sphere
        b_sub = bmesh.new()
        bmesh.ops.create_uvsphere(b_sub, u_segments=6, v_segments=4, radius=0.032)
        for v in b_sub.verts:
            v.co += mathutils.Vector((bx, by, bz))
        b_sub.to_mesh(bpy.data.meshes.new("tmp")) # merge into bm_berries
        for v in b_sub.verts:
            bm_berries.verts.new(v.co)
        b_sub.free()

    # Reconstruct berry faces
    for bx, by, bz in berry_locs:
        bmesh.ops.create_uvsphere(bm_berries, u_segments=6, v_segments=4, radius=0.034)
        # Offset last created verts
        for v in bm_berries.verts[-22:]:
            v.co += mathutils.Vector((bx, by, bz))

    mesh_berries = bpy.data.meshes.new("shrub_bush_berries_mesh")
    bm_berries.to_mesh(mesh_berries)
    bm_berries.free()
    obj_berries = bpy.data.objects.new("shrub_bush_berries", mesh_berries)
    obj_berries.data.materials.append(mat_berry)
    obj_berries.parent = root
    col.objects.link(obj_berries)

    # 6. Smooth Shading & Normal Calculation
    for obj in [obj_bark, obj_foliage, obj_berries]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        obj.select_set(False)

    # 7. Save .blend and export runtime .glb
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "shrub_bush.blend")
    glb_path = os.path.join(out_dir, "shrub_bush.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Shrub Bush Blend to {blend_path}")

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
    print(f"[SUCCESS] Exported Shrub Bush GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

create_bush_asset()
