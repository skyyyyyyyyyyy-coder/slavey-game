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

def build_farmhouse_interior():
    clear_scene()

    # Materials Palette
    mat_floor = get_or_create_material("Int_Wood_Floor", (0.42, 0.26, 0.14, 1.0), roughness=0.65)
    mat_timber = get_or_create_material("Int_Dark_Timber", (0.22, 0.13, 0.07, 1.0), roughness=0.75)
    mat_plaster = get_or_create_material("Int_Plaster_Wall", (0.92, 0.88, 0.80, 1.0), roughness=0.88)
    mat_stone = get_or_create_material("Int_Stone_Hearth", (0.32, 0.30, 0.28, 1.0), roughness=0.92)
    mat_rug = get_or_create_material("Int_Wool_Rug", (0.65, 0.32, 0.22, 1.0), roughness=0.95)
    mat_bed_wood = get_or_create_material("Int_Bed_Frame", (0.35, 0.20, 0.10, 1.0), roughness=0.70)
    mat_quilt = get_or_create_material("Int_Patchwork_Quilt", (0.75, 0.24, 0.18, 1.0), roughness=0.85)
    mat_pillow = get_or_create_material("Int_Pillow_White", (0.94, 0.94, 0.92, 1.0), roughness=0.80)
    mat_iron = get_or_create_material("Int_Iron_Metal", (0.12, 0.12, 0.14, 1.0), roughness=0.45, metallic=0.85)
    mat_brass = get_or_create_material("Int_Brass_Metal", (0.82, 0.65, 0.22, 1.0), roughness=0.35, metallic=0.75)
    mat_ceramic = get_or_create_material("Int_Ceramic_Dish", (0.88, 0.86, 0.82, 1.0), roughness=0.30)
    mat_apple = get_or_create_material("Int_Apple_Red", (0.85, 0.12, 0.12, 1.0), roughness=0.35)
    mat_fire_ember = get_or_create_material("Int_Fire_Embers", (0.95, 0.45, 0.05, 1.0), roughness=0.40)

    root = bpy.data.objects.new("Farmhouse_Interior_Root", None)
    bpy.context.collection.objects.link(root)

    room_w, room_d, room_h = 9.6, 7.0, 3.6

    # 1. Cedar Floor & Tongue-and-Groove Baseboards
    create_box("Floor_Boards", (room_w, room_d, 0.2), (0, 0, -0.1), mat_floor, root)
    create_box("Ceiling_Planks", (room_w, room_d, 0.18), (0, 0, room_h + 0.09), mat_timber, root)

    # Ceiling Heavy Crossbeams
    for b_idx in range(5):
        bz = -room_d/2 + 0.8 + b_idx * (room_d - 1.6)/4
        create_box(f"Ceiling_Beam_{b_idx}", (room_w, 0.24, 0.24), (0, bz, room_h - 0.12), mat_timber, root)

    # 2. Perimeter Walls with Timber Wainscoting Skirting
    wall_thick = 0.28
    # North Wall (Hearth wall)
    create_box("Wall_North", (room_w, wall_thick, room_h), (0, -room_d/2 - wall_thick/2, room_h/2), mat_plaster, root)
    # East Wall (Dining/Kitchen wall)
    create_box("Wall_East", (wall_thick, room_d, room_h), (room_w/2 + wall_thick/2, 0, room_h/2), mat_plaster, root)
    # West Wall (Bedroom wall)
    create_box("Wall_West", (wall_thick, room_d, room_h), (-room_w/2 - wall_thick/2, 0, room_h/2), mat_plaster, root)
    
    # South Wall (Split with Exit Doorway: width 1.3m from x=-0.65 to 0.65)
    door_w, door_h = 1.3, 2.3
    sw_part_w = (room_w - door_w)/2
    create_box("Wall_South_Left", (sw_part_w, wall_thick, room_h),
               (-room_w/2 + sw_part_w/2, room_d/2 + wall_thick/2, room_h/2), mat_plaster, root)
    create_box("Wall_South_Right", (sw_part_w, wall_thick, room_h),
               (room_w/2 - sw_part_w/2, room_d/2 + wall_thick/2, room_h/2), mat_plaster, root)
    create_box("Wall_South_Top", (door_w, wall_thick, room_h - door_h),
               (0, room_d/2 + wall_thick/2, door_h + (room_h - door_h)/2), mat_plaster, root)

    # Wainscoting wainscot panels (0.85m height around walls)
    wain_h = 0.85
    create_box("Wainscot_North", (room_w - 2.8, 0.04, wain_h), (0, -room_d/2 + 0.02, wain_h/2), mat_timber, root)
    create_box("Wainscot_East", (0.04, room_d - 0.2, wain_h), (room_w/2 - 0.02, 0, wain_h/2), mat_timber, root)
    create_box("Wainscot_West", (0.04, room_d - 0.2, wain_h), (-room_w/2 + 0.02, 0, wain_h/2), mat_timber, root)

    # Exit Door Frame & Interior Door Leaf at South Wall
    create_box("Exit_Door_Frame_L", (0.12, 0.16, door_h), (-door_w/2 - 0.06, room_d/2, door_h/2), mat_timber, root)
    create_box("Exit_Door_Frame_R", (0.12, 0.16, door_h), (door_w/2 + 0.06, room_d/2, door_h/2), mat_timber, root)
    create_box("Exit_Door_Frame_T", (door_w + 0.24, 0.16, 0.12), (0, room_d/2, door_h + 0.06), mat_timber, root)
    exit_door = create_box("exit_door_leaf", (door_w - 0.04, 0.08, door_h - 0.04), (0, room_d/2 + 0.02, door_h/2), mat_timber, root)
    create_box("Exit_Door_Handle", (0.08, 0.06, 0.12), (door_w/2 - 0.15, room_d/2 - 0.04, 1.05), mat_iron, root)

    # 3. Fieldstone Fireplace Hearth (North Wall Center)
    h_w, h_d, h_h = 2.8, 1.4, 2.6
    hz = -room_d/2 + h_d/2
    create_box("Fireplace_Hearth_Base", (h_w, h_d, 0.25), (0, hz, 0.125), mat_stone, root)
    create_box("Fireplace_Pillar_L", (0.55, h_d - 0.2, h_h), (-h_w/2 + 0.275, hz - 0.1, h_h/2), mat_stone, root)
    create_box("Fireplace_Pillar_R", (0.55, h_d - 0.2, h_h), (h_w/2 - 0.275, hz - 0.1, h_h/2), mat_stone, root)
    create_box("Fireplace_Lintel", (h_w, h_d - 0.1, 0.45), (0, hz - 0.05, h_h - 0.225), mat_stone, root)
    # Heavy timber mantelpiece
    create_box("Fireplace_Mantelpiece", (h_w + 0.4, h_d + 0.2, 0.15), (0, hz, h_h + 0.075), mat_timber, root)
    # Stone Chimney Breast up to ceiling
    create_box("Fireplace_Chimney_Breast", (h_w - 0.4, h_d - 0.2, room_h - h_h), (0, hz - 0.1, h_h + (room_h - h_h)/2), mat_stone, root)
    
    # Cast-iron fire grate & firewood embers inside hearth
    create_box("Fireplace_Grate", (1.2, 0.6, 0.18), (0, hz + 0.1, 0.34), mat_iron, root)
    create_box("Fireplace_Logs", (0.9, 0.45, 0.22), (0, hz + 0.1, 0.45), mat_timber, root)
    create_box("Fireplace_Embers", (0.7, 0.35, 0.12), (0, hz + 0.1, 0.35), mat_fire_ember, root)

    # Fireplace Interactive Light Node / Anchor
    hearth_light_node = bpy.data.objects.new("hearth_light_anchor", None)
    hearth_light_node.location = (0, hz + 0.2, 0.8)
    hearth_light_node.parent = root
    bpy.context.collection.objects.link(hearth_light_node)

    # 4. Quilted Bed (North-West Bedroom Nook: x=-3.1, z=-2.1)
    bed_w, bed_l = 2.1, 2.4
    bed_x, bed_z = -room_w/2 + bed_w/2 + 0.4, -room_d/2 + bed_l/2 + 0.4
    # Wooden Frame
    create_box("Bed_Frame", (bed_w, bed_l, 0.35), (bed_x, bed_z, 0.175), mat_bed_wood, root)
    # 4 Corner Bedposts
    for bpx in [-bed_w/2, bed_w/2]:
        for bpz in [-bed_l/2, bed_l/2]:
            b_post_h = 1.3 if bpz < 0 else 0.85
            create_box(f"Bedpost_{bpx}_{bpz}", (0.12, 0.12, b_post_h),
                       (bed_x + bpx, bed_z + bpz, b_post_h/2), mat_bed_wood, root)
    # Carved Headboard
    create_box("Bed_Headboard", (bed_w - 0.1, 0.1, 0.9), (bed_x, bed_z - bed_l/2 + 0.05, 0.6), mat_bed_wood, root)
    # Mattress
    create_box("Bed_Mattress", (bed_w - 0.2, bed_l - 0.2, 0.25), (bed_x, bed_z, 0.45), mat_pillow, root)
    # Folded Quilt / Patchwork Blanket
    create_box("Bed_Quilt", (bed_w - 0.18, bed_l * 0.72, 0.12), (bed_x, bed_z + 0.25, 0.58), mat_quilt, root)
    # Twin Pillows
    create_box("Bed_Pillow_1", (0.7, 0.45, 0.14), (bed_x - 0.45, bed_z - bed_l/2 + 0.45, 0.62), mat_pillow, root)
    create_box("Bed_Pillow_2", (0.7, 0.45, 0.14), (bed_x + 0.45, bed_z - bed_l/2 + 0.45, 0.62), mat_pillow, root)

    # Bedside Nightstand with Candle
    ns_x, ns_z = bed_x + bed_w/2 + 0.45, bed_z - bed_l/2 + 0.45
    create_box("Nightstand", (0.6, 0.6, 0.65), (ns_x, ns_z, 0.325), mat_bed_wood, root)
    create_box("Candle_Holder", (0.16, 0.16, 0.04), (ns_x, ns_z, 0.67), mat_brass, root)
    create_box("Candle_Wax", (0.06, 0.06, 0.18), (ns_x, ns_z, 0.78), mat_pillow, root)

    # Bed Interaction Node
    bed_node = bpy.data.objects.new("bed_sleep_node", None)
    bed_node.location = (bed_x, bed_z, 0.6)
    bed_node.parent = root
    bpy.context.collection.objects.link(bed_node)

    # 5. Dining Area: Rustic Trestle Table & Spindle Chairs (East Wall: x=3.0, z=-0.6)
    tbl_w, tbl_l, tbl_h = 1.3, 2.4, 0.76
    tbl_x, tbl_z = room_w/2 - tbl_w/2 - 0.6, -0.6
    # Table top
    create_box("Table_Top", (tbl_w, tbl_l, 0.08), (tbl_x, tbl_z, tbl_h), mat_timber, root)
    # Trestle A-legs & stretcher beam
    create_box("Table_Leg_North", (tbl_w - 0.3, 0.12, tbl_h - 0.08), (tbl_x, tbl_z - tbl_l/3, (tbl_h - 0.08)/2), mat_timber, root)
    create_box("Table_Leg_South", (tbl_w - 0.3, 0.12, tbl_h - 0.08), (tbl_x, tbl_z + tbl_l/3, (tbl_h - 0.08)/2), mat_timber, root)
    create_box("Table_Stretcher", (0.1, tbl_l - 0.6, 0.1), (tbl_x, tbl_z, 0.2), mat_timber, root)

    # Two Chairs (Facing table)
    for c_idx, c_x in enumerate([tbl_x - 0.7, tbl_x + 0.7]):
        # Seat
        create_box(f"Chair_Seat_{c_idx}", (0.5, 0.5, 0.06), (c_x, tbl_z, 0.44), mat_timber, root)
        # Legs
        for clx in [-0.2, 0.2]:
            for clz in [-0.2, 0.2]:
                create_box(f"Chair_Leg_{c_idx}_{clx}_{clz}", (0.05, 0.05, 0.44),
                           (c_x + clx, tbl_z + clz, 0.22), mat_timber, root)
        # Backrest & Spindles
        br_x = c_x - 0.22 if c_idx == 0 else c_x + 0.22
        create_box(f"Chair_Back_{c_idx}", (0.06, 0.46, 0.5), (br_x, tbl_z, 0.7), mat_timber, root)

    # Table Dishware & Food
    create_box("Table_Bowl", (0.35, 0.35, 0.12), (tbl_x, tbl_z, tbl_h + 0.1), mat_ceramic, root)
    create_box("Table_Apple_1", (0.1, 0.1, 0.1), (tbl_x - 0.06, tbl_z, tbl_h + 0.18), mat_apple, root)
    create_box("Table_Apple_2", (0.1, 0.1, 0.1), (tbl_x + 0.06, tbl_z, tbl_h + 0.18), mat_apple, root)
    create_box("Table_Mug", (0.14, 0.14, 0.16), (tbl_x, tbl_z + 0.5, tbl_h + 0.12), mat_ceramic, root)

    # 6. Kitchen Cupboard & Wall Shelves (South-East Corner: x=3.2, z=2.2)
    cb_w, cb_d, cb_h = 1.0, 1.8, 0.9
    cb_x, cb_z = room_w/2 - cb_w/2 - 0.2, room_d/2 - cb_d/2 - 0.5
    create_box("Kitchen_Cupboard", (cb_w, cb_d, cb_h), (cb_x, cb_z, cb_h/2), mat_timber, root)
    create_box("Cupboard_Countertop", (cb_w + 0.08, cb_d + 0.08, 0.06), (cb_x, cb_z, cb_h + 0.03), mat_floor, root)
    # Kitchen Wall Shelves
    create_box("Kitchen_Shelf_1", (0.35, 1.6, 0.05), (room_w/2 - 0.2, cb_z, 1.8), mat_timber, root)
    create_box("Kitchen_Shelf_2", (0.35, 1.6, 0.05), (room_w/2 - 0.2, cb_z, 2.3), mat_timber, root)

    # 7. Iron-Bound Storage Chest (Beside Cupboard: x=1.8, z=2.7)
    ch_w, ch_d, ch_h = 1.1, 0.65, 0.55
    ch_x, ch_z = 1.8, room_d/2 - ch_d/2 - 0.4
    create_box("chest_body", (ch_w, ch_d, ch_h - 0.12), (ch_x, ch_z, (ch_h - 0.12)/2), mat_timber, root)
    create_box("chest_lid", (ch_w + 0.04, ch_d + 0.04, 0.12), (ch_x, ch_z, ch_h - 0.06), mat_timber, root)
    # Iron corner straps & lock latch
    create_box("Chest_Iron_Band_L", (0.08, ch_d + 0.06, ch_h + 0.02), (ch_x - 0.35, ch_z, ch_h/2), mat_iron, root)
    create_box("Chest_Iron_Band_R", (0.08, ch_d + 0.06, ch_h + 0.02), (ch_x + 0.35, ch_z, ch_h/2), mat_iron, root)
    create_box("Chest_Latch", (0.12, 0.04, 0.14), (ch_x, ch_z - ch_d/2 - 0.02, ch_h/2 + 0.05), mat_iron, root)

    # Chest Interaction Node
    chest_node = bpy.data.objects.new("storage_chest_node", None)
    chest_node.location = (ch_x, ch_z, ch_h/2)
    chest_node.parent = root
    bpy.context.collection.objects.link(chest_node)

    # 8. Cozy Braided Oval Wool Rug (Room Center)
    create_box("Braided_Rug", (3.6, 2.6, 0.02), (0, 0, 0.01), mat_rug, root)

    # 9. Hanging Ceiling Chandelier with Candles
    create_box("Chandelier_Ring", (1.2, 1.2, 0.05), (0, 0, room_h - 0.6), mat_iron, root)
    create_box("Chandelier_Chain", (0.06, 0.06, 0.6), (0, 0, room_h - 0.3), mat_iron, root)
    for c_ang in [0, math.pi/2, math.pi, 3*math.pi/2]:
        cx = math.cos(c_ang) * 0.55
        cz = math.sin(c_ang) * 0.55
        create_box(f"Chand_Candle_{c_ang}", (0.05, 0.05, 0.14), (cx, cz, room_h - 0.5), mat_pillow, root)

    # 10. Embedded Dedicated Collision Proxies (-col suffix)
    create_box("int_floor-col", (room_w, room_d, 0.2), (0, 0, -0.1), None, root)
    create_box("int_wall_north-col", (room_w, wall_thick, room_h), (0, -room_d/2 - wall_thick/2, room_h/2), None, root)
    create_box("int_wall_east-col", (wall_thick, room_d, room_h), (room_w/2 + wall_thick/2, 0, room_h/2), None, root)
    create_box("int_wall_west-col", (wall_thick, room_d, room_h), (-room_w/2 - wall_thick/2, 0, room_h/2), None, root)
    create_box("int_wall_south_l-col", (sw_part_w, wall_thick, room_h), (-room_w/2 + sw_part_w/2, room_d/2 + wall_thick/2, room_h/2), None, root)
    create_box("int_wall_south_r-col", (sw_part_w, wall_thick, room_h), (room_w/2 - sw_part_w/2, room_d/2 + wall_thick/2, room_h/2), None, root)
    
    # Solid Furniture Hitboxes
    create_box("int_hearth-col", (h_w, h_d, h_h), (0, hz, h_h/2), None, root)
    create_box("int_bed-col", (bed_w, bed_l, 0.7), (bed_x, bed_z, 0.35), None, root)
    create_box("int_table-col", (tbl_w, tbl_l, tbl_h), (tbl_x, tbl_z, tbl_h/2), None, root)
    create_box("int_cupboard-col", (cb_w, cb_d, cb_h), (cb_x, cb_z, cb_h/2), None, root)
    create_box("int_chest-col", (ch_w, ch_d, ch_h), (ch_x, ch_z, ch_h/2), None, root)

    # Ensure output directory exists
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "farmhouse_interior.blend")
    glb_path = os.path.join(out_dir, "farmhouse_interior.glb")

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

build_farmhouse_interior()
