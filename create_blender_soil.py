import bpy
import bmesh
import math
import os

def create_soil_assets():
    print("=== CREATING BLENDER FARM SOIL TILE ===")

    # 1. Clear scene safely
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

    col = bpy.context.scene.collection

    # 2. Materials
    # Dry Soil Material
    mat_dry = bpy.data.materials.new(name="M_Soil_Dry")
    mat_dry.use_nodes = True
    nodes_dry = mat_dry.node_tree.nodes
    links_dry = mat_dry.node_tree.links
    nodes_dry.clear()

    vc_dry = nodes_dry.new(type="ShaderNodeVertexColor")
    vc_dry.layer_name = "Col"
    bsdf_dry = nodes_dry.new(type="ShaderNodeBsdfPrincipled")
    # Warm dusty weathered loam (#5c3d24 = sRGB [0.36, 0.24, 0.14] -> Linear approx [0.10, 0.046, 0.017])
    # In Principled BSDF, we can multiply VC with base color or let VC be the color
    bsdf_dry.inputs["Roughness"].default_value = 0.94
    bsdf_dry.inputs["Metallic"].default_value = 0.0
    out_dry = nodes_dry.new(type="ShaderNodeOutputMaterial")
    links_dry.new(vc_dry.outputs["Color"], bsdf_dry.inputs["Base Color"])
    links_dry.new(bsdf_dry.outputs["BSDF"], out_dry.inputs["Surface"])

    # Watered Soil Material
    mat_watered = bpy.data.materials.new(name="M_Soil_Watered")
    mat_watered.use_nodes = True
    nodes_w = mat_watered.node_tree.nodes
    links_w = mat_watered.node_tree.links
    nodes_w.clear()

    vc_w = nodes_w.new(type="ShaderNodeVertexColor")
    vc_w.layer_name = "Col"
    bsdf_w = nodes_w.new(type="ShaderNodeBsdfPrincipled")
    # Saturated humus (#2a1b10) with soft moisture sheen
    bsdf_w.inputs["Roughness"].default_value = 0.72
    bsdf_w.inputs["Metallic"].default_value = 0.0
    out_w = nodes_w.new(type="ShaderNodeOutputMaterial")
    links_w.new(vc_w.outputs["Color"], bsdf_w.inputs["Base Color"])
    links_w.new(bsdf_w.outputs["BSDF"], out_w.inputs["Surface"])

    # Colors for dry soil:
    # Ridge crest: warm dusty loam
    c_dry_crest = (0.36, 0.24, 0.14, 1.0)
    # Trough: deeper soil
    c_dry_trough = (0.24, 0.15, 0.08, 1.0)
    # Chamfer boundary edge
    c_dry_edge = (0.28, 0.18, 0.10, 1.0)

    # Colors for watered soil:
    c_wet_crest = (0.16, 0.11, 0.06, 1.0)
    c_wet_trough = (0.10, 0.06, 0.03, 1.0)
    c_wet_edge = (0.13, 0.08, 0.04, 1.0)

    # 3. Build Soil Geometry: 1.0m x 1.0m grid with continuous furrows along Y
    bm = bmesh.new()
    col_layer = bm.loops.layers.color.new("Col")

    # Grid resolution: 12 segments in X, 8 segments in Y
    # Along X: [-0.5, 0.5], Along Y: [-0.5, 0.5]
    nx = 12
    ny = 8

    # Function for height based on x
    def get_profile(x):
        # Center ridge at x = 0, furrows at x = +/- 0.25, side ridges at x = +/- 0.40, chamfer at edges +/- 0.50
        ax = abs(x)
        # Base height: 0.035m max
        if ax <= 0.25:
            # Between center and trough: cosine curve from 0.035 to 0.015
            t = ax / 0.25
            z = 0.015 + 0.020 * 0.5 * (1.0 + math.cos(t * math.pi))
            trough_factor = t # 0 at center, 1 at trough
        elif ax <= 0.42:
            # From trough to outer ridge: cosine from 0.015 to 0.030
            t = (ax - 0.25) / 0.17
            z = 0.015 + 0.015 * 0.5 * (1.0 - math.cos(t * math.pi))
            trough_factor = 1.0 - t
        else:
            # Chamfer to edge: from 0.030 down to 0.008
            t = (ax - 0.42) / 0.08
            z = 0.030 - 0.022 * t
            trough_factor = 0.5

        return z, trough_factor

    # Create top surface vertices
    grid_verts = []
    for j in range(ny + 1):
        row = []
        y = -0.5 + (j / ny)
        for i in range(nx + 1):
            x = -0.5 + (i / nx)
            z, trough_factor = get_profile(x)
            
            # Subtle edge chamfer along Y boundary edges (j == 0 or j == ny)
            if j == 0 or j == ny:
                z = max(0.008, z * 0.85)

            v = bm.verts.new((x, y, z))
            row.append((v, trough_factor))
        grid_verts.append(row)

    # Create top faces and assign vertex colors
    for j in range(ny):
        for i in range(nx):
            v00, tf00 = grid_verts[j][i]
            v10, tf10 = grid_verts[j][i+1]
            v11, tf11 = grid_verts[j+1][i+1]
            v01, tf01 = grid_verts[j+1][i]

            f = bm.faces.new((v00, v10, v11, v01))
            for l in f.loops:
                # Interpolate vertex color based on trough factor
                tf = grid_verts[j if l.vert in [v00, v10] else j+1][i if l.vert in [v00, v01] else i+1][1]
                # Dry color gradient
                c = (
                    c_dry_crest[0] * (1.0 - tf) + c_dry_trough[0] * tf,
                    c_dry_crest[1] * (1.0 - tf) + c_dry_trough[1] * tf,
                    c_dry_crest[2] * (1.0 - tf) + c_dry_trough[2] * tf,
                    1.0
                )
                l[col_layer] = c

    # Create side skirt down to z = 0 for clean solid ground contact
    # Bottom perimeter vertices
    bot_south = [bm.verts.new((grid_verts[0][i][0].co.x, -0.5, 0.0)) for i in range(nx + 1)]
    bot_north = [bm.verts.new((grid_verts[ny][i][0].co.x, 0.5, 0.0)) for i in range(nx + 1)]
    bot_west = [bm.verts.new((-0.5, grid_verts[j][0][0].co.y, 0.0)) for j in range(ny + 1)]
    bot_east = [bm.verts.new((0.5, grid_verts[j][nx][0].co.y, 0.0)) for j in range(ny + 1)]

    # Skirt faces
    # South (j = 0)
    for i in range(nx):
        f = bm.faces.new((bot_south[i], bot_south[i+1], grid_verts[0][i+1][0], grid_verts[0][i][0]))
        for l in f.loops: l[col_layer] = c_dry_edge
    # North (j = ny)
    for i in range(nx):
        f = bm.faces.new((grid_verts[ny][i][0], grid_verts[ny][i+1][0], bot_north[i+1], bot_north[i]))
        for l in f.loops: l[col_layer] = c_dry_edge
    # West (i = 0)
    for j in range(ny):
        f = bm.faces.new((bot_west[j+1], bot_west[j], grid_verts[j][0][0], grid_verts[j+1][0][0]))
        for l in f.loops: l[col_layer] = c_dry_edge
    # East (i = nx)
    for j in range(ny):
        f = bm.faces.new((grid_verts[j][nx][0], bot_east[j], bot_east[j+1], grid_verts[j+1][nx][0]))
        for l in f.loops: l[col_layer] = c_dry_edge

    # Bottom face at z = 0
    v_b00 = bot_south[0]
    v_b10 = bot_south[-1]
    v_b11 = bot_north[-1]
    v_b01 = bot_north[0]
    f_bot = bm.faces.new((v_b00, v_b01, v_b11, v_b10))
    for l in f_bot.loops: l[col_layer] = c_dry_edge

    # Create mesh & object
    mesh_soil = bpy.data.meshes.new("farm_soil_tile_mesh")
    bm.to_mesh(mesh_soil)
    bm.free()

    obj_soil = bpy.data.objects.new("farm_soil_tile", mesh_soil)
    obj_soil.data.materials.append(mat_dry)
    obj_soil.data.materials.append(mat_watered)
    col.objects.link(obj_soil)

    # Smooth shading
    bpy.context.view_layer.objects.active = obj_soil
    obj_soil.select_set(True)
    bpy.ops.object.shade_smooth()

    # Save and Export
    out_dir = r"d:\Projects from me\slavey game\public\models"
    os.makedirs(out_dir, exist_ok=True)

    blend_path = os.path.join(out_dir, "farm_soil_tile.blend")
    glb_path = os.path.join(out_dir, "farm_soil_tile.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[SUCCESS] Saved Soil Tile Blend to {blend_path}")

    bpy.ops.object.select_all(action='DESELECT')
    obj_soil.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    print(f"[SUCCESS] Exported Soil Tile GLB to {glb_path} (Size: {os.path.getsize(glb_path)} bytes)")

create_soil_assets()
