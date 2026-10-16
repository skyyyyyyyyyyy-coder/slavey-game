"""
Blender 5.2 Python script to build the Redesigned Stylized-Realistic Alpine Spruce Family.
Eliminates flat triangular plates in favor of:
- 14-sided fluted trunk with 5 buttress root flares, bark vertex colors, and 3D woody branches
- 15 phyllotaxis spiral whorls + inter-whorl lateral boughs (zero horizontal slicing gaps)
- Catenary drooping boughs with upturned J-hook tips, lateral feathered pinnae & hanging needle skirts
- Inner shadow core volumes for full 360-degree silhouette density
- Exports 3 distinct variants:
  1. public/models/tree_spruce.glb (Classic Alpine Spruce - 8.6m)
  2. public/models/tree_spruce_slender.glb (Slender Spire Spruce - 9.3m)
  3. public/models/tree_spruce_broad.glb (Broad Old-Growth Spruce - 7.9m)
"""

import bpy
import bmesh
import math
import mathutils
import os


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0:
            bpy.data.materials.remove(block)


def create_spruce_materials():
    # 1. Stylized Needle Foliage Material with Vertex Color ("Col")
    mat_needle = bpy.data.materials.new(name="M_Spruce_Needles")
    mat_needle.use_nodes = True
    mat_needle.use_backface_culling = False
    nodes_n = mat_needle.node_tree.nodes
    links_n = mat_needle.node_tree.links
    nodes_n.clear()

    vc_n = nodes_n.new(type="ShaderNodeVertexColor")
    vc_n.layer_name = "Col"
    bsdf_n = nodes_n.new(type="ShaderNodeBsdfPrincipled")
    bsdf_n.inputs["Roughness"].default_value = 0.66
    bsdf_n.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf_n.inputs:
        bsdf_n.inputs["Specular IOR Level"].default_value = 0.35
    out_n = nodes_n.new(type="ShaderNodeOutputMaterial")
    links_n.new(vc_n.outputs["Color"], bsdf_n.inputs["Base Color"])
    links_n.new(bsdf_n.outputs["BSDF"], out_n.inputs["Surface"])

    # 2. Detailed Bark Material with Vertex Color ("Col")
    mat_bark = bpy.data.materials.new(name="M_Spruce_Bark")
    mat_bark.use_nodes = True
    nodes_b = mat_bark.node_tree.nodes
    links_b = mat_bark.node_tree.links
    nodes_b.clear()

    vc_b = nodes_b.new(type="ShaderNodeVertexColor")
    vc_b.layer_name = "Col"
    bsdf_b = nodes_b.new(type="ShaderNodeBsdfPrincipled")
    bsdf_b.inputs["Roughness"].default_value = 0.88
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(vc_b.outputs["Color"], bsdf_b.inputs["Base Color"])
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    return mat_bark, mat_needle


def lerp_color(c0, c1, t):
    t = max(0.0, min(1.0, t))
    return (
        c0[0] * (1.0 - t) + c1[0] * t,
        c0[1] * (1.0 - t) + c1[1] * t,
        c0[2] * (1.0 - t) + c1[2] * t,
        1.0
    )


def add_foliage_lobe(bm, col_layer, p_start, p_end, width, thickness, droop_mid, c_base, c_tip, up_curl=0.06):
    """
    Creates a 3D volumetric plumose needle cluster along the vector p_start -> p_end.
    Includes a raised dorsal ridge, flared lateral needle wings, and a shaded ventral keel
    so it never looks like a flat paper plate from any angle.
    """
    vec = p_end - p_start
    length = vec.length
    if length < 0.02:
        return
    forward = vec.normalized()
    world_up = mathutils.Vector((0.0, 0.0, 1.0))
    side = forward.cross(world_up)
    if side.length < 0.001:
        side = mathutils.Vector((1.0, 0.0, 0.0))
    else:
        side.normalize()
    local_up = side.cross(forward).normalized()

    segs = 3
    rings = []
    for s in range(segs + 1):
        t = s / segs
        # Parabolic droop in mid-bough + upward J-curl at tip
        arc_z = -math.sin(t * math.pi) * droop_mid + (t ** 2.2) * up_curl
        center = p_start.lerp(p_end, t) + mathutils.Vector((0.0, 0.0, arc_z))

        # Taper envelope: narrow collar -> broad feathered middle -> pointed shoot tip
        if s == 0:
            w = width * 0.32
            th = thickness * 0.45
        elif s == 1:
            w = width * 1.00
            th = thickness * 1.05
        elif s == 2:
            w = width * 0.78
            th = thickness * 0.80
        else:
            w = width * 0.10
            th = thickness * 0.18

        # 4-vertex diamond-cushion cross section (Top Ridge, Left Wing, Right Wing, Bottom Shadow Keel)
        v_top = bm.verts.new(center + local_up * (th * 0.65))
        v_left = bm.verts.new(center - side * w - local_up * (th * 0.12))
        v_right = bm.verts.new(center + side * w - local_up * (th * 0.12))
        v_bot = bm.verts.new(center - local_up * (th * 0.55))
        rings.append((v_top, v_left, v_bot, v_right, t))

    # Cap base and tip, stitch 4 volumetric cushion sides
    c_shadow = (c_base[0] * 0.55, c_base[1] * 0.58, c_base[2] * 0.55, 1.0)
    for s in range(segs):
        r0 = rings[s]
        r1 = rings[s + 1]
        t0, t1 = r0[4], r1[4]
        col0 = lerp_color(c_base, c_tip, t0)
        col1 = lerp_color(c_base, c_tip, t1)
        col0_sh = lerp_color(c_shadow, c_base, t0 * 0.7)
        col1_sh = lerp_color(c_shadow, c_base, t1 * 0.7)

        # Dorsal left & right sunlit facets
        f_tl = bm.faces.new((r0[0], r1[0], r1[1], r0[1]))
        f_tr = bm.faces.new((r0[3], r1[3], r1[0], r0[0]))
        # Ventral left & right shaded underside facets
        f_bl = bm.faces.new((r0[1], r1[1], r1[2], r0[2]))
        f_br = bm.faces.new((r0[2], r1[2], r1[3], r0[3]))

        for f in (f_tl, f_tr):
            for loop in f.loops:
                loop[col_layer] = col1 if loop.vert in (r1[0], r1[1], r1[3]) else col0
        for f in (f_bl, f_br):
            for loop in f.loops:
                loop[col_layer] = col1_sh if loop.vert in (r1[1], r1[2], r1[3]) else col0_sh

    # Close tip cap
    last = rings[-1]
    f_cap = bm.faces.new((last[0], last[3], last[2], last[1]))
    for loop in f_cap.loops:
        loop[col_layer] = c_tip


def build_spruce_variant(name_prefix, trunk_h, base_r, spread_mult, droop_mult, lean_vec, seed_offset, mat_bark, mat_needle, col):
    root = bpy.data.objects.new(name_prefix, None)
    col.objects.link(root)

    # =========================================================================
    # 1. DETAILED FLUTED TRUNK & 3D WOODY SCAFFOLD BRANCHES
    # =========================================================================
    bm_trunk = bmesh.new()
    col_bark = bm_trunk.loops.layers.color.new("Col")

    c_bark_root = (0.12, 0.08, 0.05, 1.0)   # Earthy mossy root flare
    c_bark_dark = (0.18, 0.11, 0.07, 1.0)   # Deep bark furrow
    c_bark_warm = (0.31, 0.19, 0.11, 1.0)   # Cinnamon-reddish alpine spruce plates
    c_bark_top  = (0.38, 0.25, 0.15, 1.0)   # Young upper crown bark

    rings = 16
    sides = 14
    trunk_ring_verts = []

    def get_trunk_center(t):
        # Natural S-curve & wind lean
        cx = lean_vec[0] * math.sin(t * math.pi * 0.85) + 0.05 * math.sin(t * math.pi * 1.9 + seed_offset)
        cy = lean_vec[1] * math.sin(t * math.pi * 0.75) + 0.04 * math.cos(t * math.pi * 1.6 + seed_offset)
        return mathutils.Vector((cx, cy, t * trunk_h))

    for r_idx in range(rings + 1):
        t = r_idx / rings
        center = get_trunk_center(t)
        rad = base_r * math.pow(1.0 - t, 0.68) + 0.035
        if r_idx == 0:
            rad = base_r * 1.38
        elif r_idx == 1:
            rad = base_r * 1.14

        ring = []
        for i in range(sides):
            ang = (i / sides) * math.pi * 2 + t * 0.35
            # 5 prominent buttress roots at ground base + bark ridge fluting higher up
            if r_idx == 0:
                buttress = 1.0 + 0.34 * max(0.0, math.cos(ang * 5.0 + seed_offset))
            elif r_idx == 1:
                buttress = 1.0 + 0.18 * max(0.0, math.cos(ang * 5.0 + seed_offset))
            elif r_idx == 2:
                buttress = 1.0 + 0.07 * max(0.0, math.cos(ang * 5.0 + seed_offset))
            else:
                buttress = 1.0 + 0.04 * math.sin(ang * 7.0 + r_idx * 0.9)

            vx = center.x + rad * buttress * math.cos(ang)
            vy = center.y + rad * buttress * math.sin(ang)
            ring.append(bm_trunk.verts.new((vx, vy, center.z)))
        trunk_ring_verts.append(ring)

    for r_idx in range(rings):
        t = r_idx / rings
        for i in range(sides):
            i_next = (i + 1) % sides
            f = bm_trunk.faces.new((
                trunk_ring_verts[r_idx][i],
                trunk_ring_verts[r_idx + 1][i],
                trunk_ring_verts[r_idx + 1][i_next],
                trunk_ring_verts[r_idx][i_next]
            ))
            is_furrow = (i % 2 == 0)
            if r_idx <= 1:
                f_col = c_bark_root
            elif is_furrow:
                f_col = c_bark_dark
            else:
                f_col = lerp_color(c_bark_warm, c_bark_top, t)
            for loop in f.loops:
                loop[col_bark] = f_col

    # Cap ground base and apical leader tip
    f_base = bm_trunk.faces.new(reversed(trunk_ring_verts[0]))
    for loop in f_base.loops:
        loop[col_bark] = c_bark_root

    top_center = get_trunk_center(1.0)
    spire_vert = bm_trunk.verts.new((top_center.x, top_center.y, trunk_h + 0.32))
    for i in range(sides):
        i_next = (i + 1) % sides
        f_top = bm_trunk.faces.new((trunk_ring_verts[-1][i], spire_vert, trunk_ring_verts[-1][i_next]))
        for loop in f_top.loops:
            loop[col_bark] = c_bark_top

    # Helper to extrude a 3D woody branch core into each bough
    def add_wood_branch(start_pt, end_pt, r0, r1, droop_z):
        b_segs = 3
        b_sides = 5
        vec = end_pt - start_pt
        if vec.length < 0.1:
            return
        fwd = vec.normalized()
        up = mathutils.Vector((0, 0, 1))
        right = fwd.cross(up)
        if right.length < 0.01:
            right = mathutils.Vector((1, 0, 0))
        else:
            right.normalize()
        loc_up = right.cross(fwd).normalized()

        prev_ring = None
        for s in range(b_segs + 1):
            st = s / b_segs
            pt = start_pt.lerp(end_pt, st)
            pt.z -= math.sin(st * math.pi) * droop_z
            cr = r0 * (1.0 - st) + r1 * st
            cur_ring = []
            for k in range(b_sides):
                a = (k / b_sides) * math.pi * 2
                off = (right * math.cos(a) + loc_up * math.sin(a)) * cr
                cur_ring.append(bm_trunk.verts.new(pt + off))
            if prev_ring is not None:
                for k in range(b_sides):
                    kn = (k + 1) % b_sides
                    fb = bm_trunk.faces.new((prev_ring[k], cur_ring[k], cur_ring[kn], prev_ring[kn]))
                    for loop in fb.loops:
                        loop[col_bark] = c_bark_warm if k % 2 == 0 else c_bark_dark
            prev_ring = cur_ring
        bm_trunk.faces.new(prev_ring)

    # =========================================================================
    # 2. ORGANIC MULTI-WHORL & INTER-WHORL PLUMOSE NEEDLE CANOPY
    # =========================================================================
    bm_needles = bmesh.new()
    col_needles = bm_needles.loops.layers.color.new("Col")

    # 4-Zone Botanical Spruce Palette (Linear sRGB)
    c_interior = (0.035, 0.115, 0.052, 1.0)  # Deep shaded interior needle mass
    c_body     = (0.075, 0.255, 0.115, 1.0)  # Rich alpine conifer emerald
    c_sunlit   = (0.155, 0.435, 0.185, 1.0)  # Sun-kissed outer needle fans
    c_shoot    = (0.285, 0.610, 0.235, 1.0)  # Fresh spring apical tips

    # 15 Overlapping Whorls from Z=1.05m to Z=8.35m (Golden-angle stepped so ZERO flat plates)
    num_whorls = 15
    golden_angle = 2.39996323

    for w_idx in range(num_whorls):
        wt = w_idx / (num_whorls - 1)
        # Elevation from 1.05m up to trunk_h - 0.15m
        base_z = 1.05 + wt * (trunk_h - 1.20)
        t_center = get_trunk_center(base_z / trunk_h)

        # Natural conical envelope with organic lower-skirt swell
        envelope = math.pow(1.0 - wt * 0.88, 0.78)
        if w_idx == 0:
            envelope *= 0.88  # Slight tuck on lowest skirt whorl
        max_spread = (2.85 * spread_mult) * envelope + 0.22

        # Number of main boughs in this whorl (7 at bottom, tapering to 4 at crown)
        bough_count = max(4, int(round(7.5 - wt * 3.5)))
        whorl_az_offset = w_idx * golden_angle + seed_offset

        # Droop is heavier on older lower boughs, more upward on young crown shoots
        droop_factor = (0.52 * (1.0 - wt * 0.72) + 0.08) * droop_mult

        for b_i in range(bough_count):
            az = whorl_az_offset + (b_i / bough_count) * math.pi * 2
            az += 0.14 * math.sin(b_i * 3.1 + w_idx * 1.7 + seed_offset)

            # Irregular branch length (breaks up artificial cone outline)
            len_var = 0.82 + 0.34 * (0.5 + 0.5 * math.sin(b_i * 2.3 + w_idx * 2.9 + seed_offset))
            b_len = max_spread * len_var

            # Vertical jitter per branch so branches in the same whorl don't form a flat disk!
            z_jitter = 0.15 * math.cos(b_i * 2.7 + w_idx * 1.3) * (1.0 - wt * 0.5)
            b_start_z = base_z + z_jitter

            dir_xy = mathutils.Vector((math.cos(az), math.sin(az), 0.0))
            side_xy = mathutils.Vector((-math.sin(az), math.cos(az), 0.0))

            # Anchor inside trunk
            trunk_r_here = base_r * math.pow(1.0 - (base_z / trunk_h), 0.68) * 0.75
            p_root = mathutils.Vector((t_center.x, t_center.y, b_start_z)) + dir_xy * trunk_r_here

            # End point of main bough (droops down, then curls slightly at tip)
            tip_drop = b_len * droop_factor * 0.42 - (0.12 if wt > 0.7 else 0.0)
            p_tip = p_root + dir_xy * b_len + mathutils.Vector((0.0, 0.0, -tip_drop))

            # Add woody scaffold limb for lower/mid whorls
            if wt < 0.78:
                wood_end = p_root.lerp(p_tip, 0.68)
                add_wood_branch(
                    p_root,
                    wood_end,
                    r0=0.055 * (1.0 - wt * 0.55),
                    r1=0.018 * (1.0 - wt * 0.55),
                    droop_z=0.10 * droop_factor
                )

            # Color progression by height and radial position
            c_bough_inner = lerp_color(c_interior, c_body, wt * 0.45)
            c_bough_mid   = lerp_color(c_body, c_sunlit, 0.35 + wt * 0.35)
            c_bough_tip   = lerp_color(c_sunlit, c_shoot, 0.55 + wt * 0.40)

            # 1. Inner Core Cushion (fills trunk-to-branch gap & blocks see-through holes)
            p_core_end = p_root.lerp(p_tip, 0.52) + mathutils.Vector((0, 0, 0.08))
            add_foliage_lobe(
                bm_needles, col_needles,
                p_root, p_core_end,
                width=0.36 * envelope + 0.14,
                thickness=0.34 * envelope + 0.14,
                droop_mid=0.08 * droop_factor,
                c_base=c_interior,
                c_tip=c_bough_mid,
                up_curl=0.03
            )

            # 2. Main Central Plumose Bough (from 25% out to 100% tip)
            p_main_start = p_root.lerp(p_tip, 0.22)
            add_foliage_lobe(
                bm_needles, col_needles,
                p_main_start, p_tip,
                width=0.34 * envelope + 0.12,
                thickness=0.26 * envelope + 0.10,
                droop_mid=0.18 * droop_factor,
                c_base=c_bough_inner,
                c_tip=c_bough_tip,
                up_curl=0.11
            )

            # 3. Feathered Lateral Sub-Fronds (Left & Right Pinnae + Drooping Skirt Fronds)
            if wt < 0.85:
                sub_pairs = 2 if wt < 0.55 else 1
                for sp in range(sub_pairs):
                    frac = 0.38 + sp * 0.28
                    sub_origin = p_root.lerp(p_tip, frac) - mathutils.Vector((0, 0, 0.05 * droop_factor))
                    sub_len = b_len * (0.46 - sp * 0.12)

                    for lr_sign in (-1.0, 1.0):
                        spread_ang = 0.52 + sp * 0.08
                        sub_dir = (dir_xy * math.cos(spread_ang) + side_xy * (lr_sign * math.sin(spread_ang))).normalized()
                        # Hanging curtain droop on lateral fronds breaks up flat horizontal lines
                        sub_tip = sub_origin + sub_dir * sub_len + mathutils.Vector((0.0, 0.0, -sub_len * 0.28 * droop_factor))
                        add_foliage_lobe(
                            bm_needles, col_needles,
                            sub_origin, sub_tip,
                            width=0.24 * envelope + 0.09,
                            thickness=0.20 * envelope + 0.08,
                            droop_mid=0.09 * droop_factor,
                            c_base=c_bough_mid,
                            c_tip=c_bough_tip,
                            up_curl=0.07
                        )

    # 3. Apical Crown Leader Clusters (Vertical spire shoots at top of tree)
    top_pt = get_trunk_center(1.0)
    for s_i in range(5):
        s_az = (s_i / 5.0) * math.pi * 2 + seed_offset
        s_start = top_pt + mathutils.Vector((0.0, 0.0, -0.35 + s_i * 0.06))
        s_end = top_pt + mathutils.Vector((math.cos(s_az) * 0.28, math.sin(s_az) * 0.28, 0.48 + (s_i % 2) * 0.14))
        add_foliage_lobe(
            bm_needles, col_needles,
            s_start, s_end,
            width=0.16,
            thickness=0.16,
            droop_mid=0.01,
            c_base=c_sunlit,
            c_tip=c_shoot,
            up_curl=0.05
        )

    # Central spire leader tip
    add_foliage_lobe(
        bm_needles, col_needles,
        top_pt + mathutils.Vector((0, 0, -0.15)),
        top_pt + mathutils.Vector((0, 0, 0.72)),
        width=0.14,
        thickness=0.14,
        droop_mid=0.0,
        c_base=c_sunlit,
        c_tip=c_shoot,
        up_curl=0.0
    )

    # Build Blender Meshes
    mesh_trunk = bpy.data.meshes.new(f"{name_prefix}_trunk_mesh")
    bm_trunk.normal_update()
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    for poly in mesh_trunk.polygons:
        poly.use_smooth = True

    obj_trunk = bpy.data.objects.new("tree_spruce_trunk", mesh_trunk)
    obj_trunk.data.materials.append(mat_bark)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)

    mesh_needles = bpy.data.meshes.new(f"{name_prefix}_needles_mesh")
    bm_needles.normal_update()
    bm_needles.to_mesh(mesh_needles)
    bm_needles.free()
    for poly in mesh_needles.polygons:
        poly.use_smooth = True

    obj_needles = bpy.data.objects.new("tree_spruce_needles", mesh_needles)
    obj_needles.data.materials.append(mat_needle)
    obj_needles.parent = root
    col.objects.link(obj_needles)

    return root, obj_trunk, obj_needles


def export_hierarchy_glb(root_obj, children_objs, glb_path):
    bpy.ops.object.select_all(action='DESELECT')
    root_obj.select_set(True)
    for ch in children_objs:
        ch.select_set(True)
    bpy.context.view_layer.objects.active = root_obj

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"[SUCCESS] Exported {glb_path} ({os.path.getsize(glb_path)} bytes)")


def build_spruce():
    print("=== AUTHORING STAGE 3A PREMIUM ALPINE SPRUCE FAMILY (3 VARIANTS) ===")
    clear_scene()
    col = bpy.context.scene.collection
    mat_bark, mat_needle = create_spruce_materials()

    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    # Variant 1: Classic Majestic Alpine Spruce (tree_spruce.glb)
    v1_root, v1_trunk, v1_needles = build_spruce_variant(
        name_prefix="tree_spruce_root",
        trunk_h=8.6,
        base_r=0.44,
        spread_mult=1.00,
        droop_mult=1.00,
        lean_vec=(0.10, 0.05),
        seed_offset=0.0,
        mat_bark=mat_bark,
        mat_needle=mat_needle,
        col=col
    )
    export_hierarchy_glb(v1_root, [v1_trunk, v1_needles], os.path.join(out_dir, "tree_spruce.glb"))

    # Save main .blend file with Variant 1 centered at origin
    blend_path = os.path.join(out_dir, "tree_spruce.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Blend: {blend_path}")

    # Variant 2: High-Altitude Slender Spire Spruce (tree_spruce_slender.glb)
    clear_scene()
    mat_bark, mat_needle = create_spruce_materials()
    v2_root, v2_trunk, v2_needles = build_spruce_variant(
        name_prefix="tree_spruce_root",
        trunk_h=9.3,
        base_r=0.39,
        spread_mult=0.84,
        droop_mult=1.18,
        lean_vec=(-0.14, 0.08),
        seed_offset=2.4,
        mat_bark=mat_bark,
        mat_needle=mat_needle,
        col=bpy.context.scene.collection
    )
    export_hierarchy_glb(v2_root, [v2_trunk, v2_needles], os.path.join(out_dir, "tree_spruce_slender.glb"))

    # Variant 3: Old-Growth Broad Meadow Spruce (tree_spruce_broad.glb)
    clear_scene()
    mat_bark, mat_needle = create_spruce_materials()
    v3_root, v3_trunk, v3_needles = build_spruce_variant(
        name_prefix="tree_spruce_root",
        trunk_h=7.9,
        base_r=0.50,
        spread_mult=1.14,
        droop_mult=0.92,
        lean_vec=(0.07, -0.11),
        seed_offset=5.1,
        mat_bark=mat_bark,
        mat_needle=mat_needle,
        col=bpy.context.scene.collection
    )
    export_hierarchy_glb(v3_root, [v3_trunk, v3_needles], os.path.join(out_dir, "tree_spruce_broad.glb"))


if __name__ == "__main__":
    build_spruce()
