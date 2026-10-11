import bpy
import bmesh
import math
import mathutils
import os

def create_spruce_asset():
    print("=== CREATING BLENDER SPRUCE TREE ASSET ===")

    # 1. Clear scene safely
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

    col = bpy.context.scene.collection

    # 2. Materials
    # Stylized Needle Foliage Material with Vertex Color modulation
    mat_needle = bpy.data.materials.new(name="M_Spruce_Needles")
    mat_needle.use_nodes = True
    mat_needle.use_backface_culling = False
    nodes_n = mat_needle.node_tree.nodes
    links_n = mat_needle.node_tree.links
    nodes_n.clear()

    vc_n = nodes_n.new(type="ShaderNodeVertexColor")
    vc_n.layer_name = "Col"
    bsdf_n = nodes_n.new(type="ShaderNodeBsdfPrincipled")
    bsdf_n.inputs["Roughness"].default_value = 0.72
    bsdf_n.inputs["Metallic"].default_value = 0.0
    out_n = nodes_n.new(type="ShaderNodeOutputMaterial")
    links_n.new(vc_n.outputs["Color"], bsdf_n.inputs["Base Color"])
    links_n.new(bsdf_n.outputs["BSDF"], out_n.inputs["Surface"])

    # Spruce Timber Bark Material
    mat_bark = bpy.data.materials.new(name="M_Spruce_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Base Color"].default_value = (0.24, 0.16, 0.10, 1.0) # weathered alpine pine bark
    bsdf_b.inputs["Roughness"].default_value = 0.88
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    root = bpy.data.objects.new("tree_spruce_root", None)
    col.objects.link(root)

    # 3. Tapered Trunk with Natural Flared Buttresses (BMesh)
    bm_trunk = bmesh.new()
    trunk_height = 8.2
    segments = 8
    trunk_rings = []

    # Slight organic lean/curvature along trunk
    for s in range(segments + 1):
        t = s / segments
        z = t * trunk_height
        # Base flare: wide at ground z=0 (r=0.42), tapering to r=0.06 at spire
        rad = 0.42 * math.pow(1.0 - t, 0.6) + 0.06
        if s == 0:
            rad = 0.54 # Root flare
        
        # Subtle organic lean
        lean_x = 0.08 * math.sin(t * math.pi)
        lean_y = 0.04 * math.sin(t * math.pi * 1.5)

        ring_verts = []
        num_sides = 8
        for i in range(num_sides):
            ang = (i / num_sides) * math.pi * 2
            # Add subtle buttress ribs at base
            rib_flare = 1.0
            if s <= 1 and (i % 2 == 0):
                rib_flare = 1.25
            vx = lean_x + rad * rib_flare * math.cos(ang)
            vy = lean_y + rad * rib_flare * math.sin(ang)
            vz = z
            ring_verts.append(bm_trunk.verts.new((vx, vy, vz)))
        trunk_rings.append(ring_verts)

    for s in range(segments):
        for i in range(8):
            i_next = (i + 1) % 8
            bm_trunk.faces.new((trunk_rings[s][i], trunk_rings[s+1][i], trunk_rings[s+1][i_next], trunk_rings[s][i_next]))

    # Cap bottom at Z=0
    bm_trunk.faces.new(reversed(trunk_rings[0]))
    # Cap top point
    top_pt = bm_trunk.verts.new((0.08 * math.sin(math.pi), 0, trunk_height + 0.3))
    for i in range(8):
        i_next = (i + 1) % 8
        bm_trunk.faces.new((trunk_rings[-1][i], top_pt, trunk_rings[-1][i_next]))

    mesh_trunk = bpy.data.meshes.new("tree_spruce_trunk_mesh")
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    obj_trunk = bpy.data.objects.new("tree_spruce_trunk", mesh_trunk)
    obj_trunk.data.materials.append(mat_bark)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)

    # 4. Handcrafted Multi-Tier Needle Boughs (BMesh)
    bm_needles = bmesh.new()
    col_layer = bm_needles.loops.layers.color.new("Col")

    # Spruce Color Palette (Linear sRGB)
    c_shadow = (0.05, 0.18, 0.08, 1.0) # Deep inner needle shadow
    c_mid = (0.10, 0.36, 0.16, 1.0)    # Alpine forest green
    c_outer = (0.18, 0.52, 0.22, 1.0)  # Lush outer foliage
    c_tip = (0.28, 0.68, 0.28, 1.0)    # Bright new shoot tips

    # 7 Tiers of needle boughs from height 1.8m up to 7.8m
    tier_configs = [
        # (elev_z, bough_count, spread_r, droop_angle, depth)
        (1.8, 6, 2.7, math.radians(22), 0.75),  # Tier 1: Lowest, widest, deepest droop
        (2.7, 6, 2.4, math.radians(18), 0.70),  # Tier 2
        (3.6, 5, 2.1, math.radians(15), 0.65),  # Tier 3
        (4.5, 5, 1.7, math.radians(12), 0.60),  # Tier 4
        (5.4, 4, 1.3, math.radians(8),  0.55),  # Tier 5
        (6.3, 4, 0.9, math.radians(4),  0.50),  # Tier 6
        (7.2, 3, 0.5, math.radians(0),  0.42),  # Tier 7: Crown apical cluster
    ]

    for tier_idx, (tz, b_count, spread, droop, b_depth) in enumerate(tier_configs):
        azimuth_offset = (tier_idx * 0.42) % (math.pi * 2)

        for b_i in range(b_count):
            base_azimuth = azimuth_offset + (b_i / b_count) * math.pi * 2
            # Add slight organic azimuth variation
            az = base_azimuth + 0.08 * math.sin(b_i * 2.3 + tier_idx)
            cur_spread = spread * (0.92 + 0.16 * math.cos(b_i * 1.7))

            # Each bough has 3 fan segments along its length (inner, middle, tip)
            # creating a lush, multi-layered drooping conifer branch
            b_segments = 3
            for seg in range(b_segments):
                seg_t0 = seg / b_segments
                seg_t1 = (seg + 1) / b_segments

                r0 = 0.3 + cur_spread * seg_t0
                r1 = 0.3 + cur_spread * seg_t1

                # Droop formula: curves downward as it extends outward
                z0 = tz - (seg_t0 * seg_t0) * cur_spread * math.sin(droop)
                z1 = tz - (seg_t1 * seg_t1) * cur_spread * math.sin(droop)

                # Width expands in middle then tapers at tip
                w0 = (0.28 + 0.45 * math.sin(seg_t0 * math.pi)) * (1.0 - 0.2 * (tier_idx / 7.0))
                w1 = (0.28 + 0.45 * math.sin(seg_t1 * math.pi)) * (1.0 - 0.2 * (tier_idx / 7.0))
                if seg == b_segments - 1:
                    w1 = 0.05 # Tapered tip

                perp_x = -math.sin(az)
                perp_y = math.cos(az)
                dir_x = math.cos(az)
                dir_y = math.sin(az)

                # 4-quad faceted tent profile for believable needle thickness & underside shadow
                # Base verts (inner edge of segment)
                v_in_center = bm_needles.verts.new((r0 * dir_x, r0 * dir_y, z0))
                v_in_left = bm_needles.verts.new((r0 * dir_x + w0 * perp_x, r0 * dir_y + w0 * perp_y, z0 - b_depth * 0.3))
                v_in_right = bm_needles.verts.new((r0 * dir_x - w0 * perp_x, r0 * dir_y - w0 * perp_y, z0 - b_depth * 0.3))

                # Outer verts (outer edge of segment)
                v_out_center = bm_needles.verts.new((r1 * dir_x, r1 * dir_y, z1))
                v_out_left = bm_needles.verts.new((r1 * dir_x + w1 * perp_x, r1 * dir_y + w1 * perp_y, z1 - b_depth * 0.3))
                v_out_right = bm_needles.verts.new((r1 * dir_x - w1 * perp_x, r1 * dir_y - w1 * perp_y, z1 - b_depth * 0.3))

                # Upper faceted bough surfaces (top lit)
                f_top_l = bm_needles.faces.new((v_in_center, v_out_center, v_out_left, v_in_left))
                f_top_r = bm_needles.faces.new((v_in_center, v_in_right, v_out_right, v_out_center))

                # Color vertex loops according to light exposure & radial distance
                for f, side in [(f_top_l, 'left'), (f_top_r, 'right')]:
                    for loop in f.loops:
                        rad_prog = (loop.vert.co.z - 1.8) / 6.0
                        # Inner loops darker, outer loops vibrant green, tip loops bright
                        is_tip = (loop.vert == v_out_center or loop.vert == v_out_left or loop.vert == v_out_right) and (seg == b_segments - 1)
                        is_inner = (loop.vert == v_in_center or loop.vert == v_in_left or loop.vert == v_in_right) and (seg == 0)

                        if is_inner:
                            loop[col_layer] = c_shadow
                        elif is_tip:
                            loop[col_layer] = c_tip
                        elif seg == 1:
                            loop[col_layer] = c_mid
                        else:
                            loop[col_layer] = c_outer

    # Add spire crown tip (apical leader)
    spire_z = 7.6
    spire_top = bm_needles.verts.new((0, 0, trunk_height + 0.6))
    for s_i in range(5):
        ang0 = (s_i / 5) * math.pi * 2
        ang1 = ((s_i + 1) / 5) * math.pi * 2
        r_spire = 0.25
        v0 = bm_needles.verts.new((r_spire * math.cos(ang0), r_spire * math.sin(ang0), spire_z))
        v1 = bm_needles.verts.new((r_spire * math.cos(ang1), r_spire * math.sin(ang1), spire_z))
        f_spire = bm_needles.faces.new((v0, spire_top, v1))
        for loop in f_spire.loops:
            loop[col_layer] = c_tip if loop.vert == spire_top else c_outer

    mesh_needles = bpy.data.meshes.new("tree_spruce_needles_mesh")
    bm_needles.to_mesh(mesh_needles)
    bm_needles.free()
    obj_needles = bpy.data.objects.new("tree_spruce_needles", mesh_needles)
    obj_needles.data.materials.append(mat_needle)
    obj_needles.parent = root
    col.objects.link(obj_needles)

    # 5. Smooth Shading
    for obj in [obj_trunk, obj_needles]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        obj.select_set(False)

    # 6. Save .blend and export .glb
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "tree_spruce.blend")
    glb_path = os.path.join(out_dir, "tree_spruce.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Spruce Tree Blend to {blend_path}")

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
    print(f"[SUCCESS] Exported Spruce Tree GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

create_spruce_asset()
