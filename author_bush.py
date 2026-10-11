"""
Blender 5.2 Python script to build the Handcrafted Stylized-Realistic Alpine Shrub / Bush.
Matches the Reference Board:
- Organic cluster of woody stems spreading upward from root collar (Z=0 to 1.1m)
- Layered, multi-faceted leaf lobe clusters with visible branch under-structure
- Elegant foliage volume with natural silhouette and asymmetry
- Subtle tiny white alpine flower blossoms with sunny yellow centers (tasteful accent)
- Rich green palette with vertex colors (deep inner shadow to bright sunlit highlights)
- Exports: public/models/shrub_bush.glb and saves public/models/shrub_bush.blend
"""

import bpy
import bmesh
import math
import mathutils
import os

def build_bush():
    print("=== AUTHORING PREMIUM BLENDER BUSH / SHRUB ===")

    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes):
        if b.users == 0: bpy.data.meshes.remove(b)
    for b in list(bpy.data.materials):
        if b.users == 0: bpy.data.materials.remove(b)

    col = bpy.context.scene.collection

    # 2. Materials
    # Foliage Material with Vertex Colors
    mat_foliage = bpy.data.materials.new(name="M_Bush_Foliage")
    mat_foliage.use_nodes = True
    mat_foliage.use_backface_culling = False
    nodes_f = mat_foliage.node_tree.nodes
    links_f = mat_foliage.node_tree.links
    nodes_f.clear()

    vc_f = nodes_f.new(type="ShaderNodeVertexColor")
    vc_f.layer_name = "Col"
    bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
    bsdf_f.inputs["Roughness"].default_value = 0.65
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
    bsdf_b.inputs["Base Color"].default_value = (0.24, 0.16, 0.10, 1.0)
    bsdf_b.inputs["Roughness"].default_value = 0.85
    bsdf_b.inputs["Metallic"].default_value = 0.0
    out_b = nodes_b.new(type="ShaderNodeOutputMaterial")
    links_b.new(bsdf_b.outputs["BSDF"], out_b.inputs["Surface"])

    # White Flower Petals Material
    mat_flower = bpy.data.materials.new(name="M_Bush_Flower")
    mat_flower.use_nodes = True
    nodes_fl = mat_flower.node_tree.nodes
    links_fl = mat_flower.node_tree.links
    nodes_fl.clear()
    bsdf_fl = nodes_fl.new(type="ShaderNodeBsdfPrincipled")
    bsdf_fl.inputs["Base Color"].default_value = (0.95, 0.95, 0.90, 1.0) # White petals
    bsdf_fl.inputs["Roughness"].default_value = 0.45
    bsdf_fl.inputs["Metallic"].default_value = 0.0
    out_fl = nodes_fl.new(type="ShaderNodeOutputMaterial")
    links_fl.new(bsdf_fl.outputs["BSDF"], out_fl.inputs["Surface"])

    # Flower Center Material
    mat_pistil = bpy.data.materials.new(name="M_Bush_Pistil")
    mat_pistil.use_nodes = True
    nodes_p = mat_pistil.node_tree.nodes
    links_p = mat_pistil.node_tree.links
    nodes_p.clear()
    bsdf_p = nodes_p.new(type="ShaderNodeBsdfPrincipled")
    bsdf_p.inputs["Base Color"].default_value = (0.95, 0.75, 0.10, 1.0) # Yellow center
    bsdf_p.inputs["Roughness"].default_value = 0.40
    out_p = nodes_p.new(type="ShaderNodeOutputMaterial")
    links_p.new(bsdf_p.outputs["BSDF"], out_p.inputs["Surface"])

    # Root Empty
    root = bpy.data.objects.new("shrub_bush_root", None)
    col.objects.link(root)

    # 3. Woody Multi-Stem Core Structure (BMesh)
    bm_stems = bmesh.new()

    stem_branches = [
        # (angle, start_r, end_r, tilt_deg, h, lean_angle)
        (0.0,  0.06, 0.025, 25, 0.95, 0.1),
        (1.2,  0.055, 0.02, 32, 0.88, -0.15),
        (2.3,  0.06, 0.025, 28, 0.92, 0.12),
        (3.5,  0.05, 0.02, 35, 0.82, -0.08),
        (4.7,  0.055, 0.025, 30, 0.86, 0.14),
        (0.6,  0.045, 0.02, 42, 0.75, 0.20),
        (2.8,  0.045, 0.02, 38, 0.72, -0.18),
    ]

    for ang, r0, r1, tilt, h, lean in stem_branches:
        rad_tilt = math.radians(tilt)
        # 4 segments per stem
        prev = None
        for step in range(5):
            st = step / 4.0
            z = st * h
            r_cur = r0 + (r1 - r0) * st
            # Outward flare
            dist_xy = math.sin(rad_tilt) * (st * 0.75) + 0.04
            cx = math.cos(ang + lean * st) * dist_xy
            cy = math.sin(ang + lean * st) * dist_xy

            # Ring of 5 verts
            ring = []
            for i in range(5):
                a = (i / 5.0) * math.pi * 2
                vx = cx + math.cos(a) * r_cur
                vy = cy + math.sin(a) * r_cur
                ring.append(bm_stems.verts.new((vx, vy, z)))

            if prev is not None:
                for i in range(5):
                    i_next = (i + 1) % 5
                    bm_stems.faces.new((prev[i], ring[i], ring[i_next], prev[i_next]))
            else:
                bm_stems.faces.new(reversed(ring))
            prev = ring
        bm_stems.faces.new(prev)

    mesh_stems = bpy.data.meshes.new("shrub_bush_stems_mesh")
    bm_stems.to_mesh(mesh_stems)
    bm_stems.free()
    obj_stems = bpy.data.objects.new("shrub_bush_stems", mesh_stems)
    obj_stems.data.materials.append(mat_bark)
    obj_stems.parent = root
    col.objects.link(obj_stems)

    # 4. Layered Foliage Lobes (BMesh with Vertex Colors)
    bm_foliage = bmesh.new()
    col_foliage = bm_foliage.loops.layers.color.new("Col")

    # Shrub Foliage Colors (Lush Mountain Shrub Green)
    c_deep   = (0.08, 0.28, 0.12, 1.0) # Inner shadow
    c_mid    = (0.16, 0.48, 0.18, 1.0) # Lush healthy alpine green
    c_light  = (0.28, 0.65, 0.24, 1.0) # Sunlit outer leaf lobes
    c_bright = (0.42, 0.78, 0.28, 1.0) # Highlight crown leaves

    # 8 Faceted leaf lobes clustering naturally around stems
    # (cx, cy, cz, rx, ry, rz)
    foliage_lobes = [
        (0.0,   0.0,  0.72, 0.75, 0.75, 0.48), # Central mass
        (0.42,  0.22, 0.64, 0.58, 0.54, 0.44), # East lobe
        (-0.38, 0.28, 0.62, 0.54, 0.56, 0.42), # Northwest lobe
        (0.18, -0.44, 0.58, 0.56, 0.52, 0.42), # South lobe
        (-0.32,-0.32, 0.55, 0.50, 0.52, 0.40), # Southwest lobe
        (0.48, -0.18, 0.50, 0.48, 0.46, 0.38), # Southeast lobe
        (0.0,   0.38, 0.60, 0.52, 0.50, 0.40), # North lobe
        (0.08,  0.05, 0.95, 0.48, 0.46, 0.34), # Top crowning cluster
    ]

    for cx, cy, cz, rx, ry, rz in foliage_lobes:
        sub_bm = bmesh.new()
        bmesh.ops.create_icosphere(sub_bm, subdivisions=2, radius=1.0)

        for v in sub_bm.verts:
            p = v.co
            # Flatten bottom slightly, expand sides
            shape = 1.0 + 0.15 * math.sin(p.x * 5.0) * math.cos(p.z * 4.5)
            v.co.x = p.x * rx * shape + cx
            v.co.y = p.y * ry * shape + cy
            v.co.z = max(0.08, p.z * rz * shape + cz)

        vert_map = {}
        for v in sub_bm.verts:
            vert_map[v] = bm_foliage.verts.new(v.co)

        for f in sub_bm.faces:
            new_f = bm_foliage.faces.new([vert_map[v] for v in f.verts])
            nz = f.normal.z
            h = f.calc_center_median().z / 1.1

            if nz > 0.4:
                col_val = c_bright if h > 0.6 else c_light
            elif nz < -0.2:
                col_val = c_deep
            else:
                col_val = c_light if h > 0.5 else c_mid

            for loop in new_f.loops:
                loop[col_foliage] = col_val

        sub_bm.free()

    mesh_foliage = bpy.data.meshes.new("shrub_bush_foliage_mesh")
    bm_foliage.to_mesh(mesh_foliage)
    bm_foliage.free()
    obj_foliage = bpy.data.objects.new("shrub_bush_foliage", mesh_foliage)
    obj_foliage.data.materials.append(mat_foliage)
    obj_foliage.parent = root
    col.objects.link(obj_foliage)

    # 5. Delicate White Alpine Flower Accents (Matching Reference Board)
    # 14 small 5-petaled flowers nestled on outer sunlit foliage surfaces
    bm_flowers = bmesh.new()
    flower_locs = [
        (0.35, 0.38, 0.85, 0.4, 0.5),
        (-0.28, 0.42, 0.82, -0.4, 0.6),
        (0.52, -0.15, 0.78, 0.6, -0.3),
        (-0.45, -0.22, 0.74, -0.7, -0.2),
        (0.12, -0.48, 0.72, 0.2, -0.8),
        (-0.18, 0.12, 1.08, -0.1, 0.2),
        (0.24, 0.08, 1.06, 0.3, 0.1),
        (0.48, 0.22, 0.65, 0.8, 0.2),
        (-0.42, 0.30, 0.68, -0.6, 0.5),
        (0.28, -0.38, 0.62, 0.4, -0.6),
        (-0.30, -0.36, 0.60, -0.5, -0.5),
        (-0.05, 0.52, 0.75, -0.1, 0.8),
        (0.05, -0.05, 1.12, 0.0, 0.0),
        (-0.25, -0.05, 0.98, -0.3, 0.0),
    ]

    for fx, fy, fz, nx, ny in flower_locs:
        # 5 small triangular petals
        c_pt = bm_flowers.verts.new((fx, fy, fz))
        f_norm = mathutils.Vector((nx, ny, 1.0)).normalized()
        up = mathutils.Vector((0, 0, 1))
        tang = f_norm.cross(up).normalized()
        if tang.length < 0.1:
            tang = mathutils.Vector((1, 0, 0))
        bitang = f_norm.cross(tang).normalized()

        petals = 5
        fl_r = 0.048
        petal_tips = []
        for p in range(petals):
            a = (p / petals) * math.pi * 2
            tip_pos = mathutils.Vector((fx, fy, fz)) + (tang * math.cos(a) + bitang * math.sin(a)) * fl_r + f_norm * 0.008
            petal_tips.append(bm_flowers.verts.new(tip_pos))

        for p in range(petals):
            p_next = (p + 1) % petals
            bm_flowers.faces.new((c_pt, petal_tips[p], petal_tips[p_next]))

    mesh_flowers = bpy.data.meshes.new("shrub_bush_flowers_mesh")
    bm_flowers.to_mesh(mesh_flowers)
    bm_flowers.free()
    obj_flowers = bpy.data.objects.new("shrub_bush_flowers", mesh_flowers)
    obj_flowers.data.materials.append(mat_flower)
    obj_flowers.parent = root
    col.objects.link(obj_flowers)

    # 6. Export GLB & Save Blend
    out_dir = r"d:\Projects from me\slavey game\public\models"
    blend_path = os.path.join(out_dir, "shrub_bush.blend")
    glb_path = os.path.join(out_dir, "shrub_bush.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Blend:", blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    obj_stems.select_set(True)
    obj_foliage.select_set(True)
    obj_flowers.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print("Exported GLB:", glb_path)
    print("Bush Model Build Complete!")

build_bush()
