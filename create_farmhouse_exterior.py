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

def get_or_create_material(name, base_color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = base_color
            bsdf.inputs['Roughness'].default_value = roughness
            bsdf.inputs['Metallic'].default_value = metallic
    return mat

def create_box(name, size, location, material=None, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    obj.location = location
    return obj

def build_farmhouse_exterior():
    clear_scene()

    # Materials Palette - Stylized Alpine Farmhouse
    mat_stone = get_or_create_material("Stone_Foundation", (0.36, 0.34, 0.32, 1.0), roughness=0.92)
    mat_stone_trim = get_or_create_material("Stone_Trim", (0.44, 0.42, 0.39, 1.0), roughness=0.88)
    mat_stucco = get_or_create_material("Plaster_Stucco", (0.90, 0.87, 0.81, 1.0), roughness=0.85)
    mat_timber = get_or_create_material("Dark_Timber", (0.24, 0.14, 0.08, 1.0), roughness=0.75)
    mat_shingles = get_or_create_material("Cedar_Shingles", (0.38, 0.22, 0.14, 1.0), roughness=0.80)
    mat_shingle_trim = get_or_create_material("Cedar_Shingle_Trim", (0.32, 0.18, 0.11, 1.0), roughness=0.78)
    mat_planks = get_or_create_material("Wood_Planks", (0.48, 0.32, 0.20, 1.0), roughness=0.70)
    mat_glass = get_or_create_material("Glass_Window", (0.45, 0.65, 0.75, 1.0), roughness=0.15, metallic=0.1)
    mat_glass_warm = get_or_create_material("Glass_Lantern_Warm", (0.95, 0.85, 0.45, 1.0), roughness=0.2, metallic=0.0)
    mat_iron = get_or_create_material("Iron_Metal", (0.12, 0.12, 0.14, 1.0), roughness=0.45, metallic=0.85)
    mat_leaves = get_or_create_material("Foliage_Green", (0.18, 0.44, 0.16, 1.0), roughness=0.65)
    mat_flower_red = get_or_create_material("Flower_Red", (0.85, 0.12, 0.12, 1.0), roughness=0.5)
    mat_flower_yellow = get_or_create_material("Flower_Yellow", (0.92, 0.75, 0.15, 1.0), roughness=0.5)
    mat_terracotta = get_or_create_material("Terracotta_Pot", (0.68, 0.32, 0.18, 1.0), roughness=0.82)

    root = bpy.data.objects.new("Farmhouse_Exterior_Root", None)
    bpy.context.collection.objects.link(root)

    # 1. Fieldstone Foundation Plinth (10.6 x 7.8 x 0.8m)
    f_w, f_d, f_h = 10.6, 7.8, 0.8
    create_box("Foundation_Plinth", (f_w, f_d, f_h), (0, 0, f_h/2), mat_stone, root)
    create_box("Foundation_Coping", (f_w + 0.18, f_d + 0.18, 0.12), (0, 0, f_h - 0.06), mat_stone_trim, root)

    # Foundation Corner Quoins (chiseled stone corners)
    for qx in [-f_w/2, f_w/2]:
        for qy in [-f_d/2, f_d/2]:
            create_box(f"Foundation_Quoin_{qx}_{qy}", (0.5, 0.5, f_h + 0.02), (qx, qy, f_h/2), mat_stone_trim, root)

    # 2. Main Ground Floor Walls (Stucco Body: 10.4 x 7.6 x 2.8m, above foundation)
    w_w, w_d, w_h = 10.4, 7.6, 2.8
    base_z = f_h
    create_box("Ground_Floor_Walls", (w_w, w_d, w_h), (0, 0, base_z + w_h/2), mat_stucco, root)

    # 3. Half-Timbering Framing Elements
    timber_thick = 0.16
    # Corner posts (4 corners)
    for cx in [-w_w/2, w_w/2]:
        for cy in [-w_d/2, w_d/2]:
            create_box(f"CornerPost_{cx}_{cy}", (timber_thick*1.4, timber_thick*1.4, w_h),
                       (cx, cy, base_z + w_h/2), mat_timber, root)
    
    # Horizontal sill and wall plate beams
    for cy in [-w_d/2, w_d/2]:
        create_box(f"WallBeam_Bottom_{cy}", (w_w, timber_thick, timber_thick), (0, cy, base_z + timber_thick/2), mat_timber, root)
        create_box(f"WallBeam_Top_{cy}", (w_w, timber_thick, timber_thick), (0, cy, base_z + w_h - timber_thick/2), mat_timber, root)
    for cx in [-w_w/2, w_w/2]:
        create_box(f"WallBeam_BottomSide_{cx}", (timber_thick, w_d, timber_thick), (cx, 0, base_z + timber_thick/2), mat_timber, root)
        create_box(f"WallBeam_TopSide_{cx}", (timber_thick, w_d, timber_thick), (cx, 0, base_z + w_h - timber_thick/2), mat_timber, root)

    # Intermediate vertical timber studs
    for vx in [-3.8, -1.8, 1.8, 3.8]:
        create_box(f"Stud_Front_{vx}", (timber_thick, timber_thick*0.8, w_h), (vx, w_d/2 + 0.02, base_z + w_h/2), mat_timber, root)
        create_box(f"Stud_Back_{vx}", (timber_thick, timber_thick*0.8, w_h), (vx, -w_d/2 - 0.02, base_z + w_h/2), mat_timber, root)
    for vy in [-2.4, 0.0, 2.4]:
        create_box(f"Stud_SideW_{vy}", (timber_thick*0.8, timber_thick, w_h), (-w_w/2 - 0.02, vy, base_z + w_h/2), mat_timber, root)
        create_box(f"Stud_SideE_{vy}", (timber_thick*0.8, timber_thick, w_h), (w_w/2 + 0.02, vy, base_z + w_h/2), mat_timber, root)

    # Diagonal Fachwerk Corner Braces
    brace_len = 1.4
    for bx in [-w_w/2 + 0.6, w_w/2 - 0.6]:
        for by in [-w_d/2, w_d/2]:
            b_obj = create_box(f"Brace_{bx}_{by}", (brace_len, timber_thick*0.7, timber_thick),
                               (bx, by + (0.02 if by > 0 else -0.02), base_z + w_h - 0.6), mat_timber, root)
            b_obj.rotation_euler.y = math.radians(40 if bx < 0 else -40)

    # 4. Front Porch (Veranda)
    p_w, p_d, p_h = 4.8, 2.4, 0.45
    p_center_y = w_d/2 + p_d/2
    # Porch foundation plinth
    create_box("Porch_Foundation", (p_w, p_d, f_h - 0.05), (0, p_center_y, (f_h - 0.05)/2), mat_stone, root)
    # Porch timber deck
    create_box("Porch_Deck", (p_w + 0.25, p_d + 0.15, 0.12), (0, p_center_y, f_h + 0.06), mat_planks, root)

    # Porch stairs (5 full steps reaching all the way from deck at Z=0.86 down to ground at Z=0)
    s_w = 1.8
    num_steps = 5
    step_rise = (f_h + 0.06) / num_steps # ~0.172m per step
    step_run = 0.28
    for step in range(num_steps):
        s_y = w_d/2 + p_d + (step + 1) * step_run - step_run/2
        s_z = (f_h + 0.06) - (step + 1) * step_rise + step_rise/2
        create_box(f"Porch_Step_{step+1}", (s_w, step_run + 0.02, step_rise), (0, s_y, s_z), mat_planks, root)

    # Stair Timber Stringers (side supports)
    stair_total_run = num_steps * step_run
    stair_mid_y = w_d/2 + p_d + stair_total_run/2
    stair_mid_z = (f_h + 0.06)/2
    stair_len = math.hypot(stair_total_run, f_h + 0.06)
    stair_angle = math.atan2(f_h + 0.06, stair_total_run)
    for str_x in [-s_w/2 - 0.06, s_w/2 + 0.06]:
        str_obj = create_box(f"Stair_Stringer_{str_x}", (0.1, stair_len, 0.22), (str_x, stair_mid_y, stair_mid_z), mat_timber, root)
        str_obj.rotation_euler.x = -stair_angle

    # Porch Posts (4 timber posts with chamfered appearance)
    post_h = 2.4
    for px in [-p_w/2 + 0.18, p_w/2 - 0.18]:
        for py in [w_d/2 + 0.18, w_d/2 + p_d - 0.18]:
            create_box(f"Porch_Post_{px}_{py}", (0.18, 0.18, post_h), (px, py, f_h + 0.12 + post_h/2), mat_timber, root)
            # Decorative corner bracket under beam
            if py > w_d/2 + 0.5:
                br = create_box(f"Porch_Bracket_{px}_{py}", (0.12, 0.45, 0.45), (px, py - 0.2, f_h + 0.12 + post_h - 0.2), mat_timber, root)
                br.rotation_euler.x = math.radians(45)

    # Porch Railings
    for side_x in [-p_w/2 + 0.18, p_w/2 - 0.18]:
        create_box(f"Porch_Rail_Side_{side_x}", (0.08, p_d - 0.35, 0.08), (side_x, p_center_y, f_h + 0.12 + 0.85), mat_timber, root)
        create_box(f"Porch_Bottom_Rail_Side_{side_x}", (0.08, p_d - 0.35, 0.06), (side_x, p_center_y, f_h + 0.12 + 0.12), mat_timber, root)
        # Balusters
        for b in range(6):
            by = w_d/2 + 0.35 + b * ((p_d - 0.7)/5)
            create_box(f"Baluster_{side_x}_{b}", (0.05, 0.05, 0.72), (side_x, by, f_h + 0.12 + 0.48), mat_timber, root)

    # Front rails (leaving center opening for stairs)
    for fx in [-p_w/4 - s_w/4 - 0.05, p_w/4 + s_w/4 + 0.05]:
        rail_len = (p_w - s_w)/2 - 0.2
        create_box(f"Porch_Rail_Front_{fx}", (rail_len, 0.08, 0.08), (fx, w_d/2 + p_d - 0.18, f_h + 0.12 + 0.85), mat_timber, root)
        create_box(f"Porch_Bottom_Rail_Front_{fx}", (rail_len, 0.08, 0.06), (fx, w_d/2 + p_d - 0.18, f_h + 0.12 + 0.12), mat_timber, root)
        for fb in range(3):
            fbx = fx - rail_len/2 + 0.15 + fb * ((rail_len - 0.3)/2)
            create_box(f"FrontBaluster_{fx}_{fb}", (0.05, 0.05, 0.72), (fbx, w_d/2 + p_d - 0.18, f_h + 0.12 + 0.48), mat_timber, root)

    # Porch Roof (Pitched lean-to canopy with overhang and rafter ends)
    p_roof_h = f_h + post_h + 0.18
    p_roof = create_box("Porch_Roof_Canopy", (p_w + 0.6, p_d + 0.6, 0.14),
                        (0, p_center_y + 0.15, p_roof_h), mat_shingles, root)
    p_roof.rotation_euler.x = math.radians(12)

    # Porch Roof Facia / Trim
    create_box("Porch_Roof_Facia", (p_w + 0.64, 0.08, 0.18), (0, w_d/2 + p_d + 0.45, p_roof_h - 0.16), mat_shingle_trim, root)

    # Hanging Brass Lantern on Porch (Cleanly anchored under front beam, ALL in absolute root coords!)
    lantern_beam_z = f_h + post_h + 0.06
    lantern_y = w_d/2 + p_d - 0.25
    create_box("Lantern_Hanger_Bracket", (0.06, 0.24, 0.18), (0, lantern_y, lantern_beam_z - 0.05), mat_iron, root)
    create_box("Lantern_Chain", (0.03, 0.03, 0.22), (0, lantern_y, lantern_beam_z - 0.22), mat_iron, root)
    create_box("Lantern_Cap", (0.26, 0.26, 0.08), (0, lantern_y, lantern_beam_z - 0.35), mat_iron, root)
    create_box("Porch_Lantern", (0.20, 0.20, 0.30), (0, lantern_y, lantern_beam_z - 0.52), mat_glass_warm, root)
    create_box("Lantern_Base", (0.24, 0.24, 0.06), (0, lantern_y, lantern_beam_z - 0.69), mat_iron, root)

    # 5. Front Door Recessed Frame & Hinged Door Unit
    door_w, door_h = 1.2, 2.2
    door_z = base_z
    door_y = w_d/2 + 0.04
    # Frame
    create_box("Door_Frame_Left", (0.14, 0.16, door_h), (-door_w/2 - 0.07, door_y, door_z + door_h/2), mat_timber, root)
    create_box("Door_Frame_Right", (0.14, 0.16, door_h), (door_w/2 + 0.07, door_y, door_z + door_h/2), mat_timber, root)
    create_box("Door_Frame_Top", (door_w + 0.28, 0.16, 0.14), (0, door_y, door_z + door_h + 0.07), mat_timber, root)
    create_box("Door_Threshold", (door_w + 0.14, 0.20, 0.08), (0, door_y, door_z + 0.04), mat_stone_trim, root)
    
    # Door Hinge Pivot Empty Node: positioned at left frame edge
    hinge_x = -door_w/2
    door_pivot = bpy.data.objects.new("door_pivot", None)
    door_pivot.location = (hinge_x, door_y, door_z)
    door_pivot.parent = root
    bpy.context.collection.objects.link(door_pivot)

    # Door Leaf: child of door_pivot with local X offset of +door_w/2
    # So its local pivot is at X=0 (the hinge!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    door_leaf = bpy.context.active_object
    door_leaf.name = "door_leaf"
    door_leaf.scale = (door_w - 0.04, 0.08, door_h - 0.04)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    door_leaf.data.materials.append(mat_planks)
    door_leaf.parent = door_pivot
    door_leaf.location = ((door_w - 0.04)/2, 0, (door_h - 0.04)/2)

    # Iron strap hinges (attached to door_pivot so they swing naturally)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    hinge_top = bpy.context.active_object
    hinge_top.name = "Door_Hinge_Top"
    hinge_top.scale = (0.35, 0.03, 0.06)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hinge_top.data.materials.append(mat_iron)
    hinge_top.parent = door_pivot
    hinge_top.location = (0.20, 0.05, door_h * 0.8)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    hinge_bot = bpy.context.active_object
    hinge_bot.name = "Door_Hinge_Bottom"
    hinge_bot.scale = (0.35, 0.03, 0.06)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hinge_bot.data.materials.append(mat_iron)
    hinge_bot.parent = door_pivot
    hinge_bot.location = (0.20, 0.05, door_h * 0.25)

    # Ring Door Handle & Backplate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    d_handle = bpy.context.active_object
    d_handle.name = "Door_Handle"
    d_handle.scale = (0.08, 0.07, 0.16)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    d_handle.data.materials.append(mat_iron)
    d_handle.parent = door_pivot
    d_handle.location = (door_w - 0.16, 0.05, 1.05)

    # 6. Upper Gable & Steep Pitched Alpine Roof
    ridge_h = 7.4
    gable_base_z = base_z + w_h

    # North and South triangular gable walls (using bmesh)
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

        obj = bpy.data.objects.new(g_name, mesh)
        obj.location = (0, g_y, gable_base_z)
        obj.data.materials.append(mat_timber)
        obj.parent = root
        bpy.context.collection.objects.link(obj)

        # Gable diagonal timber framing
        g_brace_len = math.hypot(w_w/4, (ridge_h - gable_base_z)/2)
        gb_ang = math.atan2(ridge_h - gable_base_z, w_w/2)
        for gbx, gsign_x in [(-w_w/4, 1), (w_w/4, -1)]:
            gb_obj = create_box(f"Gable_Brace_{g_name}_{gbx}", (g_brace_len, 0.12, 0.12),
                                (gbx, g_y + (0.03 if g_sign > 0 else -0.03), gable_base_z + (ridge_h - gable_base_z)/3), mat_timber, root)
            gb_obj.rotation_euler.y = gb_ang * gsign_x

    # Roof Slopes (East slope and West slope with layered shingles)
    roof_len = w_d + 1.4 # Overhangs on gable ends
    pitch_angle = math.atan2(ridge_h - gable_base_z, w_w/2 + 0.6)
    slope_w = math.hypot(w_w/2 + 0.7, ridge_h - gable_base_z)

    # East Roof Slope
    r_east = create_box("Roof_Slope_East", (slope_w, roof_len, 0.20),
                        ((w_w/2 + 0.35)/2, 0, (gable_base_z + ridge_h)/2 + 0.05), mat_shingles, root)
    r_east.rotation_euler.y = pitch_angle

    # West Roof Slope
    r_west = create_box("Roof_Slope_West", (slope_w, roof_len, 0.20),
                        (-(w_w/2 + 0.35)/2, 0, (gable_base_z + ridge_h)/2 + 0.05), mat_shingles, root)
    r_west.rotation_euler.y = -pitch_angle

    # Heavy timber Ridge Beam with decorative finials
    create_box("Roof_Ridge_Beam", (0.26, roof_len + 0.3, 0.30), (0, 0, ridge_h + 0.14), mat_timber, root)
    for fin_y in [-(roof_len + 0.3)/2, (roof_len + 0.3)/2]:
        create_box(f"Ridge_Finial_{fin_y}", (0.16, 0.16, 0.5), (0, fin_y, ridge_h + 0.4), mat_timber, root)

    # Bargeboards / Vergeboards on Gable Edges
    for bb_y, bb_sign in [(-w_d/2 - 0.65, -1), (w_d/2 + 0.65, 1)]:
        b_east = create_box(f"Bargeboard_E_{bb_sign}", (slope_w, 0.10, 0.24),
                            ((w_w/2 + 0.35)/2, bb_y, (gable_base_z + ridge_h)/2 + 0.08), mat_shingle_trim, root)
        b_east.rotation_euler.y = pitch_angle
        b_west = create_box(f"Bargeboard_W_{bb_sign}", (slope_w, 0.10, 0.24),
                            (-(w_w/2 + 0.35)/2, bb_y, (gable_base_z + ridge_h)/2 + 0.08), mat_shingle_trim, root)
        b_west.rotation_euler.y = -pitch_angle

    # Exposed Rafter Tails under eaves
    for e_idx in range(int(w_d) + 2):
        ry = -w_d/2 - 0.3 + e_idx * 0.8
        create_box(f"Rafter_E_{e_idx}", (0.55, 0.12, 0.12), (w_w/2 + 0.35, ry, gable_base_z - 0.06), mat_timber, root)
        create_box(f"Rafter_W_{e_idx}", (0.55, 0.12, 0.12), (-w_w/2 - 0.35, ry, gable_base_z - 0.06), mat_timber, root)

    # Dormer Window on South Roof Slope (Facing Front Yard)
    d_w, d_d, d_h = 1.6, 1.8, 1.4
    d_y = w_d/4
    d_z = gable_base_z + 0.8
    create_box("Dormer_Body", (d_w, d_d, d_h), (0, d_y, d_z), mat_stucco, root)
    create_box("Dormer_Window_Frame", (1.1, 0.12, 1.0), (0, d_y + d_d/2 + 0.02, d_z), mat_timber, root)
    create_box("Dormer_Window_Glass", (0.95, 0.06, 0.85), (0, d_y + d_d/2 + 0.03, d_z), mat_glass, root)
    # Dormer peaked roof
    d_roof = create_box("Dormer_Roof", (d_w + 0.35, d_d + 0.35, 0.14), (0, d_y, d_z + d_h/2 + 0.2), mat_shingles, root)
    d_roof.rotation_euler.y = math.radians(18)

    # 7. Ground Floor Windows with Multi-Pane Frames and Cedar Flower Boxes
    win_coords = [
        (-3.2, w_d/2 + 0.02, base_z + 1.4, 0),
        (3.2, w_d/2 + 0.02, base_z + 1.4, 0),
        (-3.2, -w_d/2 - 0.02, base_z + 1.4, math.pi),
        (3.2, -w_d/2 - 0.02, base_z + 1.4, math.pi),
        (-w_w/2 - 0.02, 1.4, base_z + 1.4, -math.pi/2),
        (w_w/2 + 0.02, 1.4, base_z + 1.4, math.pi/2)
    ]
    for idx, (wx, wy, wz, wrot) in enumerate(win_coords):
        w_obj = create_box(f"Window_Frame_{idx}", (1.4, 0.14, 1.3), (wx, wy, wz), mat_timber, root)
        w_obj.rotation_euler.z = wrot
        create_box(f"Window_Glass_{idx}", (1.2, 0.04, 1.1), (wx, wy, wz), mat_glass, root)
        # Window Mullions (cross frame)
        mullion_v = create_box(f"Mullion_V_{idx}", (0.06, 0.06, 1.1), (wx, wy, wz), mat_timber, root)
        mullion_v.rotation_euler.z = wrot
        mullion_h = create_box(f"Mullion_H_{idx}", (1.2, 0.06, 0.06), (wx, wy, wz), mat_timber, root)
        mullion_h.rotation_euler.z = wrot

        # Flower Box under window
        fbox_off_y = 0.24 if wrot == 0 else (-0.24 if wrot == math.pi else 0)
        fbox_off_x = 0.24 if wrot == math.pi/2 else (-0.24 if wrot == -math.pi/2 else 0)
        create_box(f"FlowerBox_{idx}", (1.4, 0.28, 0.26), (wx + fbox_off_x, wy + fbox_off_y, wz - 0.72), mat_planks, root)

        # Blooming flowers & greenery in box
        create_box(f"FlowerFoliage_{idx}", (1.3, 0.24, 0.16), (wx + fbox_off_x*0.9, wy + fbox_off_y*0.9, wz - 0.62), mat_leaves, root)
        for fl_idx in range(6):
            fl_x = wx + (fl_idx - 2.5) * 0.20 if (wrot == 0 or wrot == math.pi) else wx
            fl_y = wy + (fl_idx - 2.5) * 0.20 if (wrot == math.pi/2 or wrot == -math.pi/2) else wy
            fl_mat = mat_flower_red if fl_idx % 2 == 0 else mat_flower_yellow
            create_box(f"Flower_{idx}_{fl_idx}", (0.12, 0.12, 0.14),
                       (fl_x + fbox_off_x*0.9, fl_y + fbox_off_y*0.9, wz - 0.52), fl_mat, root)

    # 8. Massive Fieldstone Chimney on East Wall
    chim_w, chim_d = 1.4, 1.4
    chim_x = w_w/2 + chim_w/2 - 0.2
    chim_y = -1.2
    chim_h = ridge_h + 1.0 # Protrudes well above ridge peak
    create_box("Chimney_Plinth", (chim_w + 0.3, chim_d + 0.3, 1.2), (chim_x, chim_y, 0.6), mat_stone, root)
    create_box("Chimney_Breast", (chim_w, chim_d, chim_h - 1.2), (chim_x, chim_y, 1.2 + (chim_h - 1.2)/2), mat_stone, root)
    # Stepped shoulder
    create_box("Chimney_Shoulder", (chim_w + 0.15, chim_d + 0.15, 0.18), (chim_x, chim_y, gable_base_z + 0.5), mat_stone_trim, root)
    create_box("Chimney_Crown", (chim_w + 0.25, chim_d + 0.25, 0.22), (chim_x, chim_y, chim_h + 0.11), mat_stone_trim, root)
    create_box("Chimney_Flue_Pot", (0.55, 0.55, 0.50), (chim_x, chim_y, chim_h + 0.45), mat_terracotta, root)

    # Smoke Origin Empty Node
    smoke_empty = bpy.data.objects.new("chimney_smoke_origin", None)
    smoke_empty.location = (chim_x, chim_y, chim_h + 0.75)
    smoke_empty.parent = root
    bpy.context.collection.objects.link(smoke_empty)

    # 9. Attached Woodshed on West Wall
    shed_w, shed_d, shed_h = 3.2, 4.2, 2.3
    shed_x = -w_w/2 - shed_w/2
    shed_y = -0.5
    create_box("Woodshed_Frame", (shed_w, shed_d, shed_h), (shed_x, shed_y, shed_h/2 + f_h/2), mat_timber, root)
    create_box("Woodshed_Sill", (shed_w + 0.1, shed_d + 0.1, 0.15), (shed_x, shed_y, f_h/2 + 0.08), mat_stone, root)
    # Slanted lean-to roof
    shed_roof = create_box("Woodshed_Roof", (shed_w + 0.5, shed_d + 0.5, 0.12), (shed_x, shed_y, f_h/2 + shed_h + 0.15), mat_shingles, root)
    shed_roof.rotation_euler.y = math.radians(-14)

    # Stacked firewood logs inside shed
    for log_row in range(4):
        for log_col in range(6):
            lx = shed_x - shed_w/4 + (log_col - 2.5) * 0.24
            ly = shed_y + (log_row % 2) * 0.08
            lz = f_h/2 + 0.2 + log_row * 0.26
            create_box(f"Firewood_{log_row}_{log_col}", (0.2, 1.2, 0.2), (lx, ly, lz), mat_planks, root)

    # 10. Embedded Dedicated Collision Proxies (-col suffix)
    create_box("foundation-col", (f_w, f_d, f_h), (0, 0, f_h/2), None, root)
    # Walls with doorway gap
    wall_col_thick = 0.35
    create_box("wall_north-col", (w_w, wall_col_thick, w_h), (0, -w_d/2, base_z + w_h/2), None, root)
    create_box("wall_east-col", (wall_col_thick, w_d, w_h), (w_w/2, 0, base_z + w_h/2), None, root)
    create_box("wall_west-col", (wall_col_thick, w_d, w_h), (-w_w/2, 0, base_z + w_h/2), None, root)
    # South wall split around door (door opening: width 1.3m from x=-0.65 to 0.65)
    door_clear_w = 1.3
    left_w = (w_w - door_clear_w)/2
    create_box("wall_south_left-col", (left_w, wall_col_thick, w_h), (-w_w/2 + left_w/2, w_d/2, base_z + w_h/2), None, root)
    create_box("wall_south_right-col", (left_w, wall_col_thick, w_h), (w_w/2 - left_w/2, w_d/2, base_z + w_h/2), None, root)
    
    # Porch deck collision (extends only to front edge of porch, NOT covering the stairs)
    # Stair ascent is handled smoothly by CollisionWorld.addRamp() in Three.js
    create_box("porch_deck-col", (p_w, p_d, f_h + 0.1), (0, p_center_y, (f_h + 0.1)/2), None, root)
    create_box("chimney-col", (chim_w, chim_d, chim_h), (chim_x, chim_y, chim_h/2), None, root)
    create_box("shed-col", (shed_w, shed_d, shed_h), (shed_x, shed_y, shed_h/2 + f_h/2), None, root)

    # Ensure output directory exists
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "farmhouse_exterior.blend")
    glb_path = os.path.join(out_dir, "farmhouse_exterior.glb")

    # Save .blend
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Blend to {blend_path}")

    # Export .glb
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True
    )
    print(f"[SUCCESS] Exported GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

build_farmhouse_exterior()
