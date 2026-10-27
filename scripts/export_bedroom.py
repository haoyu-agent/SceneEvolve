"""Run with Blender --background --python scripts/export_bedroom.py.

Keep source projects intact; export visible geometry for the web comparison.
The three viewers share the Ours camera's viewing direction and lens, with
targets offset for each project's different room origin.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1] / 'data' / 'bedroom'
bpy.ops.wm.open_mainfile(filepath=str(root / 'kimik3.1_wours.blend'))
camera = bpy.context.scene.camera
forward = camera.matrix_world.to_quaternion() @ Vector((0, 0, -1))
aspect = bpy.context.scene.render.resolution_x / bpy.context.scene.render.resolution_y
fov = math.degrees(2 * math.atan(camera.data.sensor_width / (2 * camera.data.lens * aspect)))
offset = (-forward.x, -forward.z, forward.y)
yaw = math.degrees(math.atan2(offset[0], offset[2]))
pitch = math.degrees(math.acos(offset[1]))
radius = 4.2
positions = {'astra': Vector((0.35, -0.7, 1.52))}


def bake_procedural_colors(scene, name):
    # glTF cannot store Blender Noise/Color Ramp/Checker shader graphs. Bake
    # their base colors so walls and bedding don't become white in the browser.
    materials = {
        mat for obj in bpy.context.selected_objects for mat in obj.data.materials
        if mat and mat.use_nodes
    }
    procedural = {
        mat for mat in materials
        if any(node.type == 'BSDF_PRINCIPLED' and node.inputs['Base Color'].is_linked
               for node in mat.node_tree.nodes)
    }
    if not procedural:
        return
    objects = [obj for obj in bpy.context.selected_objects
               if any(mat in procedural for mat in obj.data.materials)]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name='WebColors')
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    image = bpy.data.images.new(name + '_base_color', width=2048, height=2048)
    for mat in materials:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        mat.node_tree.nodes.active = node
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 1
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 8
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
    for mat in procedural:
        nodes = mat.node_tree.nodes
        texture = nodes.active
        for node in nodes:
            if node.type == 'BSDF_PRINCIPLED':
                mat.node_tree.links.new(texture.outputs['Color'], node.inputs['Base Color'])
    image.pack()


for name in ('kimik3.1', 'kimik3.1_wours'):
    bpy.ops.wm.open_mainfile(filepath=str(root / (name + '.blend')))
    scene = bpy.context.scene
    positions[name] = scene.camera.matrix_world.translation.copy()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if obj.type == 'MESH' and not obj.hide_render:
            obj.hide_set(False)
            obj.select_set(True)
    bake_procedural_colors(scene, name)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if obj.type == 'MESH' and not obj.hide_render:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(root / (name + '.glb')), export_format='GLB',
        use_selection=True, export_apply=True, export_cameras=False,
        export_lights=False, export_animations=False)

views = {}
for name, position in positions.items():
    target = position + forward * radius
    views[name] = {
        'target': [round(target.x, 5), round(target.z, 5), round(-target.y, 5)],
        'yaw': round(yaw, 5), 'pitch': round(pitch, 5),
        'radius': radius, 'fov': round(fov, 5),
    }
(root / 'views.json').write_text(json.dumps(views, indent=2) + '\n')
print('BEDROOM_VIEWS', json.dumps(views))
