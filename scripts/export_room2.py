"""Run with Blender --background --python scripts/export_room2.py."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[1] / 'data' / 'room2'
views = {}
for name in ('astra', 'kimi', 'kimi_wours'):
    bpy.ops.wm.open_mainfile(filepath=str(root / (name + '.blend')))
    scene = bpy.context.scene
    camera = scene.camera
    position = camera.matrix_world.translation
    forward = camera.matrix_world.to_quaternion() @ Vector((0, 0, -1))
    distance = 4.2
    target = position + forward * distance
    # Blender Z-up -> glTF Y-up.
    target_gltf = (target.x, target.z, -target.y)
    offset = (-forward.x, -forward.z, forward.y)
    yaw = math.degrees(math.atan2(offset[0], offset[2]))
    pitch = math.degrees(math.acos(max(-1, min(1, offset[1]))))
    aspect = scene.render.resolution_x / scene.render.resolution_y
    sensor_width = camera.data.sensor_width
    fov = math.degrees(2 * math.atan(sensor_width / (2 * camera.data.lens * aspect)))
    views[name] = {'target': ' '.join(f'{v:.4f}m' for v in target_gltf),
                   'yaw': round(yaw, 4), 'pitch': round(pitch, 4),
                   'radius': distance, 'fov': round(fov, 4)}
    # Pull back Ours to match the other two viewers' room coverage.
    if name == 'kimi_wours':
        views[name].update(pitch=84, radius=6)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if obj.type == 'MESH' and not obj.hide_render:
            obj.hide_set(False)
            obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(root / (name + '.glb')),
        export_format='GLB', use_selection=True, export_apply=True,
        export_cameras=False, export_lights=False, export_animations=False)
(root / 'views.json').write_text(json.dumps(views, indent=2) + '\n')
print('ROOM2_VIEWS', json.dumps(views))
