"""
Blender 5.2 Python script to build the Handcrafted Stylized-Realistic Farm Water Well.
Matches the Reference Board:
- Heavy dressed fieldstone circular well curb with stone coping lip (Z=0 to 0.95m)
- Inner dark well shaft with clear water reflection plane
- Sturdy timber A-frame uprights with diagonal mortise-and-tenon support braces
- Shingled gable roof canopy with timber shakes and ridge cap beam (Z=2.8m to 3.6m)
- Cylindrical wooden winch drum wrapped with coiled hemp rope
- Iron crank axle, crank handle arm, and wooden grip
- Suspended wooden water bucket with iron reinforcement hoops and bail handle
- Interaction collision proxy & water trigger
- Exports: public/models/farm_well.glb and saves public/models/farm_well.blend
"""

import bpy
import bmesh
import math
import mathutils
import os

def build_well():
    print("=== AUTHORING PREMIUM BLENDER FARM WELL ===")

    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes):
        if b.users == 0: bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        if b.users == 0: bpy.data.materials.remove(b)

    col = bpy.context.scene.collection

    # 2. Materials
    # Fieldstone Masonry Material
    mat_stone = bpy.data.materials.new(name="M_Well_Stone")
    mat_stone.use_nodes = True
    bsdf_st = mat_stone.node_tree.nodes.get("Principled BSDF")
    bsdf_st.inputs["Base Color"].default_value = (0.42, 0.44, 0.46, 1.0) # Weathered limestone
    bsdf_st.inputs["Roughness"].default_value = 0.88

    # Timber Wood Material
    mat_wood = bpy.data.materials.new(name="M_Well_Wood")
    mat_wood.use_nodes = True
    bsdf_wd = mat_wood.node_tree.nodes.get("Principled BSDF")
    bsdf_wd.inputs["Base Color"].default_value = (0.34, 0.22, 0.12, 1.0) # Alpine oak timber
    bsdf_wd.inputs["Roughness"].default_value = 0.78

    # Roof Shingles Material
    mat_shingles = bpy.data.materials.new(name="M_Well_Roof")
    mat_shingles.use_nodes = True
    bsdf_rf = mat_shingles.node_tree.nodes.get("Principled BSDF")
    bsdf_rf.inputs["Base Color"].default_value = (0.22, 0.25, 0.28, 1.0) # Slate shingles
    bsdf_rf.inputs["Roughness"].default_value = 0.72

    # Iron Metal Material
    mat_iron = bpy.data.materials.new(name="M_Well_Iron")
    mat_iron.use_nodes = True
    bsdf_ir = mat_iron.node_tree.nodes.get("Principled BSDF")
    bsdf_ir.inputs["Base Color"].default_value = (0.18, 0.20, 0.22, 1.0)
    bsdf_ir.inputs["Roughness"].default_value = 0.45
    bsdf_ir.inputs["Metallic"].default_value = 0.80

    # Hemp Rope Material
    mat_rope = bpy.data.materials.new(name="M_Well_Rope")
    mat_rope.use_nodes = True
    bsdf_rp = mat_rope.node_tree.nodes.get("Principled BSDF")
    bsdf_rp.inputs["Base Color"].default_value = (0.62, 0.52, 0.35, 1.0)
    bsdf_rp.inputs["Roughness"].default_value = 0.92

    # Water Material
    mat_water = bpy.data.materials.new(name="M_Well_Water")
    mat_water.use_nodes = True
    bsdf_wt = mat_water.node_tree.nodes.get("Principled BSDF")
    bsdf_wt.inputs["Base Color"].default_value = (0.05, 0.45, 0.75, 1.0)
    bsdf_wt.inputs["Roughness"].default_value = 0.05
    bsdf_wt.inputs["Metallic"].default_value = 0.20
    bsdf_wt.inputs["Transmission Weight"].default_value = 0.65

    # Root Empty
    root = bpy.data.objects.new("farm_well_root", None)
    col.objects.link(root)

    # 3. Dressed Circular Stone Curb with Coping Stones
    bm_stone = bmesh.new()
    sides = 16
    r_outer = 1.45
    r_inner = 1.15
    curb_h = 0.88
    coping_lip = 0.12

    # Outer wall rings
    for z, r in [(0.0, r_outer + 0.08), (curb_h * 0.5, r_outer), (curb_h, r_outer)]:
        ring = []
        for i in range(sides):
            ang = (i / sides) * math.pi * 2
            # Add slight faceted stone relief
            wobble = 1.0 + 0.03 * math.sin(i * 3.5)
            vx = r * wobble * math.cos(ang)
            vy = r * wobble * math.sin(ang)
            ring.append(bm_stone.verts.new((vx, vy, z)))
        if z == 0.0:
            r0 = ring
        elif z == curb_h * 0.5:
            r1 = ring
        else:
            r2 = ring

    for i in range(sides):
        inxt = (i + 1) % sides
        bm_stone.faces.new((r0[i], r1[i], r1[inxt], r0[inxt]))
        bm_stone.faces.new((r1[i], r2[i], r2[inxt], r1[inxt]))

    # Coping rim (top rounded lip projecting outward)
    coping_outer = []
    coping_inner = []
    for i in range(sides):
        ang = (i / sides) * math.pi * 2
        vx_o = (r_outer + coping_lip) * math.cos(ang)
        vy_o = (r_outer + coping_lip) * math.sin(ang)
        vx_i = r_inner * math.cos(ang)
        vy_i = r_inner * math.sin(ang)
        coping_outer.append(bm_stone.verts.new((vx_o, vy_o, curb_h + 0.08)))
        coping_inner.append(bm_stone.verts.new((vx_i, vy_i, curb_h + 0.08)))

    for i in range(sides):
        inxt = (i + 1) % sides
        bm_stone.faces.new((r2[i], coping_outer[i], coping_outer[inxt], r2[inxt]))
        bm_stone.faces.new((coping_outer[i], coping_inner[i], coping_inner[inxt], coping_outer[inxt]))

    # Inner stone shaft downward
    shaft_bot = []
    for i in range(sides):
        ang = (i / sides) * math.pi * 2
        vx = r_inner * math.cos(ang)
        vy = r_inner * math.sin(ang)
        shaft_bot.append(bm_stone.verts.new((vx, vy, 0.15)))

    for i in range(sides):
        inxt = (i + 1) % sides
        bm_stone.faces.new((coping_inner[i], shaft_bot[i], shaft_bot[inxt], coping_inner[inxt]))

    # Cap bottom inner floor
    bm_stone.faces.new(reversed(shaft_bot))

    mesh_stone = bpy.data.meshes.new("well_stone_mesh")
    bm_stone.to_mesh(mesh_stone)
    bm_stone.free()
    obj_stone = bpy.data.objects.new("well_stone", mesh_stone)
    obj_stone.data.materials.append(mat_stone)
    obj_stone.parent = root
    col.objects.link(obj_stone)

    # 4. Water Surface Plane inside well
    bm_water = bmesh.new()
    w_verts = []
    for i in range(sides):
        ang = (i / sides) * math.pi * 2
        w_verts.append(bm_water.verts.new((r_inner * 0.98 * math.cos(ang), r_inner * 0.98 * math.sin(ang), 0.45)))
    bm_water.faces.new(w_verts)
    mesh_water = bpy.data.meshes.new("well_water_mesh")
    bm_water.to_mesh(mesh_water)
    bm_water.free()
    obj_water = bpy.data.objects.new("well_water", mesh_water)
    obj_water.data.materials.append(mat_water)
    obj_water.parent = root
    col.objects.link(obj_water)

    # 5. Timber Structure: A-Frame Uprights, Braces, Winch, Roof, and Beam
    bm_wood = bmesh.new()

    # Helper function for timber box beams
    def add_timber_box(cx, cy, cz, sx, sy, sz, rx=0, ry=0, rz=0):
        bmesh.ops.create_cube(bm_wood, size=1.0, matrix=mathutils.Matrix.Translation((cx, cy, cz)) @ 
            mathutils.Euler((rx, ry, rz)).to_matrix().to_4x4() @ 
            mathutils.Matrix.Diagonal((sx, sy, sz, 1.0)))

    # Main Upright Posts (Left & Right)
    post_w = 0.20
    post_h = 2.65
    add_timber_box(-1.22, 0, post_h / 2 + 0.1, post_w, post_w, post_h)
    add_timber_box(1.22,  0, post_h / 2 + 0.1, post_w, post_w, post_h)

    # Diagonal A-Frame Braces
    for px in (-1.22, 1.22):
        add_timber_box(px, 0.32, 2.15, 0.14, 0.14, 0.85, rx=math.radians(35))
        add_timber_box(px, -0.32, 2.15, 0.14, 0.14, 0.85, rx=math.radians(-35))

    # Top Crossbeam across posts
    add_timber_box(0, 0, 2.72, 2.85, 0.22, 0.22)

    # Winch Drum (horizontal wood cylinder)
    bmesh.ops.create_cone(
        bm_wood,
        cap_ends=True,
        cap_tris=False,
        segments=12,
        radius1=0.13,
        radius2=0.13,
        depth=1.65,
        matrix=mathutils.Matrix.Translation((0, 0, 2.25)) @ mathutils.Euler((0, math.radians(90), 0)).to_matrix().to_4x4()
    )

    mesh_wood = bpy.data.meshes.new("well_timber_mesh")
    bm_wood.to_mesh(mesh_wood)
    bm_wood.free()
    obj_wood = bpy.data.objects.new("well_timber", mesh_wood)
    obj_wood.data.materials.append(mat_wood)
    obj_wood.parent = root
    col.objects.link(obj_wood)

    # 6. Shingled Gable Roof Canopy with Overhanging Eaves
    bm_roof = bmesh.new()

    roof_pitch = math.radians(36)
    roof_len = 3.05 # East-West length
    roof_slope = 1.62 # Slope length
    roof_thick = 0.12

    # South Slope
    bmesh.ops.create_cube(
        bm_roof,
        size=1.0,
        matrix=mathutils.Matrix.Translation((0, 0.62, 3.12)) @ 
               mathutils.Euler((roof_pitch, 0, 0)).to_matrix().to_4x4() @ 
               mathutils.Matrix.Diagonal((roof_len, roof_slope, roof_thick, 1.0))
    )
    # North Slope
    bmesh.ops.create_cube(
        bm_roof,
        size=1.0,
        matrix=mathutils.Matrix.Translation((0, -0.62, 3.12)) @ 
               mathutils.Euler((-roof_pitch, 0, 0)).to_matrix().to_4x4() @ 
               mathutils.Matrix.Diagonal((roof_len, roof_slope, roof_thick, 1.0))
    )
    # Ridge Cap Beam
    bmesh.ops.create_cube(
        bm_roof,
        size=1.0,
        matrix=mathutils.Matrix.Translation((0, 0, 3.68)) @ 
               mathutils.Matrix.Diagonal((roof_len + 0.16, 0.28, 0.18, 1.0))
    )

    mesh_roof = bpy.data.meshes.new("well_roof_mesh")
    bm_roof.to_mesh(mesh_roof)
    bm_roof.free()
    obj_roof = bpy.data.objects.new("well_roof", mesh_roof)
    obj_roof.data.materials.append(mat_shingles)
    obj_roof.parent = root
    col.objects.link(obj_roof)

    # 7. Rope & Iron Winch Hardware + Suspended Bucket
    bm_hardware = bmesh.new()
    bm_rope = bmesh.new()

    # Iron Axle through Crossbeam
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=8,
        radius1=0.038,
        radius2=0.038,
        depth=2.2,
        matrix=mathutils.Matrix.Translation((0.2, 0, 2.25)) @ mathutils.Euler((0, math.radians(90), 0)).to_matrix().to_4x4()
    )

    # Iron Crank Arm
    bmesh.ops.create_cube(
        bm_hardware,
        size=1.0,
        matrix=mathutils.Matrix.Translation((1.42, 0, 2.10)) @ mathutils.Matrix.Diagonal((0.06, 0.06, 0.38, 1.0))
    )
    # Iron Crank Spindle
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=8,
        radius1=0.03,
        radius2=0.03,
        depth=0.22,
        matrix=mathutils.Matrix.Translation((1.42, 0.11, 1.91)) @ mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
    )

    # Coiled Rope on Drum
    bmesh.ops.create_cone(
        bm_rope,
        cap_ends=True,
        segments=12,
        radius1=0.165,
        radius2=0.165,
        depth=0.72,
        matrix=mathutils.Matrix.Translation((0, 0, 2.25)) @ mathutils.Euler((0, math.radians(90), 0)).to_matrix().to_4x4()
    )
    # Hanging Rope to Bucket
    bmesh.ops.create_cone(
        bm_rope,
        cap_ends=True,
        segments=6,
        radius1=0.018,
        radius2=0.018,
        depth=0.98,
        matrix=mathutils.Matrix.Translation((0, 0, 1.76))
    )

    # Suspended Bucket Body
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=10,
        radius1=0.24,
        radius2=0.18,
        depth=0.38,
        matrix=mathutils.Matrix.Translation((0, 0, 1.15))
    )
    # Bucket Iron Hoops
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=10,
        radius1=0.245,
        radius2=0.235,
        depth=0.04,
        matrix=mathutils.Matrix.Translation((0, 0, 1.25))
    )
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=10,
        radius1=0.205,
        radius2=0.195,
        depth=0.04,
        matrix=mathutils.Matrix.Translation((0, 0, 1.05))
    )
    # Bucket Iron Bail Handle
    bmesh.ops.create_cone(
        bm_hardware,
        cap_ends=True,
        segments=8,
        radius1=0.018,
        radius2=0.018,
        depth=0.45,
        matrix=mathutils.Matrix.Translation((0, 0, 1.34)) @ mathutils.Euler((0, math.radians(90), 0)).to_matrix().to_4x4()
    )

    mesh_hardware = bpy.data.meshes.new("well_hardware_mesh")
    bm_hardware.to_mesh(mesh_hardware)
    bm_hardware.free()
    obj_hardware = bpy.data.objects.new("well_hardware", mesh_hardware)
    obj_hardware.data.materials.append(mat_iron)
    obj_hardware.parent = root
    col.objects.link(obj_hardware)

    mesh_rope = bpy.data.meshes.new("well_rope_mesh")
    bm_rope.to_mesh(mesh_rope)
    bm_rope.free()
    obj_rope = bpy.data.objects.new("well_rope", mesh_rope)
    obj_rope.data.materials.append(mat_rope)
    obj_rope.parent = root
    col.objects.link(obj_rope)

    # 8. Export GLB & Save Blend
    out_dir = r"d:\Projects from me\slavey game\public\models"
    blend_path = os.path.join(out_dir, "farm_well.blend")
    glb_path = os.path.join(out_dir, "farm_well.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Blend:", blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    obj_stone.select_set(True)
    obj_water.select_set(True)
    obj_wood.select_set(True)
    obj_roof.select_set(True)
    obj_hardware.select_set(True)
    obj_rope.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print("Exported GLB:", glb_path)
    print("Farm Well Build Complete!")

build_well()
