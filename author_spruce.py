"""
Blender 5.2 Python script to build the Handcrafted Stylized-Realistic Alpine Spruce Tree.
Matches the Reference Board:
- Organic tapered trunk with 6 prominent buttress root flares (Z=0 to 8.2m)
- 8 dense tiers of drooping, layered needle boughs with asymmetric branch length
- Outer faceted bough tips (curved drooping fans) with lighter sunlit tips
- Darker inner needle shadow volumes
- Natural asymmetry and organic silhouette
- Exports: public/models/tree_spruce.glb and saves public/models/tree_spruce.blend
"""

import bpy
import bmesh
import math
import mathutils
import os

def build_spruce():
    print("=== AUTHORING PREMIUM BLENDER SPRUCE TREE ===")

    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes):
        if b.users == 0: bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        if b.users == 0: bpy.data.materials.remove(b)

    col = bpy.context.scene.collection

    # 2. Materials
    # Stylized Needle Foliage Material with Vertex Color
    mat_needle = bpy.data.materials.new(name="M_Spruce_Needles")
    mat_needle.use_nodes = True
    mat_needle.use_backface_culling = False
    nodes_n = mat_needle.node_tree.nodes
    links_n = mat_needle.node_tree.links
    nodes_n.clear()

    vc_n = nodes_n.new(type="ShaderNodeVertexColor")
    vc_n.layer_name = "Col"
    bsdf_n = nodes_n.new(type="ShaderNodeBsdfPrincipled")
    bsdf_n.inputs["Roughness"].default_value = 0.70
    bsdf_n.inputs["Metallic"].default_value = 0.0
    out_n = nodes_n.new(type="ShaderNodeOutputMaterial")
    links_n.new(vc_n.outputs["Color"], bsdf_n.inputs["Base Color"])
    links_n.new(bsdf_n.outputs["BSDF"], out_n.inputs["Surface"])

    # Organic Timber Bark Material
    mat_bark = bpy.data.materials.new(name="M_Spruce_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Base Color"].default_value = (0.24, 0.16, 0.10, 1.0) # Warm alpine pine bark
    bsdf_b.inputs["Roughness"].default_value = 0.88
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    # Root Empty
    root = bpy.data.objects.new("tree_spruce_root", None)
    col.objects.link(root)

    # 3. Organic Tapered Trunk with 6 Buttress Root Flares
    bm_trunk = bmesh.new()
    trunk_h = 8.4
    rings = 10
    trunk_ring_verts = []

    for r_idx in range(rings + 1):
        t = r_idx / rings
        z = t * trunk_h
        # Base flare: wide at ground (r=0.48), tapering to r=0.06 at spire
        rad = 0.44 * math.pow(1.0 - t, 0.65) + 0.06
        if r_idx == 0:
            rad = 0.62 # Expanded buttress ground collar

        # Organic lean curve
        lx = 0.09 * math.sin(t * math.pi)
        ly = 0.05 * math.cos(t * math.pi * 1.2)

        ring = []
        sides = 8
        for i in range(sides):
            ang = (i / sides) * math.pi * 2
            flare = 1.0
            # 6 buttress root flares at base (rings 0 and 1)
            if r_idx == 0:
                flare = 1.0 + 0.35 * math.cos(ang * 3.0)
            elif r_idx == 1:
                flare = 1.0 + 0.15 * math.cos(ang * 3.0)
            vx = lx + rad * flare * math.cos(ang)
            vy = ly + rad * flare * math.sin(ang)
            ring.append(bm_trunk.verts.new((vx, vy, z)))
        trunk_ring_verts.append(ring)

    for r_idx in range(rings):
        for i in range(8):
            i_next = (i + 1) % 8
            bm_trunk.faces.new((
                trunk_ring_verts[r_idx][i],
                trunk_ring_verts[r_idx+1][i],
                trunk_ring_verts[r_idx+1][i_next],
                trunk_ring_verts[r_idx][i_next]
            ))

    # Cap base at Z=0
    bm_trunk.faces.new(reversed(trunk_ring_verts[0]))
    # Cap spire
    spire_pt = bm_trunk.verts.new((0.09 * math.sin(math.pi), 0.05 * math.cos(math.pi * 1.2), trunk_h + 0.35))
    for i in range(8):
        i_next = (i + 1) % 8
        bm_trunk.faces.new((trunk_ring_verts[-1][i], spire_pt, trunk_ring_verts[-1][i_next]))

    mesh_trunk = bpy.data.meshes.new("tree_spruce_trunk_mesh")
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    obj_trunk = bpy.data.objects.new("tree_spruce_trunk", mesh_trunk)
    obj_trunk.data.materials.append(mat_bark)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)

    # 4. Handcrafted Multi-Tier Drooping Needle Boughs (BMesh with Vertex Colors)
    bm_needles = bmesh.new()
    col_layer = bm_needles.loops.layers.color.new("Col")

    # Needle Color Palette (Linear sRGB)
    c_shadow = (0.05, 0.16, 0.07, 1.0) # Deep inner needle core
    c_mid    = (0.09, 0.32, 0.14, 1.0) # Alpine emerald forest body
    c_outer  = (0.16, 0.48, 0.20, 1.0) # Outer sunlit foliage
    c_tip    = (0.28, 0.65, 0.26, 1.0) # Bright fresh shoot tips

    # 8 Tiers of needle boughs from Z=1.6m up to Z=7.8m
    # (elev_z, bough_count, spread_r, droop_angle, depth)
    tier_configs = [
        (1.6, 7, 2.9, math.radians(24), 0.82), # Tier 1: Lowest, widest skirt
        (2.4, 7, 2.6, math.radians(21), 0.76), # Tier 2
        (3.3, 6, 2.3, math.radians(18), 0.70), # Tier 3
        (4.2, 6, 1.9, math.radians(15), 0.64), # Tier 4
        (5.1, 5, 1.5, math.radians(11), 0.58), # Tier 5
        (6.0, 5, 1.1, math.radians(7),  0.50), # Tier 6
        (6.9, 4, 0.75, math.radians(4), 0.42), # Tier 7
        (7.7, 3, 0.42, math.radians(0), 0.35)  # Tier 8: Crown spire cluster
    ]

    for tier_idx, (tz, b_count, spread, droop, b_depth) in enumerate(tier_configs):
        az_offset = (tier_idx * 0.46) % (math.pi * 2)

        for b_i in range(b_count):
            base_az = az_offset + (b_i / b_count) * math.pi * 2
            az = base_az + 0.10 * math.sin(b_i * 2.7 + tier_idx * 1.3) # Natural asymmetry
            # Branch length variation (creates stepped alpine silhouette)
            cur_spread = spread * (0.88 + 0.24 * math.cos(b_i * 1.9 + tier_idx))

            # 3 fan segments along bough length: root collar, main mid-mass, drooping tip
            segs = 3
            for seg in range(segs):
                t0 = seg / segs
                t1 = (seg + 1) / segs

                r0 = 0.28 + cur_spread * t0
                r1 = 0.28 + cur_spread * t1

                z0 = tz - (t0 * t0) * cur_spread * math.sin(droop)
                z1 = tz - (t1 * t1) * cur_spread * math.sin(droop)

                w0 = (0.30 + 0.48 * math.sin(t0 * math.pi)) * (1.0 - 0.15 * (tier_idx / 8.0))
                w1 = (0.30 + 0.48 * math.sin(t1 * math.pi)) * (1.0 - 0.15 * (tier_idx / 8.0))
                if seg == segs - 1:
                    w1 = 0.06 # Crisp tapered needle tip

                px = -math.sin(az)
                py = math.cos(az)
                dx = math.cos(az)
                dy = math.sin(az)

                # Central spine ridge vertex for 3D tent-roof volume
                h_ridge0 = 0.22 * math.sin(t0 * math.pi + 0.2)
                h_ridge1 = 0.22 * math.sin(t1 * math.pi + 0.2)

                # 4 boundary vertices per quad segment
                v0_l = bm_needles.verts.new((dx * r0 - px * w0, dy * r0 - py * w0, z0 - 0.05))
                v0_r = bm_needles.verts.new((dx * r0 + px * w0, dy * r0 + py * w0, z0 - 0.05))
                v0_c = bm_needles.verts.new((dx * r0, dy * r0, z0 + h_ridge0))

                v1_l = bm_needles.verts.new((dx * r1 - px * w1, dy * r1 - py * w1, z1 - 0.05))
                v1_r = bm_needles.verts.new((dx * r1 + px * w1, dy * r1 + py * w1, z1 - 0.05))
                v1_c = bm_needles.verts.new((dx * r1, dy * r1, z1 + h_ridge1))

                # Left tent facet
                f_left = bm_needles.faces.new((v0_l, v1_l, v1_c, v0_c))
                # Right tent facet
                f_right = bm_needles.faces.new((v0_c, v1_c, v1_r, v0_r))
                # Bottom under-canopy shadow facet
                f_bot = bm_needles.faces.new((v0_r, v1_r, v1_l, v0_l))

                # Assign vertex colors based on depth and radial position
                c_start = c_shadow if seg == 0 else c_mid
                c_end   = c_outer if seg < segs - 1 else c_tip

                for loop in f_left.loops:
                    loop[col_layer] = c_end if loop.vert in (v1_l, v1_c) else c_start
                for loop in f_right.loops:
                    loop[col_layer] = c_end if loop.vert in (v1_r, v1_c) else c_start
                for loop in f_bot.loops:
                    loop[col_layer] = c_shadow

    mesh_needles = bpy.data.meshes.new("tree_spruce_needles_mesh")
    bm_needles.to_mesh(mesh_needles)
    bm_needles.free()
    obj_needles = bpy.data.objects.new("tree_spruce_needles", mesh_needles)
    obj_needles.data.materials.append(mat_needle)
    obj_needles.parent = root
    col.objects.link(obj_needles)

    # 5. Export GLB & Save Blend
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)
    blend_path = os.path.join(out_dir, "tree_spruce.blend")
    glb_path = os.path.join(out_dir, "tree_spruce.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Blend:", blend_path)

    # Select hierarchy for GLB export
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    obj_trunk.select_set(True)
    obj_needles.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print("Exported GLB:", glb_path)
    print("Spruce Model Build Complete!")

build_spruce()
