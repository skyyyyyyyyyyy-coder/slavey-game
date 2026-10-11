import bpy
import bmesh
import math
import mathutils
import os

def create_carrot_assets():
    print("=== CREATING BLENDER CARROT ASSET FAMILY (4 STAGES) ===")
    
    # 1. Clear Scene safely (preserve Blender MCP server connection)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)
    
    # Ensure collection
    col = bpy.context.scene.collection

    # 2. Materials
    # Stylized PBR Carrot Material using Vertex Colors for organic gradients
    mat_carrot = bpy.data.materials.new(name="M_Carrot_Stylized")
    mat_carrot.use_nodes = True
    nodes = mat_carrot.node_tree.nodes
    links = mat_carrot.node_tree.links
    nodes.clear()

    # Shader setup
    vcolor_node = nodes.new(type="ShaderNodeVertexColor")
    vcolor_node.layer_name = "Col"
    
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.58
    bsdf.inputs["Metallic"].default_value = 0.0

    mat_carrot.use_backface_culling = False

    output = nodes.new(type="ShaderNodeOutputMaterial")

    links.new(vcolor_node.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    # Colors (Linear sRGB)
    c_orange_ripe = (0.92, 0.32, 0.04, 1.0)
    c_orange_mid = (0.94, 0.45, 0.08, 1.0)
    c_collar_dirt = (0.42, 0.28, 0.14, 1.0)
    c_stem_base = (0.35, 0.65, 0.22, 1.0)
    c_leaf_green = (0.16, 0.52, 0.20, 1.0)
    c_leaf_lush = (0.10, 0.42, 0.16, 1.0)
    c_sprout_bright = (0.32, 0.78, 0.28, 1.0)

    # Master Root Empty
    root = bpy.data.objects.new("crop_carrot", None)
    col.objects.link(root)

    # =========================================================================
    # HELPER: Build a curved feathery frond with leaflets using BMesh
    # =========================================================================
    def build_frond(bm, color_layer, length, curve_angle, azimuth_angle, leaflet_pairs=4, leaflet_scale=0.04, base_color=c_stem_base, tip_color=c_leaf_lush):
        segments = 6
        stem_verts = []
        for s in range(segments + 1):
            t = s / segments
            # Quadratic parabolic curvature
            r = t * length * math.cos(curve_angle * t)
            z = t * length * math.sin(math.pi/2 - curve_angle * t)
            x = r * math.cos(azimuth_angle)
            y = r * math.sin(azimuth_angle)
            
            # Stem thickness tapers from base to tip
            thick = (1.0 - t * 0.7) * (length * 0.035)
            # Cross section 4-gon
            v0 = bm.verts.new((x - thick * math.sin(azimuth_angle), y + thick * math.cos(azimuth_angle), z))
            v1 = bm.verts.new((x + thick * math.sin(azimuth_angle), y - thick * math.cos(azimuth_angle), z))
            v2 = bm.verts.new((x, y, z + thick))
            v3 = bm.verts.new((x, y, z - thick))
            stem_verts.append((v0, v1, v2, v3))

        # Stitch stem tubes
        for s in range(segments):
            curr = stem_verts[s]
            nxt = stem_verts[s+1]
            t = s / segments
            c = (
                base_color[0] * (1-t) + tip_color[0] * t,
                base_color[1] * (1-t) + tip_color[1] * t,
                base_color[2] * (1-t) + tip_color[2] * t,
                1.0
            )
            # 4 side faces
            f1 = bm.faces.new((curr[0], nxt[0], nxt[2], curr[2]))
            f2 = bm.faces.new((curr[2], nxt[2], nxt[1], curr[1]))
            f3 = bm.faces.new((curr[1], nxt[1], nxt[3], curr[3]))
            f4 = bm.faces.new((curr[3], nxt[3], nxt[0], curr[0]))
            for f in [f1, f2, f3, f4]:
                for l in f.loops:
                    l[color_layer] = c

        # Add side leaflets branching along the petiole
        for lp in range(1, leaflet_pairs + 1):
            t_lp = lp / (leaflet_pairs + 1)
            # Find closest stem segment
            seg_idx = int(t_lp * segments)
            mid = stem_verts[seg_idx]
            mx = (mid[0].co.x + mid[1].co.x) * 0.5
            my = (mid[0].co.y + mid[1].co.y) * 0.5
            mz = (mid[0].co.z + mid[1].co.z) * 0.5

            l_len = leaflet_scale * (1.2 - t_lp * 0.4)
            # Branch angles left and right
            for side in [-1, 1]:
                branch_ang = azimuth_angle + side * math.radians(65)
                tip_x = mx + l_len * math.cos(branch_ang)
                tip_y = my + l_len * math.sin(branch_ang)
                tip_z = mz + l_len * 0.35

                # 3-segment leaf blade diamond
                v_stem = bm.verts.new((mx, my, mz))
                v_tip = bm.verts.new((tip_x, tip_y, tip_z))
                
                perp_ang = branch_ang + math.pi/2
                w = l_len * 0.45
                v_l = bm.verts.new((mx * 0.5 + tip_x * 0.5 - w * math.cos(perp_ang), my * 0.5 + tip_y * 0.5 - w * math.sin(perp_ang), mz * 0.5 + tip_z * 0.5))
                v_r = bm.verts.new((mx * 0.5 + tip_x * 0.5 + w * math.cos(perp_ang), my * 0.5 + tip_y * 0.5 + w * math.sin(perp_ang), mz * 0.5 + tip_z * 0.5))

                f_a = bm.faces.new((v_stem, v_l, v_tip))
                f_b = bm.faces.new((v_stem, v_tip, v_r))

                for f in [f_a, f_b]:
                    for l in f.loops:
                        l[color_layer] = tip_color

    # =========================================================================
    # STAGE 1: SEEDLING (Height ~ 0.08m)
    # =========================================================================
    print("Building Stage 1 Seedling...")
    bm1 = bmesh.new()
    col1 = bm1.loops.layers.color.new("Col")

    # 3 small cotyledon sprouts
    for i in range(3):
        az = (i / 3) * math.pi * 2 + 0.2
        build_frond(bm1, col1, length=0.08, curve_angle=math.radians(28), azimuth_angle=az,
                    leaflet_pairs=2, leaflet_scale=0.022, base_color=c_sprout_bright, tip_color=c_sprout_bright)

    # Soil collar plug at (0, 0, 0)
    mesh1 = bpy.data.meshes.new("crop_carrot_stage1_mesh")
    bm1.to_mesh(mesh1)
    bm1.free()

    obj1 = bpy.data.objects.new("stage_01_seedling", mesh1)
    obj1.data.materials.append(mat_carrot)
    obj1.parent = root
    col.objects.link(obj1)

    # =========================================================================
    # STAGE 2: GROWING (Height ~ 0.24m)
    # =========================================================================
    print("Building Stage 2 Growing...")
    bm2 = bmesh.new()
    col2 = bm2.loops.layers.color.new("Col")

    # 5 fronds radially arranged with slight upward curve
    for i in range(5):
        az = (i / 5) * math.pi * 2 + (i % 2) * 0.15
        f_len = 0.22 + (i % 3) * 0.02
        build_frond(bm2, col2, length=f_len, curve_angle=math.radians(35), azimuth_angle=az,
                    leaflet_pairs=4, leaflet_scale=0.045, base_color=c_stem_base, tip_color=c_leaf_green)

    # Central hypocotyl crown at soil level
    mesh2 = bpy.data.meshes.new("crop_carrot_stage2_mesh")
    bm2.to_mesh(mesh2)
    bm2.free()

    obj2 = bpy.data.objects.new("stage_02_growing", mesh2)
    obj2.data.materials.append(mat_carrot)
    obj2.parent = root
    col.objects.link(obj2)

    # =========================================================================
    # STAGE 3: MATURING (Height ~ 0.38m, with crown peeking out)
    # =========================================================================
    print("Building Stage 3 Maturing...")
    bm3 = bmesh.new()
    col3 = bm3.loops.layers.color.new("Col")

    # 1. Orange carrot root top emerging 1.8cm above ground
    # Cylinder ring at ground (0,0,0) tapering into crown at y=0.022
    segs = 10
    ring_bottom = []
    ring_top = []
    r_crown = 0.026
    r_bot = 0.022
    h_crown = 0.024

    for s in range(segs):
        ang = (s / segs) * math.pi * 2
        vb = bm3.verts.new((math.cos(ang) * r_bot, math.sin(ang) * r_bot, 0.0))
        vt = bm3.verts.new((math.cos(ang) * r_crown, math.sin(ang) * r_crown, h_crown))
        ring_bottom.append(vb)
        ring_top.append(vt)

    # Cap bottom and walls
    v_top_center = bm3.verts.new((0, 0, h_crown + 0.005))
    for s in range(segs):
        nxt = (s + 1) % segs
        f_side = bm3.faces.new((ring_bottom[s], ring_bottom[nxt], ring_top[nxt], ring_top[s]))
        f_top = bm3.faces.new((ring_top[s], ring_top[nxt], v_top_center))
        for l in f_side.loops:
            l[col3] = c_collar_dirt if l.vert.co.z < 0.008 else c_orange_mid
        for l in f_top.loops:
            l[col3] = c_orange_mid

    # 2. 7 feathery fronds arching outwards from top of crown
    for i in range(7):
        az = (i / 7) * math.pi * 2 + (i % 2) * 0.2
        f_len = 0.35 + (i % 3) * 0.03
        build_frond(bm3, col3, length=f_len, curve_angle=math.radians(45), azimuth_angle=az,
                    leaflet_pairs=5, leaflet_scale=0.065, base_color=c_stem_base, tip_color=c_leaf_lush)

    mesh3 = bpy.data.meshes.new("crop_carrot_stage3_mesh")
    bm3.to_mesh(mesh3)
    bm3.free()

    obj3 = bpy.data.objects.new("stage_03_maturing", mesh3)
    obj3.data.materials.append(mat_carrot)
    obj3.parent = root
    col.objects.link(obj3)

    # =========================================================================
    # STAGE 4: HARVEST READY (Height ~ 0.48m, plump ripe root shoulder)
    # =========================================================================
    print("Building Stage 4 Harvest Ready...")
    bm4 = bmesh.new()
    col4 = bm4.loops.layers.color.new("Col")

    # 1. Ripe Root Shoulder: 3.5cm visible above ground, ribbed organic taproot
    root_segs = 12
    r_shoulder = 0.046
    r_base = 0.038
    h_top = 0.040

    rings = []
    height_steps = [0.0, 0.015, 0.030, h_top]
    radius_steps = [r_base, r_shoulder, r_shoulder * 0.95, r_shoulder * 0.80]

    for step_idx, (hz, rz) in enumerate(zip(height_steps, radius_steps)):
        curr_ring = []
        for s in range(root_segs):
            ang = (s / root_segs) * math.pi * 2
            # Subtle organic fluting on carrot shoulder
            flute = 1.0 + 0.06 * math.sin(ang * 4.0)
            vx = math.cos(ang) * rz * flute
            vy = math.sin(ang) * rz * flute
            curr_ring.append(bm4.verts.new((vx, vy, hz)))
        rings.append(curr_ring)

    # Stitch root cylinder segments
    for step_idx in range(len(rings) - 1):
        r_curr = rings[step_idx]
        r_nxt = rings[step_idx + 1]
        for s in range(root_segs):
            nxt = (s + 1) % root_segs
            f = bm4.faces.new((r_curr[s], r_curr[nxt], r_nxt[nxt], r_nxt[s]))
            for l in f.loops:
                l[col4] = c_collar_dirt if l.vert.co.z < 0.01 else c_orange_ripe

    # Crown dome top
    v_crown_center = bm4.verts.new((0, 0, h_top + 0.008))
    top_ring = rings[-1]
    for s in range(root_segs):
        nxt = (s + 1) % root_segs
        f = bm4.faces.new((top_ring[s], top_ring[nxt], v_crown_center))
        for l in f.loops:
            l[col4] = c_orange_ripe

    # 2. 9 lush, feathery fronds arching gracefully
    for i in range(9):
        az = (i / 9) * math.pi * 2 + (i % 2) * 0.18
        f_len = 0.44 + (i % 3) * 0.04
        # Multi-tiered arch angles: outer fronds arch wider, inner ones stand more upright
        arch = math.radians(52) if (i % 2 == 0) else math.radians(38)
        build_frond(bm4, col4, length=f_len, curve_angle=arch, azimuth_angle=az,
                    leaflet_pairs=6, leaflet_scale=0.08, base_color=c_stem_base, tip_color=c_leaf_lush)

    mesh4 = bpy.data.meshes.new("crop_carrot_stage4_mesh")
    bm4.to_mesh(mesh4)
    bm4.free()

    obj4 = bpy.data.objects.new("stage_04_harvest_ready", mesh4)
    obj4.data.materials.append(mat_carrot)
    obj4.parent = root
    col.objects.link(obj4)

    # 3. Ensure Normals & Smooth Shading
    for obj in [obj1, obj2, obj3, obj4]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        obj.select_set(False)

    # 4. Save and Export
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)
    
    blend_path = os.path.join(out_dir, "crop_carrot.blend")
    glb_path = os.path.join(out_dir, "crop_carrot.glb")

    # Save .blend source
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Carrot Blend to {blend_path}")

    # Export .glb runtime
    # Select root and its children
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for child in root.children:
        child.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    print(f"[SUCCESS] Exported Carrot GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

create_carrot_assets()
