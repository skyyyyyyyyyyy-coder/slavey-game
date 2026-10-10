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
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj

def build_farmhouse_exterior():
    clear_scene()

    # Materials Palette
    mat_stone = get_or_create_material("Stone_Foundation", (0.35, 0.33, 0.31, 1.0), roughness=0.92)
    mat_stucco = get_or_create_material("Plaster_Stucco", (0.88, 0.85, 0.78, 1.0), roughness=0.85)
    mat_timber = get_or_create_material("Dark_Timber", (0.24, 0.14, 0.08, 1.0), roughness=0.75)
    mat_shingles = get_or_create_material("Cedar_Shingles", (0.38, 0.22, 0.14, 1.0), roughness=0.80)
    mat_planks = get_or_create_material("Wood_Planks", (0.48, 0.32, 0.20, 1.0), roughness=0.70)
    mat_glass = get_or_create_material("Glass_Window", (0.45, 0.65, 0.75, 1.0), roughness=0.15, metallic=0.1)
    mat_iron = get_or_create_material("Iron_Metal", (0.12, 0.12, 0.14, 1.0), roughness=0.45, metallic=0.85)
    mat_leaves = get_or_create_material("Foliage_Green", (0.18, 0.42, 0.15, 1.0), roughness=0.65)
    mat_flower_red = get_or_create_material("Flower_Red", (0.85, 0.12, 0.12, 1.0), roughness=0.5)
    mat_flower_yellow = get_or_create_material("Flower_Yellow", (0.92, 0.75, 0.15, 1.0), roughness=0.5)

    root = bpy.data.objects.new("Farmhouse_Exterior_Root", None)
    bpy.context.collection.objects.link(root)

    # 1. Fieldstone Foundation Plinth (10.6 x 7.8 x 0.8m)
    f_w, f_d, f_h = 10.6, 7.8, 0.8
    create_box("Foundation_Plinth", (f_w, f_d, f_h), (0, 0, f_h/2), mat_stone, root)
    
    # Foundation stone trim / coping lip
    create_box("Foundation_Coping", (f_w + 0.15, f_d + 0.15, 0.12), (0, 0, f_h - 0.06), mat_stone, root)

    # 2. Main Ground Floor Walls (Stucco Body: 10.4 x 7.6 x 2.8m, above foundation)
    w_w, w_d, w_h = 10.4, 7.6, 2.8
    base_y = f_h
    create_box("Ground_Floor_Walls", (w_w, w_d, w_h), (0, 0, base_y + w_h/2), mat_stucco, root)

    # 3. Half-Timbering Framing Elements
    timber_thick = 0.14
    # Corner posts (4 corners)
    for cx in [-w_w/2, w_w/2]:
        for cz in [-w_d/2, w_d/2]:
            create_box(f"CornerPost_{cx}_{cz}", (timber_thick*1.4, timber_thick*1.4, w_h),
                       (cx, cz, base_y + w_h/2), mat_timber, root)
    
    # Horizontal sill and wall plate beams
    for cz in [-w_d/2, w_d/2]:
        create_box(f"WallBeam_Bottom_{cz}", (w_w, timber_thick, timber_thick), (0, cz, base_y + timber_thick/2), mat_timber, root)
        create_box(f"WallBeam_Top_{cz}", (w_w, timber_thick, timber_thick), (0, cz, base_y + w_h - timber_thick/2), mat_timber, root)
    for cx in [-w_w/2, w_w/2]:
        create_box(f"WallBeam_BottomSide_{cx}", (timber_thick, w_d, timber_thick), (cx, 0, base_y + timber_thick/2), mat_timber, root)
        create_box(f"WallBeam_TopSide_{cx}", (timber_thick, w_d, timber_thick), (cx, 0, base_y + w_h - timber_thick/2), mat_timber, root)

    # Intermediate vertical timber studs
    for vx in [-3.8, -1.8, 1.8, 3.8]:
        create_box(f"Stud_Front_{vx}", (timber_thick, timber_thick*0.8, w_h), (vx, w_d/2 + 0.02, base_y + w_h/2), mat_timber, root)
        create_box(f"Stud_Back_{vx}", (timber_thick, timber_thick*0.8, w_h), (vx, -w_d/2 - 0.02, base_y + w_h/2), mat_timber, root)
    for vz in [-2.4, 0.0, 2.4]:
        create_box(f"Stud_SideW_{vz}", (timber_thick*0.8, timber_thick, w_h), (-w_w/2 - 0.02, vz, base_y + w_h/2), mat_timber, root)
        create_box(f"Stud_SideE_{vz}", (timber_thick*0.8, timber_thick, w_h), (w_w/2 + 0.02, vz, base_y + w_h/2), mat_timber, root)

    # 4. Front Porch (Veranda)
    p_w, p_d, p_h = 4.8, 2.4, 0.45
    p_center_z = w_d/2 + p_d/2
    # Porch foundation
    create_box("Porch_Foundation", (p_w, p_d, f_h - 0.1), (0, p_center_z, (f_h - 0.1)/2), mat_stone, root)
    # Porch timber deck
    create_box("Porch_Deck", (p_w + 0.2, p_d + 0.1, 0.12), (0, p_center_z, f_h + 0.06), mat_planks, root)

    # Porch stairs (3 steps centered at front of porch)
    s_w = 1.8
    for step in range(3):
        step_rise = 0.15
        step_run = 0.28
        sz = w_d/2 + p_d + (step + 1) * step_run - step_run/2
        sy = f_h + 0.06 - (step + 1) * step_rise + step_rise/2
        create_box(f"Porch_Step_{step+1}", (s_w, step_run, step_rise), (0, sz, sy), mat_planks, root)

    # Porch Posts (4 timber posts)
    post_h = 2.4
    for px in [-p_w/2 + 0.15, p_w/2 - 0.15]:
        for pz in [w_d/2 + 0.15, w_d/2 + p_d - 0.15]:
            create_box(f"Porch_Post_{px}_{pz}", (0.18, 0.18, post_h), (px, pz, f_h + 0.12 + post_h/2), mat_timber, root)

    # Porch Railings
    for side_x in [-p_w/2 + 0.15, p_w/2 - 0.15]:
        create_box(f"Porch_Rail_Side_{side_x}", (0.08, p_d - 0.3, 0.08), (side_x, p_center_z, f_h + 0.12 + 0.85), mat_timber, root)
        # Balusters
        for b in range(5):
            bz = w_d/2 + 0.4 + b * ((p_d - 0.8)/4)
            create_box(f"Baluster_{side_x}_{b}", (0.05, 0.05, 0.75), (side_x, bz, f_h + 0.12 + 0.45), mat_timber, root)
    # Front rails (leaving center opening for stairs)
    for fx in [-p_w/4 - s_w/4, p_w/4 + s_w/4]:
        rail_len = (p_w - s_w)/2 - 0.15
        create_box(f"Porch_Rail_Front_{fx}", (rail_len, 0.08, 0.08), (fx, w_d/2 + p_d - 0.15, f_h + 0.12 + 0.85), mat_timber, root)

    # Porch Roof (Pitched lean-to canopy)
    create_box("Porch_Roof_Canopy", (p_w + 0.6, p_d + 0.5, 0.14),
               (0, p_center_z + 0.1, f_h + post_h + 0.15), mat_shingles, root)
    # Pitch rotation
    p_roof = bpy.data.objects.get("Porch_Roof_Canopy")
    if p_roof:
        p_roof.rotation_euler.x = math.radians(12)

    # Hanging Brass Lantern on Porch
    lantern_body = create_box("Porch_Lantern", (0.22, 0.22, 0.35), (0, w_d/2 + p_d - 0.2, f_h + post_h - 0.2), mat_glass, root)
    create_box("Lantern_Cap", (0.26, 0.26, 0.08), (0, w_d/2 + p_d - 0.2, f_h + post_h - 0.02), mat_iron, lantern_body)

    # 5. Front Door Recessed Frame & Door Leaf
    door_w, door_h = 1.2, 2.2
    # Frame
    create_box("Door_Frame_Left", (0.12, 0.15, door_h), (-door_w/2 - 0.06, w_d/2 + 0.04, base_y + door_h/2), mat_timber, root)
    create_box("Door_Frame_Right", (0.12, 0.15, door_h), (door_w/2 + 0.06, w_d/2 + 0.04, base_y + door_h/2), mat_timber, root)
    create_box("Door_Frame_Top", (door_w + 0.24, 0.15, 0.12), (0, w_d/2 + 0.04, base_y + door_h + 0.06), mat_timber, root)
    
    # Door Leaf (Pivoted node at hinge: x=-door_w/2)
    door_leaf = create_box("door_leaf", (door_w - 0.04, 0.08, door_h - 0.04),
                           (0, w_d/2 + 0.02, base_y + door_h/2), mat_planks, root)
    # Iron strap hinges & ring handle
    create_box("Door_Hinge_Top", (0.25, 0.02, 0.05), (-door_w/4, w_d/2 + 0.07, base_y + door_h*0.8), mat_iron, door_leaf)
    create_box("Door_Hinge_Bottom", (0.25, 0.02, 0.05), (-door_w/4, w_d/2 + 0.07, base_y + door_h*0.25), mat_iron, door_leaf)
    create_box("Door_Handle", (0.08, 0.06, 0.12), (door_w/2 - 0.15, w_d/2 + 0.07, base_y + 1.05), mat_iron, door_leaf)

    # 6. Upper Gable & Steep Pitched Alpine Roof
    ridge_h = 7.0
    gable_base_y = base_y + w_h

    # North and South triangular gable walls (using bmesh)
    for g_name, g_z, g_sign in [("Gable_South", w_d/2, 1), ("Gable_North", -w_d/2, -1)]:
        bm = bmesh.new()
        v1 = bm.verts.new((-w_w/2, 0, 0))
        v2 = bm.verts.new((w_w/2, 0, 0))
        v3 = bm.verts.new((0, 0, ridge_h - gable_base_y))
        bm.faces.new((v1, v2, v3) if g_sign > 0 else (v3, v2, v1))
        bm.normal_update()

        mesh = bpy.data.meshes.new(g_name)
        bm.to_mesh(mesh)
        bm.free()

        obj = bpy.data.objects.new(g_name, mesh)
        obj.location = (0, g_z, gable_base_y)
        obj.data.materials.append(mat_timber)
        obj.parent = root
        bpy.context.collection.objects.link(obj)

    # Roof Slopes (East slope and West slope)
    roof_len = w_d + 1.2 # Overhangs on gable ends
    slope_w = math.hypot(w_w/2 + 0.6, ridge_h - gable_base_y)
    pitch_angle = math.atan2(ridge_h - gable_base_y, w_w/2)

    # East Roof Slope
    r_east = create_box("Roof_Slope_East", (slope_w, roof_len, 0.18),
                        ((w_w/2 + 0.3)/2, 0, (gable_base_y + ridge_h)/2 + 0.05), mat_shingles, root)
    r_east.rotation_euler.y = pitch_angle

    # West Roof Slope
    r_west = create_box("Roof_Slope_West", (slope_w, roof_len, 0.18),
                        (-(w_w/2 + 0.3)/2, 0, (gable_base_y + ridge_h)/2 + 0.05), mat_shingles, root)
    r_west.rotation_euler.y = -pitch_angle

    # Heavy timber Ridge Beam
    create_box("Roof_Ridge_Beam", (0.24, roof_len + 0.2, 0.28), (0, 0, ridge_h + 0.12), mat_timber, root)

    # Exposed Rafter Tails under eaves
    for e_z in range(int(w_d)):
        rz = -w_d/2 + 0.6 + e_z * 0.9
        create_box(f"Rafter_E_{e_z}", (0.5, 0.12, 0.12), (w_w/2 + 0.25, rz, gable_base_y - 0.06), mat_timber, root)
        create_box(f"Rafter_W_{e_z}", (0.5, 0.12, 0.12), (-w_w/2 - 0.25, rz, gable_base_y - 0.06), mat_timber, root)

    # Dormer Window on South Roof Slope
    d_w, d_d, d_h = 1.6, 1.8, 1.4
    create_box("Dormer_Body", (d_w, d_d, d_h), (0, w_d/4, gable_base_y + 0.8), mat_stucco, root)
    create_box("Dormer_Window_Glass", (1.0, 0.1, 0.9), (0, w_d/4 + d_d/2 + 0.02, gable_base_y + 0.8), mat_glass, root)
    create_box("Dormer_Roof", (d_w + 0.3, d_d + 0.3, 0.12), (0, w_d/4, gable_base_y + 1.55), mat_shingles, root)

    # 7. Ground Floor Windows with Cedar Flower Boxes
    win_coords = [
        (-3.2, w_d/2 + 0.02, base_y + 1.4, 0),
        (3.2, w_d/2 + 0.02, base_y + 1.4, 0),
        (-3.2, -w_d/2 - 0.02, base_y + 1.4, math.pi),
        (3.2, -w_d/2 - 0.02, base_y + 1.4, math.pi),
        (-w_w/2 - 0.02, 1.4, base_y + 1.4, -math.pi/2),
        (w_w/2 + 0.02, 1.4, base_y + 1.4, math.pi/2)
    ]
    for idx, (wx, wz, wy, wrot) in enumerate(win_coords):
        w_obj = create_box(f"Window_Frame_{idx}", (1.4, 0.12, 1.3), (wx, wz, wy), mat_timber, root)
        w_obj.rotation_euler.z = wrot
        create_box(f"Window_Glass_{idx}", (1.2, 0.04, 1.1), (wx, wz, wy), mat_glass, root)

        # Flower Box under window
        fbox_off_z = 0.22 if wrot == 0 else (-0.22 if wrot == math.pi else 0)
        fbox_off_x = 0.22 if wrot == math.pi/2 else (-0.22 if wrot == -math.pi/2 else 0)
        create_box(f"FlowerBox_{idx}", (1.4, 0.28, 0.24), (wx + fbox_off_x, wz + fbox_off_z, wy - 0.72), mat_planks, root)

        # Blooming flowers in box
        for fl_idx in range(5):
            fl_x = wx + (fl_idx - 2) * 0.22 if (wrot == 0 or wrot == math.pi) else wx
            fl_z = wz + (fl_idx - 2) * 0.22 if (wrot == math.pi/2 or wrot == -math.pi/2) else wz
            fl_mat = mat_flower_red if fl_idx % 2 == 0 else mat_flower_yellow
            create_box(f"Flower_{idx}_{fl_idx}", (0.12, 0.12, 0.14),
                       (fl_x + fbox_off_x*0.8, fl_z + fbox_off_z*0.8, wy - 0.55), fl_mat, root)

    # 8. Massive Fieldstone Chimney on East Wall
    chim_w, chim_d = 1.4, 1.4
    chim_x = w_w/2 + chim_w/2 - 0.2
    chim_z = -1.2
    chim_h = ridge_h + 0.8 # Protrudes above ridge peak
    create_box("Chimney_Breast", (chim_w, chim_d, chim_h), (chim_x, chim_z, chim_h/2), mat_stone, root)
    create_box("Chimney_Crown", (chim_w + 0.25, chim_d + 0.25, 0.2), (chim_x, chim_z, chim_h + 0.1), mat_stone, root)
    create_box("Chimney_Flue_Pot", (0.5, 0.5, 0.45), (chim_x, chim_z, chim_h + 0.4), mat_shingles, root)

    # Smoke Origin Empty Node
    smoke_empty = bpy.data.objects.new("chimney_smoke_origin", None)
    smoke_empty.location = (chim_x, chim_z, chim_h + 0.65)
    smoke_empty.parent = root
    bpy.context.collection.objects.link(smoke_empty)

    # 9. Attached Woodshed on West Wall
    shed_w, shed_d, shed_h = 3.2, 4.2, 2.3
    shed_x = -w_w/2 - shed_w/2
    shed_z = -0.5
    create_box("Woodshed_Frame", (shed_w, shed_d, shed_h), (shed_x, shed_z, shed_h/2 + f_h/2), mat_timber, root)
    # Slanted lean-to roof
    shed_roof = create_box("Woodshed_Roof", (shed_w + 0.4, shed_d + 0.4, 0.1), (shed_x, shed_z, f_h/2 + shed_h + 0.15), mat_shingles, root)
    shed_roof.rotation_euler.y = math.radians(-14)

    # Stacked firewood logs inside shed
    for log_row in range(3):
        for log_col in range(6):
            lx = shed_x - shed_w/4 + (log_col - 2.5) * 0.24
            lz = shed_z + (log_row % 2) * 0.08
            ly = f_h/2 + 0.2 + log_row * 0.26
            create_box(f"Firewood_{log_row}_{log_col}", (0.2, 1.2, 0.2), (lx, lz, ly), mat_timber, root)

    # 10. Embedded Dedicated Collision Proxies (-col suffix)
    # AssetPipeline extracts these and marks them invisible colliders
    create_box("foundation-col", (f_w, f_d, f_h), (0, 0, f_h/2), None, root)
    # Walls with doorway gap
    wall_col_thick = 0.35
    create_box("wall_north-col", (w_w, wall_col_thick, w_h), (0, -w_d/2, base_y + w_h/2), None, root)
    create_box("wall_east-col", (wall_col_thick, w_d, w_h), (w_w/2, 0, base_y + w_h/2), None, root)
    create_box("wall_west-col", (wall_col_thick, w_d, w_h), (-w_w/2, 0, base_y + w_h/2), None, root)
    # South wall split around door (door opening: width 1.4m from x=-0.7 to 0.7)
    left_w = (w_w - 1.4)/2
    create_box("wall_south_left-col", (left_w, wall_col_thick, w_h), (-w_w/2 + left_w/2, w_d/2, base_y + w_h/2), None, root)
    create_box("wall_south_right-col", (left_w, wall_col_thick, w_h), (w_w/2 - left_w/2, w_d/2, base_y + w_h/2), None, root)
    # Porch deck & stairs collision
    create_box("porch_deck-col", (p_w, p_d, f_h + 0.1), (0, p_center_z, (f_h + 0.1)/2), None, root)
    create_box("porch_stairs-col", (s_w, 0.9, 0.5), (0, w_d/2 + p_d + 0.45, 0.25), None, root)
    create_box("chimney-col", (chim_w, chim_d, chim_h), (chim_x, chim_z, chim_h/2), None, root)
    create_box("shed-col", (shed_w, shed_d, shed_h), (shed_x, shed_z, shed_h/2 + f_h/2), None, root)

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
