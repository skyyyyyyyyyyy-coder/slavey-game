import bpy
import bmesh
import math
import os

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in bpy.data.meshes:
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0: bpy.data.materials.remove(block)

def create_mat(name, base_color, roughness=0.7, metallic=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        if 'Alpha' in bsdf.inputs:
            bsdf.inputs['Alpha'].default_value = alpha
    return mat

def add_box(name, size, loc, mat=None, parent=None, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    obj.location = loc
    obj.rotation_euler = rot
    return obj

def add_framed_window(name, w, h, loc, rot_z, mat_glass, mat_frame, mat_sill, mat_depth, mat_foliage, mat_fl1, mat_fl2, root, shutters=False, mat_shutter=None, mat_iron=None):
    win_root = bpy.data.objects.new(name + "_Root", None)
    win_root.location = loc
    win_root.rotation_euler = (0, 0, rot_z)
    win_root.parent = root
    bpy.context.collection.objects.link(win_root)

    t_frame = 0.10
    d_frame = 0.14
    w_open = w - 2 * t_frame
    h_open = h - 2 * t_frame

    # 4 Hollow casing pieces around clear opening
    add_box(f"{name}_Frame_Top", (w, d_frame, t_frame), (0, 0.02, h/2 - t_frame/2), mat_frame, win_root)
    add_box(f"{name}_Frame_Bot", (w, d_frame, t_frame), (0, 0.02, -h/2 + t_frame/2), mat_frame, win_root)
    add_box(f"{name}_Frame_L", (t_frame, d_frame, h - 2*t_frame), (-w/2 + t_frame/2, 0.02, 0), mat_frame, win_root)
    add_box(f"{name}_Frame_R", (t_frame, d_frame, h - 2*t_frame), (w/2 - t_frame/2, 0.02, 0), mat_frame, win_root)

    # Projecting wooden sill ledge
    add_box(f"{name}_Sill", (w + 0.18, d_frame + 0.10, 0.08), (0, 0.06, -h/2 - 0.04), mat_sill, win_root)

    # Window glass pane (clear, transparent, reflective)
    add_box(f"{name}_Glass", (w_open, 0.02, h_open), (0, 0.01, 0), mat_glass, win_root)

    # Glazing bars (horizontal & vertical mullions)
    add_box(f"{name}_Mullion_H", (w_open, 0.035, 0.035), (0, 0.02, 0), mat_frame, win_root)
    add_box(f"{name}_Mullion_V1", (0.035, 0.035, h_open), (-w_open/4, 0.02, 0), mat_frame, win_root)
    add_box(f"{name}_Mullion_V2", (0.035, 0.035, h_open), (w_open/4, 0.02, 0), mat_frame, win_root)

    # Recessed dark interior backing
    add_box(f"{name}_Depth", (w_open, 0.04, h_open), (0, -0.06, 0), mat_depth, win_root)

    # Board-and-batten shutters flanking window
    if shutters and mat_shutter:
        sw = (w_open / 2) + 0.04
        sh = h - 0.04
        for side, sx, ang in [("L", -w/2 - sw/2 + 0.02, -math.radians(16)), ("R", w/2 + sw/2 - 0.02, math.radians(16))]:
            add_box(f"{name}_Shutter_{side}", (sw, 0.04, sh), (sx, 0.06, 0), mat_shutter, win_root, rot=(0, 0, ang))
            if mat_iron:
                add_box(f"{name}_ShutterHinge_T_{side}", (sw * 0.7, 0.015, 0.04), (sx, 0.085, sh * 0.35), mat_iron, win_root, rot=(0, 0, ang))
                add_box(f"{name}_ShutterHinge_B_{side}", (sw * 0.7, 0.015, 0.04), (sx, 0.085, -sh * 0.35), mat_iron, win_root, rot=(0, 0, ang))

    # Timber-bracketed flower box with foliage and flowers
    fb_w = w + 0.06
    fb_d = 0.28
    fb_h = 0.24
    fb_z = -h/2 - 0.18
    fb_y = 0.20
    add_box(f"{name}_FlowerBox", (fb_w, fb_d, fb_h), (0, fb_y, fb_z), mat_sill, win_root)
    for bx in [-fb_w/3, fb_w/3]:
        add_box(f"{name}_FBoxBracket_{bx}", (0.08, 0.18, 0.16), (bx, fb_y - 0.05, fb_z - 0.18), mat_frame, win_root)
    add_box(f"{name}_FBoxFoliage", (fb_w - 0.08, fb_d - 0.06, 0.14), (0, fb_y, fb_z + fb_h/2 - 0.02), mat_foliage, win_root)
    for fl_i in range(7):
        fl_x = -fb_w/2 + 0.12 + fl_i * (fb_w - 0.24)/6
        fl_mat = mat_fl1 if fl_i % 2 == 0 else mat_fl2
        add_box(f"{name}_Bloom_{fl_i}", (0.10, 0.10, 0.12), (fl_x, fb_y, fb_z + fb_h/2 + 0.08), fl_mat, win_root)

    return win_root

def build_farmhouse_redesign():
    clear_scene()

    # Premium Stylized Alpine Materials Palette
    mat_stone_base = create_mat("Stone_Foundation", (0.32, 0.30, 0.28), 0.92)
    mat_stone_block_a = create_mat("Stone_Blocks_A", (0.42, 0.40, 0.38), 0.85)
    mat_stone_block_b = create_mat("Stone_Blocks_B", (0.36, 0.34, 0.32), 0.88)
    mat_stone_trim = create_mat("Stone_Trim", (0.48, 0.45, 0.42), 0.80)
    mat_plaster = create_mat("Lime_Plaster", (0.93, 0.90, 0.84), 0.82)
    mat_timber_dark = create_mat("Dark_Timber", (0.22, 0.13, 0.07), 0.72)
    mat_timber_warm = create_mat("Warm_Cedar_Timber", (0.38, 0.22, 0.12), 0.68)
    mat_shingle_a = create_mat("Cedar_Shingle_A", (0.45, 0.25, 0.16), 0.78)
    mat_shingle_b = create_mat("Cedar_Shingle_B", (0.38, 0.20, 0.12), 0.75)
    mat_shingle_trim = create_mat("Shingle_Trim", (0.28, 0.15, 0.09), 0.75)
    mat_planks = create_mat("Wood_Planks", (0.50, 0.32, 0.20), 0.65)
    mat_glass = create_mat("Window_Glass", (0.65, 0.82, 0.92), 0.10, 0.15, alpha=0.50)
    mat_glass_depth = create_mat("Window_Depth", (0.08, 0.07, 0.05), 0.95)
    mat_iron = create_mat("Wrought_Iron", (0.12, 0.12, 0.14), 0.40, 0.85)
    mat_copper = create_mat("Aged_Copper", (0.22, 0.45, 0.38), 0.55, 0.70)
    mat_foliage = create_mat("Foliage_Green", (0.16, 0.46, 0.18), 0.65)
    mat_flower_red = create_mat("Flower_Red", (0.86, 0.14, 0.14), 0.50)
    mat_flower_yellow = create_mat("Flower_Yellow", (0.92, 0.76, 0.14), 0.50)
    mat_lantern_glow = create_mat("Lantern_Glass_Warm", (0.98, 0.88, 0.45), 0.15)
    mat_terracotta = create_mat("Terracotta", (0.68, 0.32, 0.18), 0.82)

    root = bpy.data.objects.new("Farmhouse_Redesign_Root", None)
    bpy.context.collection.objects.link(root)

    # 1. FOUNDATION: Layered Masonry Plinth with Projecting Water-Table Coping
    f_w, f_d, f_h = 10.6, 7.8, 0.85
    add_box("Foundation_Base", (f_w, f_d, f_h), (0, 0, f_h/2), mat_stone_base, root)
    add_box("Foundation_Coping", (f_w + 0.24, f_d + 0.24, 0.14), (0, 0, f_h - 0.07), mat_stone_trim, root)
    
    # Modeled Chiseled Stone Quoins on All 4 Foundation Corners
    for qx in [-f_w/2, f_w/2]:
        for qy in [-f_d/2, f_d/2]:
            for q_idx in range(4):
                qz = 0.12 + q_idx * 0.22
                qw = 0.55 if q_idx % 2 == 0 else 0.42
                qd = 0.42 if q_idx % 2 == 0 else 0.55
                mat_q = mat_stone_block_a if q_idx % 2 == 0 else mat_stone_block_b
                add_box(f"Quoin_{qx}_{qy}_{q_idx}", (qw, qd, 0.20),
                        (qx + (0.04 if qx<0 else -0.04), qy + (0.04 if qy<0 else -0.04), qz), mat_q, root)

    # 2. MAIN GROUND WALLS (Plaster body with half-timbering)
    w_w, w_d, w_h = 10.4, 7.6, 2.9
    base_z = f_h
    add_box("Ground_Floor_Walls", (w_w, w_d, w_h), (0, 0, base_z + w_h/2), mat_plaster, root)

    # 3. HALF-TIMBERING STRUCTURE (Timber posts, sills, studs, braces)
    timber_w = 0.18
    # 4 Corner Posts
    for cx in [-w_w/2, w_w/2]:
        for cy in [-w_d/2, w_d/2]:
            add_box(f"Post_Corner_{cx}_{cy}", (timber_w*1.3, timber_w*1.3, w_h),
                    (cx, cy, base_z + w_h/2), mat_timber_dark, root)
    # Sill and Wall Plate Beams
    for cy in [-w_d/2, w_d/2]:
        add_box(f"Beam_Sill_{cy}", (w_w, timber_w, timber_w), (0, cy, base_z + timber_w/2), mat_timber_dark, root)
        add_box(f"Beam_Plate_{cy}", (w_w, timber_w, timber_w), (0, cy, base_z + w_h - timber_w/2), mat_timber_dark, root)
    for cx in [-w_w/2, w_w/2]:
        add_box(f"Beam_SillSide_{cx}", (timber_w, w_d, timber_w), (cx, 0, base_z + timber_w/2), mat_timber_dark, root)
        add_box(f"Beam_PlateSide_{cx}", (timber_w, w_d, timber_w), (cx, 0, base_z + w_h - timber_w/2), mat_timber_dark, root)
    # Intermediate Vertical Studs
    for vx in [-3.8, -1.8, 1.8, 3.8]:
        add_box(f"Stud_Front_{vx}", (timber_w, timber_w*0.8, w_h), (vx, w_d/2 + 0.01, base_z + w_h/2), mat_timber_dark, root)
        add_box(f"Stud_Back_{vx}", (timber_w, timber_w*0.8, w_h), (vx, -w_d/2 - 0.01, base_z + w_h/2), mat_timber_dark, root)
    for vy in [-2.4, 0.0, 2.4]:
        add_box(f"Stud_SideW_{vy}", (timber_w*0.8, timber_w, w_h), (-w_w/2 - 0.01, vy, base_z + w_h/2), mat_timber_dark, root)
        add_box(f"Stud_SideE_{vy}", (timber_w*0.8, timber_w, w_h), (w_w/2 + 0.01, vy, base_z + w_h/2), mat_timber_dark, root)
    # Diagonal Fachwerk Braces
    for bx, b_sign in [(-w_w/2 + 0.6, 1), (w_w/2 - 0.6, -1)]:
        for by in [-w_d/2, w_d/2]:
            add_box(f"Fachwerk_Brace_{bx}_{by}", (1.4, timber_w*0.8, timber_w*0.8),
                    (bx, by + (0.01 if by>0 else -0.01), base_z + w_h - 0.6), mat_timber_dark, root,
                    rot=(0, math.radians(-45 * b_sign), 0))

    # 4. FRONT PORCH & VERANDA (Deep, welcoming alpine entrance)
    p_w, p_d = 5.2, 2.6
    p_center_y = w_d/2 + p_d/2 # 3.8 + 1.3 = 5.1
    # Porch Foundation
    add_box("Porch_Foundation", (p_w, p_d, f_h - 0.05), (0, p_center_y, (f_h - 0.05)/2), mat_stone_base, root)
    # Porch Timber Deck with bullnose plank edging
    add_box("Porch_Deck", (p_w + 0.3, p_d + 0.18, 0.12), (0, p_center_y, f_h + 0.06), mat_planks, root)

    # 5 Wide Timber & Stone Steps with Stringers
    num_steps = 5
    step_rise = (f_h + 0.06) / num_steps
    step_run = 0.28
    s_w = 2.0
    for s in range(num_steps):
        sy = w_d/2 + p_d + (s + 1) * step_run - step_run/2
        sz = (f_h + 0.06) - (s + 1) * step_rise + step_rise/2
        add_box(f"Step_Tread_{s+1}", (s_w, step_run + 0.03, step_rise), (0, sy, sz), mat_planks, root)
        add_box(f"Step_Nosing_{s+1}", (s_w + 0.04, 0.05, 0.04), (0, sy + step_run/2 + 0.02, sz + step_rise/2 - 0.02), mat_timber_warm, root)
    stair_run_tot = num_steps * step_run
    stair_ang = math.atan2(f_h + 0.06, stair_run_tot)
    stair_len = math.hypot(stair_run_tot, f_h + 0.06)
    for str_x in [-s_w/2 - 0.06, s_w/2 + 0.06]:
        add_box(f"Stair_Stringer_{str_x}", (0.12, stair_len, 0.22),
                (str_x, w_d/2 + p_d + stair_run_tot/2, (f_h + 0.06)/2), mat_timber_dark, root, rot=(-stair_ang, 0, 0))

    # Porch Chamfered Posts & Decorative Arched Corbels
    post_h = 2.45
    post_t = 0.20
    front_post_y = w_d/2 + p_d - 0.18
    back_post_y = w_d/2 + post_t/2
    header_z = f_h + 0.12 + post_h - post_t/2
    for px in [-p_w/2 + 0.22, p_w/2 - 0.22]:
        add_box(f"Post_Front_{px}", (post_t, post_t, post_h), (px, front_post_y, f_h + 0.12 + post_h/2), mat_timber_dark, root)
        add_box(f"Post_Back_{px}", (post_t, post_t, post_h), (px, back_post_y, f_h + 0.12 + post_h/2), mat_timber_dark, root)
        add_box(f"Corbel_Front_{px}", (0.12, 0.42, 0.14), (px, front_post_y - 0.20, header_z - 0.18), mat_timber_warm, root, rot=(math.radians(45), 0, 0))
        add_box(f"Corbel_Back_{px}", (0.12, 0.42, 0.14), (px, back_post_y + 0.20, header_z - 0.18), mat_timber_warm, root, rot=(math.radians(-45), 0, 0))

    # Porch Heavy Architrave Header Beams
    add_box("Header_Front", (p_w - 0.2, post_t, post_t), (0, front_post_y, header_z), mat_timber_dark, root)
    for px in [-p_w/2 + 0.22, p_w/2 - 0.22]:
        add_box(f"Header_Side_{px}", (post_t, front_post_y - back_post_y, post_t),
                (px, (front_post_y + back_post_y)/2, header_z), mat_timber_dark, root)

    # Porch Roof Canopy & Gutter
    p_roof_pitch = -math.atan2(0.42, p_d + 0.45)
    p_roof_y = p_center_y + 0.18
    p_roof_z = header_z + 0.22
    add_box("Porch_Roof_Canopy", (p_w + 0.7, p_d + 0.6, 0.12), (0, p_roof_y, p_roof_z), mat_shingle_a, root, rot=(p_roof_pitch, 0, 0))
    add_box("Porch_Facia", (p_w + 0.74, 0.08, 0.16), (0, w_d/2 + p_d + 0.42, p_roof_z - 0.20), mat_shingle_trim, root, rot=(p_roof_pitch, 0, 0))
    add_box("Porch_Gutter", (p_w + 0.76, 0.10, 0.10), (0, w_d/2 + p_d + 0.48, p_roof_z - 0.22), mat_copper, root, rot=(p_roof_pitch, 0, 0))

    # Porch Hanging Lantern
    add_box("Lantern_Hanger", (0.06, 0.22, 0.14), (0, front_post_y, header_z - 0.14), mat_iron, root)
    add_box("Lantern_Chain", (0.03, 0.03, 0.20), (0, front_post_y, header_z - 0.28), mat_iron, root)
    add_box("Lantern_Cap", (0.24, 0.24, 0.08), (0, front_post_y, header_z - 0.38), mat_iron, root)
    add_box("Porch_Lantern", (0.18, 0.18, 0.26), (0, front_post_y, header_z - 0.53), mat_lantern_glow, root)
    add_box("Lantern_Base", (0.22, 0.22, 0.06), (0, front_post_y, header_z - 0.68), mat_iron, root)

    # Porch Turned Railings & Balusters
    for side_x in [-p_w/2 + 0.22, p_w/2 - 0.22]:
        add_box(f"Rail_Top_Side_{side_x}", (0.08, p_d - 0.35, 0.08), (side_x, p_center_y, f_h + 0.12 + 0.88), mat_timber_warm, root)
        add_box(f"Rail_Bot_Side_{side_x}", (0.08, p_d - 0.35, 0.06), (side_x, p_center_y, f_h + 0.12 + 0.12), mat_timber_warm, root)
        for b in range(6):
            by = w_d/2 + 0.35 + b * ((p_d - 0.7)/5)
            add_box(f"Baluster_Side_{side_x}_{b}", (0.05, 0.05, 0.74), (side_x, by, f_h + 0.12 + 0.50), mat_timber_dark, root)
    for fx in [-p_w/4 - s_w/4 - 0.05, p_w/4 + s_w/4 + 0.05]:
        rlen = (p_w - s_w)/2 - 0.2
        add_box(f"Rail_Top_Front_{fx}", (rlen, 0.08, 0.08), (fx, front_post_y, f_h + 0.12 + 0.88), mat_timber_warm, root)
        add_box(f"Rail_Bot_Front_{fx}", (rlen, 0.08, 0.06), (fx, front_post_y, f_h + 0.12 + 0.12), mat_timber_warm, root)
        for fb in range(3):
            fbx = fx - rlen/2 + 0.15 + fb * ((rlen - 0.3)/2)
            add_box(f"Baluster_Front_{fx}_{fb}", (0.05, 0.05, 0.74), (fbx, front_post_y, f_h + 0.12 + 0.50), mat_timber_dark, root)

    # 5. FRONT ENTRANCE DOOR & HARDWARE (Exact bindings for gameplay & test-door.mjs)
    door_w, door_h = 1.2, 2.25
    door_y = w_d/2 + 0.04
    door_z = base_z
    add_box("Door_Frame_L", (0.14, 0.18, door_h), (-door_w/2 - 0.07, door_y, door_z + door_h/2), mat_timber_dark, root)
    add_box("Door_Frame_R", (0.14, 0.18, door_h), (door_w/2 + 0.07, door_y, door_z + door_h/2), mat_timber_dark, root)
    add_box("Door_Frame_T", (door_w + 0.28, 0.18, 0.16), (0, door_y, door_z + door_h + 0.08), mat_timber_dark, root)
    add_box("Door_Threshold", (door_w + 0.16, 0.24, 0.08), (0, door_y, door_z + 0.04), mat_stone_trim, root)
    
    door_pivot = bpy.data.objects.new("door_pivot", None)
    door_pivot.location = (-door_w/2, door_y, door_z)
    door_pivot.parent = root
    bpy.context.collection.objects.link(door_pivot)

    # Door leaf
    add_box("door_leaf", (door_w - 0.04, 0.08, door_h - 0.04),
            ((door_w - 0.04)/2, 0, (door_h - 0.04)/2), mat_planks, door_pivot)
    # Vertical panel battens on door
    for b_i in range(3):
        b_x = 0.22 + b_i * 0.35
        add_box(f"Door_Batten_{b_i}", (0.06, 0.02, door_h - 0.2), (b_x, 0.045, (door_h - 0.04)/2), mat_timber_warm, door_pivot)
    # Door iron hardware matching test-door.mjs exact names!
    add_box("Door_Hinge_Top", (0.35, 0.03, 0.07), (0.20, 0.05, door_h * 0.8), mat_iron, door_pivot)
    add_box("Door_Hinge_Bot", (0.35, 0.03, 0.07), (0.20, 0.05, door_h * 0.25), mat_iron, door_pivot)
    add_box("Door_Handle", (0.08, 0.07, 0.16), (door_w - 0.16, 0.05, 1.05), mat_iron, door_pivot)

    # Warm Entrance Wall Sconce Lantern mounted beside door
    sconce_x = door_w/2 + 0.35
    sconce_y = door_y + 0.08
    sconce_z = door_z + 1.65
    add_box("Sconce_Backplate", (0.12, 0.04, 0.22), (sconce_x, sconce_y, sconce_z), mat_iron, root)
    add_box("Sconce_Arm", (0.04, 0.22, 0.04), (sconce_x, sconce_y + 0.11, sconce_z + 0.08), mat_iron, root)
    add_box("Sconce_Cap", (0.18, 0.18, 0.06), (sconce_x, sconce_y + 0.20, sconce_z + 0.10), mat_iron, root)
    add_box("Sconce_Lantern_Glass", (0.14, 0.14, 0.20), (sconce_x, sconce_y + 0.20, sconce_z - 0.02), mat_lantern_glow, root)
    add_box("Sconce_Base", (0.16, 0.16, 0.04), (sconce_x, sconce_y + 0.20, sconce_z - 0.14), mat_iron, root)

    # 6. UPPER GABLE: Handcrafted Alpine Storybook Balcony & Loft Windows
    ridge_h = 7.6
    gable_base_z = base_z + w_h # 3.75m
    pitch_angle = math.atan2(ridge_h - gable_base_z, w_w/2 + 0.7)
    roof_len = w_d + 1.8 # 9.4m length for deep gable roof overhang

    # South Gable Wall with Vertical Timber Tongue-and-Groove Cladding
    for g_name, g_y, g_sign in [("Gable_South", w_d/2, 1), ("Gable_North", -w_d/2, -1)]:
        bm = bmesh.new()
        v1 = bm.verts.new((-w_w/2, 0, 0))
        v2 = bm.verts.new((w_w/2, 0, 0))
        v3 = bm.verts.new((0, 0, ridge_h - gable_base_z))
        bm.faces.new((v1, v2, v3) if g_sign > 0 else (v3, v2, v1))
        bm.normal_update()
        mesh = bpy.data.meshes.new(g_name)
        bm.to_mesh(mesh)
        bm.free()
        g_obj = bpy.data.objects.new(g_name, mesh)
        g_obj.location = (0, g_y, gable_base_z)
        g_obj.data.materials.append(mat_timber_warm)
        g_obj.parent = root
        bpy.context.collection.objects.link(g_obj)

    # South Gable: Ornate Alpine Timber Framing (Decorative Sunburst / Scissor Truss)
    for sx, ss in [(-2.6, 1), (2.6, -1)]:
        add_box(f"Gable_Strut_{sx}", (2.8, 0.14, 0.14),
                (sx, w_d/2 + 0.04, gable_base_z + 1.2), mat_timber_dark, root, rot=(0, pitch_angle * ss, 0))
    add_box("Gable_Col_Center", (0.16, 0.16, ridge_h - gable_base_z - 0.6),
            (0, w_d/2 + 0.04, gable_base_z + (ridge_h - gable_base_z)/2), mat_timber_dark, root)

    # UPPER ATTIC LOFT BALCONY on South Gable
    balc_w, balc_d = 4.2, 1.2
    balc_y = w_d/2 + balc_d/2 # 3.8 + 0.6 = 4.4
    balc_z = gable_base_z + 0.10
    # Balcony cantilevered timber beams
    for bx in [-balc_w/2 + 0.2, 0, balc_w/2 - 0.2]:
        add_box(f"Balcony_Beam_{bx}", (0.18, balc_d + 0.3, 0.22), (bx, balc_y - 0.1, balc_z - 0.11), mat_timber_dark, root)
        # Angled decorative wall brackets under balcony
        add_box(f"Balcony_Bracket_{bx}", (0.14, 0.7, 0.14), (bx, w_d/2 + 0.35, balc_z - 0.45), mat_timber_warm, root, rot=(-math.radians(45), 0, 0))
    # Balcony plank floor
    add_box("Balcony_Floor", (balc_w, balc_d, 0.08), (0, balc_y, balc_z), mat_planks, root)
    # Balcony handrail & carved balustrade
    balc_rail_h = 0.88
    add_box("Balcony_Rail_Front", (balc_w, 0.08, 0.08), (0, w_d/2 + balc_d, balc_z + balc_rail_h), mat_timber_warm, root)
    add_box("Balcony_Rail_Front_Bot", (balc_w, 0.08, 0.06), (0, w_d/2 + balc_d, balc_z + 0.08), mat_timber_warm, root)
    for bbx in range(9):
        bb_pos = -balc_w/2 + 0.25 + bbx * (balc_w - 0.5)/8
        add_box(f"Balcony_Baluster_{bbx}", (0.05, 0.05, 0.72), (bb_pos, w_d/2 + balc_d, balc_z + 0.48), mat_timber_dark, root)
    # Balcony Side rails
    for bsx in [-balc_w/2, balc_w/2]:
        add_box(f"Balcony_Side_Rail_{bsx}", (0.08, balc_d, 0.08), (bsx, balc_y, balc_z + balc_rail_h), mat_timber_warm, root)
        add_box(f"Balcony_Side_Rail_Bot_{bsx}", (0.08, balc_d, 0.06), (bsx, balc_y, balc_z + 0.08), mat_timber_warm, root)
        for bsb in range(3):
            bsb_y = w_d/2 + 0.25 + bsb * (balc_d - 0.4)/2
            add_box(f"Balcony_Side_Baluster_{bsx}_{bsb}", (0.05, 0.05, 0.72), (bsx, bsb_y, balc_z + 0.48), mat_timber_dark, root)
    # Long flower box along attic balcony front
    add_box("Balcony_FlowerBox", (balc_w - 0.4, 0.24, 0.22), (0, w_d/2 + balc_d + 0.12, balc_z + balc_rail_h - 0.15), mat_planks, root)
    add_box("Balcony_FlowerFoliage", (balc_w - 0.5, 0.20, 0.14), (0, w_d/2 + balc_d + 0.12, balc_z + balc_rail_h - 0.06), mat_foliage, root)
    for bfl in range(12):
        bfl_x = -balc_w/2 + 0.4 + bfl * (balc_w - 0.8)/11
        mat_bfl = mat_flower_red if bfl % 2 == 0 else mat_flower_yellow
        add_box(f"Balcony_Bloom_{bfl}", (0.10, 0.10, 0.12), (bfl_x, w_d/2 + balc_d + 0.12, balc_z + balc_rail_h + 0.04), mat_bfl, root)

    # Double-Casement Attic Windows on South Gable Wall (with open casing & real glass)
    for awx in [-0.9, 0.9]:
        add_framed_window(f"Attic_Win_{awx}", 1.0, 1.2, (awx, w_d/2 + 0.02, gable_base_z + 1.25), 0,
                          mat_glass, mat_timber_dark, mat_timber_warm, mat_glass_depth,
                          mat_foliage, mat_flower_red, mat_flower_yellow, root, shutters=False)

    # 7. ROOF SLOPES WITH MODELED CEDAR SHAKE COURSES
    slope_w = math.hypot(w_w/2 + 0.8, ridge_h - gable_base_z)
    # Base roof slopes
    add_box("Roof_Slope_East", (slope_w, roof_len, 0.14),
            ((w_w/2 + 0.4)/2, 0, (gable_base_z + ridge_h)/2 + 0.05), mat_shingle_a, root, rot=(0, pitch_angle, 0))
    add_box("Roof_Slope_West", (slope_w, roof_len, 0.14),
            (-(w_w/2 + 0.4)/2, 0, (gable_base_z + ridge_h)/2 + 0.05), mat_shingle_a, root, rot=(0, -pitch_angle, 0))

    # Stepped cedar shake courses on both roof slopes
    for c_idx in range(6):
        c_frac = (c_idx + 0.5) / 6.0
        cx = (w_w/2 + 0.6) * (1.0 - c_frac * 0.95)
        cz = gable_base_z + (ridge_h - gable_base_z) * c_frac
        mat_c = mat_shingle_a if c_idx % 2 == 0 else mat_shingle_b
        add_box(f"Shingle_Row_E_{c_idx}", (0.28, roof_len + 0.04, 0.05),
                (cx, 0, cz + 0.12), mat_c, root, rot=(0, pitch_angle, 0))
        add_box(f"Shingle_Row_W_{c_idx}", (0.28, roof_len + 0.04, 0.05),
                (-cx, 0, cz + 0.12), mat_c, root, rot=(0, -pitch_angle, 0))

    # Heavy Timber Ridge Beam with Carved Alpine Finials
    add_box("Ridge_Beam", (0.28, roof_len + 0.35, 0.32), (0, 0, ridge_h + 0.16), mat_timber_dark, root)
    for fin_y in [-(roof_len + 0.35)/2, (roof_len + 0.35)/2]:
        add_box(f"Ridge_Finial_{fin_y}", (0.18, 0.18, 0.55), (0, fin_y, ridge_h + 0.45), mat_timber_warm, root)

    # Ornate Carved Vergeboards / Bargeboards on Gable Edges
    for bb_y, bb_sign in [(-w_d/2 - 0.85, -1), (w_d/2 + 0.85, 1)]:
        add_box(f"Vergeboard_E_{bb_sign}", (slope_w + 0.15, 0.12, 0.30),
                ((w_w/2 + 0.4)/2, bb_y, (gable_base_z + ridge_h)/2 + 0.12), mat_shingle_trim, root, rot=(0, pitch_angle, 0))
        add_box(f"Vergeboard_W_{bb_sign}", (slope_w + 0.15, 0.12, 0.30),
                (-(w_w/2 + 0.4)/2, bb_y, (gable_base_z + ridge_h)/2 + 0.12), mat_shingle_trim, root, rot=(0, -pitch_angle, 0))
        add_box(f"Gable_Drop_{bb_sign}", (0.16, 0.14, 0.50), (0, bb_y, ridge_h - 0.22), mat_timber_warm, root)

    # Exposed Rafter Tails under eaves
    for e_idx in range(int(w_d) + 3):
        ry = -w_d/2 - 0.4 + e_idx * 0.75
        add_box(f"Rafter_E_{e_idx}", (1.10, 0.12, 0.12), (w_w/2 + 0.25, ry, gable_base_z + 0.10), mat_timber_dark, root, rot=(0, pitch_angle, 0))
        add_box(f"Rafter_W_{e_idx}", (1.10, 0.12, 0.12), (-w_w/2 - 0.25, ry, gable_base_z + 0.10), mat_timber_dark, root, rot=(0, -pitch_angle, 0))

    # Copper Gutters & Downspouts
    add_box("Gutter_East", (0.12, roof_len + 0.1, 0.12), (w_w/2 + 0.78, 0, gable_base_z - 0.05), mat_copper, root)
    add_box("Gutter_West", (0.12, roof_len + 0.1, 0.12), (-w_w/2 - 0.78, 0, gable_base_z - 0.05), mat_copper, root)
    add_box("Downspout_E_Front", (0.08, 0.08, gable_base_z), (w_w/2 + 0.75, w_d/2 + 0.4, gable_base_z/2), mat_copper, root)
    add_box("Downspout_W_Front", (0.08, 0.08, gable_base_z), (-w_w/2 - 0.75, w_d/2 + 0.4, gable_base_z/2), mat_copper, root)

    # 8. GROUND FLOOR WINDOWS (With Open Casing, Glass, Glazing Bars, Shutters, Sills, Flower Boxes)
    win_specs = [
        ("Front_L", -3.2, w_d/2 + 0.02, base_z + 1.45, 0, True),
        ("Front_R", 3.2, w_d/2 + 0.02, base_z + 1.45, 0, True),
        ("Back_L", -3.2, -w_d/2 - 0.02, base_z + 1.45, math.pi, True),
        ("Back_R", 3.2, -w_d/2 - 0.02, base_z + 1.45, math.pi, True),
        ("Side_W", -w_w/2 - 0.02, 1.4, base_z + 1.45, -math.pi/2, False),
        ("Side_E", w_w/2 + 0.02, 1.4, base_z + 1.45, math.pi/2, False)
    ]
    for w_name, wx, wy, wz, wrot, wshutters in win_specs:
        add_framed_window(f"Win_{w_name}", 1.40, 1.30, (wx, wy, wz), wrot,
                          mat_glass, mat_timber_dark, mat_timber_warm, mat_glass_depth,
                          mat_foliage, mat_flower_red, mat_flower_yellow, root,
                          shutters=wshutters, mat_shutter=mat_timber_warm, mat_iron=mat_iron)

    # 9. TAPERED FIELDSTONE CHIMNEY on East Wall (with modeled relief stones)
    chim_w, chim_d = 1.6, 1.6
    chim_x = w_w/2 + chim_w/2 - 0.22
    chim_y = -1.2
    chim_h = ridge_h + 1.2
    add_box("Chimney_Plinth", (chim_w + 0.35, chim_d + 0.35, 1.2), (chim_x, chim_y, 0.6), mat_stone_base, root)
    add_box("Chimney_Breast_Lower", (chim_w, chim_d, gable_base_z - 0.4), (chim_x, chim_y, 0.6 + (gable_base_z - 0.4)/2), mat_stone_block_a, root)
    add_box("Chimney_Shoulder", (chim_w + 0.20, chim_d + 0.20, 0.22), (chim_x, chim_y, gable_base_z + 0.5), mat_stone_trim, root)
    add_box("Chimney_Flue_Stack", (chim_w - 0.2, chim_d - 0.2, chim_h - gable_base_z - 0.5),
            (chim_x, chim_y, gable_base_z + 0.6 + (chim_h - gable_base_z - 0.6)/2), mat_stone_block_b, root)
    add_box("Chimney_Crown", (chim_w + 0.15, chim_d + 0.15, 0.25), (chim_x, chim_y, chim_h + 0.12), mat_stone_trim, root)
    add_box("Chimney_Flue_Pot", (0.58, 0.58, 0.55), (chim_x, chim_y, chim_h + 0.48), mat_terracotta, root)

    # Handcrafted relief fieldstones protruding on chimney faces
    relief_stones = [
        (0.65, 0.4, 1.2, 0.42, 0.25, 0.28, mat_stone_block_b),
        (0.65, -0.3, 1.8, 0.38, 0.28, 0.24, mat_stone_trim),
        (0.65, 0.2, 2.4, 0.45, 0.22, 0.26, mat_stone_block_a),
        (0.65, -0.4, 3.0, 0.35, 0.26, 0.25, mat_stone_block_b),
        (-0.2, 0.70, 1.5, 0.28, 0.40, 0.24, mat_stone_block_a),
        (0.3, 0.70, 2.2, 0.32, 0.38, 0.26, mat_stone_trim),
        (-0.1, -0.70, 1.6, 0.30, 0.42, 0.25, mat_stone_block_b),
        (0.2, -0.70, 2.6, 0.34, 0.38, 0.24, mat_stone_block_a),
        (0.55, 0.2, 4.8, 0.36, 0.24, 0.24, mat_stone_trim),
        (0.55, -0.2, 5.8, 0.32, 0.26, 0.22, mat_stone_block_a),
        (0.55, 0.1, 6.8, 0.38, 0.22, 0.24, mat_stone_block_b),
        (-0.1, 0.60, 5.2, 0.26, 0.36, 0.24, mat_stone_block_a),
        (0.1, -0.60, 6.2, 0.28, 0.34, 0.22, mat_stone_trim)
    ]
    for r_i, (rdx, rdy, rz, rw, rd, rh, rmat) in enumerate(relief_stones):
        add_box(f"Chimney_ReliefStone_{r_i}", (rw, rd, rh), (chim_x + rdx, chim_y + rdy, rz), rmat, root)

    smoke_empty = bpy.data.objects.new("chimney_smoke_origin", None)
    smoke_empty.location = (chim_x, chim_y, chim_h + 0.8)
    smoke_empty.parent = root
    bpy.context.collection.objects.link(smoke_empty)

    # 10. ATTACHED RUSTIC WOODSHED on West Wall
    shed_w, shed_d, shed_h = 3.2, 4.4, 2.35
    shed_x = -w_w/2 - shed_w/2
    shed_y = -0.5
    add_box("Woodshed_Sill", (shed_w + 0.12, shed_d + 0.12, 0.18), (shed_x, shed_y, f_h/2 + 0.09), mat_stone_base, root)
    for spx in [shed_x - shed_w/2 + 0.12, shed_x + shed_w/2 - 0.12]:
        for spy in [shed_y - shed_d/2 + 0.12, shed_y + shed_d/2 - 0.12]:
            add_box(f"Woodshed_Post_{spx}_{spy}", (0.16, 0.16, shed_h),
                    (spx, spy, f_h/2 + 0.18 + shed_h/2), mat_timber_dark, root)
    add_box("Woodshed_TopPlate_Outer", (0.16, shed_d, 0.16), (shed_x - shed_w/2 + 0.12, shed_y, f_h/2 + 0.18 + shed_h - 0.08), mat_timber_dark, root)
    add_box("Woodshed_TopPlate_Front", (shed_w, 0.16, 0.16), (shed_x, shed_y + shed_d/2 - 0.12, f_h/2 + 0.18 + shed_h - 0.08), mat_timber_dark, root)
    add_box("Woodshed_TopPlate_Back", (shed_w, 0.16, 0.16), (shed_x, shed_y - shed_d/2 + 0.12, f_h/2 + 0.18 + shed_h - 0.08), mat_timber_dark, root)
    add_box("Woodshed_Roof", (shed_w + 0.55, shed_d + 0.55, 0.12), (shed_x, shed_y, f_h/2 + shed_h + 0.18), mat_shingle_a, root, rot=(0, math.radians(-14), 0))
    for sl in range(6):
        slz = f_h/2 + 0.38 + sl * (shed_h - 0.5)/5
        add_box(f"Woodshed_Slat_{sl}", (0.06, shed_d - 0.25, 0.18), (shed_x - shed_w/2 + 0.08, shed_y, slz), mat_planks, root)
    for lr in range(4):
        for lc in range(6):
            lx = shed_x - shed_w/4 + (lc - 2.5) * 0.24
            ly = shed_y + (lr % 2) * 0.08
            lz = f_h/2 + 0.22 + lr * 0.26
            add_box(f"Firewood_Log_{lr}_{lc}", (0.20, 1.2, 0.20), (lx, ly, lz), mat_planks, root)

    # 11. Preserved Collision Proxies (-col)
    wall_col_thick = 0.35
    door_clear_w = 1.3
    left_w = (w_w - door_clear_w)/2
    col_objs = [
        add_box("foundation-col", (f_w, f_d, f_h), (0, 0, f_h/2), None, root),
        add_box("wall_north-col", (w_w, wall_col_thick, w_h), (0, -w_d/2, base_z + w_h/2), None, root),
        add_box("wall_east-col", (wall_col_thick, w_d, w_h), (w_w/2, 0, base_z + w_h/2), None, root),
        add_box("wall_west-col", (wall_col_thick, w_d, w_h), (-w_w/2, 0, base_z + w_h/2), None, root),
        add_box("wall_south_left-col", (left_w, wall_col_thick, w_h), (-w_w/2 + left_w/2, w_d/2, base_z + w_h/2), None, root),
        add_box("wall_south_right-col", (left_w, wall_col_thick, w_h), (w_w/2 - left_w/2, w_d/2, base_z + w_h/2), None, root),
        add_box("porch_deck-col", (p_w, p_d, f_h + 0.1), (0, p_center_y, (f_h + 0.1)/2), None, root),
        add_box("chimney-col", (chim_w, chim_d, chim_h), (chim_x, chim_y, chim_h/2), None, root),
        add_box("shed-col", (shed_w, shed_d, shed_h), (shed_x, shed_y, shed_h/2 + f_h/2), None, root)
    ]
    for c in col_objs:
        c.hide_viewport = True
        c.hide_render = True

    out_blend = r"d:\Projects from me\slavey game\public\models\farmhouse_redesign_preview.blend"
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"[SUCCESS] Farmhouse Redesign Preview saved to {out_blend}")

build_farmhouse_redesign()
