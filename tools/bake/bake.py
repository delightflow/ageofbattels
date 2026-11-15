"""Age of Battels sprite baker.

Builds every unit, building and piece of scenery as a small 3D model in Blender, poses it,
and renders pre-rendered isometric sprites (the way classic RTS games did), plus a
team-colour mask so the game can paint any of the eight player colours.

Run with Blender's Python module (pip install bpy):
    python tools/bake/bake.py -- <out_dir> [ids...]
Outputs <out_dir>/<id>.webp (colour) and <id>_m.webp (team mask) and merges <out_dir>/manifest.json.
"""
import bpy, bmesh, math, sys, os, json, time
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else os.path.join(HERE, '..', '..', 'assets'))
ONLY = ARGS[1:]
LOOKS = json.load(open(os.path.join(HERE, 'looks.json')))
R = math.radians
SS = 2                      # render scale over the game's world pixels
PX = 45.2548 * SS           # pixels per Blender unit across the screen (one tile diagonal = 64 game px)
M = 0.46                    # Blender units per metre: a man is about 0.83 tiles tall (chunky, readable at RTS zoom)

# view directions: model yaw (degrees) for the five rendered facings; the other three are mirrored in game
YAWS = [45, 90, 135, 180, 225]          # the camera mirrors the game's axes: these rows face up, up-left, left, down-left, down on screen
FRAMES = ['idle'] + ['w%d' % i for i in range(8)] + ['a%d' % i for i in range(6)] + ['d%d' % i for i in range(5)]
ATK_T = [0.08, 0.24, 0.4, 0.54, 0.7, 0.88]

# cell in game pixels: width, height, anchor x, anchor y (feet)
CELL = {'human': (112, 124, 56, 92), 'rider': (150, 136, 75, 104), 'elephant': (190, 168, 95, 130), 'wolf': (76, 64, 38, 48),
        'siege': (136, 116, 68, 86), 'trebuchet': (200, 224, 100, 186), 'b1': (84, 132, 42, 108), 'b3': (216, 260, 108, 200),
        'tree': (64, 96, 32, 84), 'rock': (48, 40, 24, 28), 'bones': (48, 32, 24, 20), 'rubble1': (84, 60, 42, 40), 'rubble3': (216, 130, 108, 84)}

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

# ------------------------------------------------------------------ scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 1; sc.cycles.transparent_max_bounces = 2
    sc.render.filter_size = 1.2
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.15
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = srgb('#9db4cf'); bg.inputs['Strength'].default_value = 0.55
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 3.4; sun.data.angle = R(10); sun.data.color = (1.0, 0.95, 0.86)
    sun.rotation_euler = Euler((R(32), 0, R(-80)))          # high sun from the upper left: short, soft shadows
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.location = (-30, -30, 30 * math.sqrt(2) * math.tan(R(30))); cam.rotation_euler = Euler((R(60), 0, R(-45)))
    cam.data.clip_start = 0.1; cam.data.clip_end = 200
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0)); g = bpy.context.object; g.name = 'ground'; g.is_shadow_catcher = True
    return sc

def set_cell(sc, kind):
    w, h, ax, ay = CELL[kind]; cam = sc.camera
    sc.render.resolution_x = w * SS; sc.render.resolution_y = h * SS; sc.render.resolution_percentage = 100
    big = max(w, h); cam.data.ortho_scale = big * SS / PX
    cam.data.shift_x = (w / 2 - ax) / big; cam.data.shift_y = (ay - h / 2) / big

# ------------------------------------------------------------------ materials
MATS = {}
PALETTE = {
    'skin': ('#d9a37c', 0, .62), 'skin2': ('#b9825a', 0, .62), 'hair': ('#4a3324', 0, .8), 'cloth': ('#7a6650', 0, .9), 'cloth2': ('#e8e0cc', 0, .9),
    'leather': ('#7a5131', 0, .7), 'leather2': ('#5a3a22', 0, .7), 'boot': ('#3a2a1e', 0, .65), 'mail': ('#8d939b', .75, .45), 'plate': ('#c4cbd3', .9, .28),
    'steel': ('#cfd5dc', 1, .22), 'dsteel': ('#5d636c', .85, .4), 'bronze': ('#b8863a', 1, .32), 'gold': ('#e0b648', 1, .25), 'wood': ('#8c6239', 0, .75),
    'dwood': ('#5b3d24', 0, .8), 'lwood': ('#b58a58', 0, .75), 'rope': ('#b9a27a', 0, .9), 'black': ('#26221f', 0, .5), 'lacquer': ('#2a2422', .2, .3),
    'white': ('#efe9dc', 0, .85), 'red': ('#a8302a', 0, .8), 'iron': ('#4a4b4f', .8, .45), 'horse': ('#7a4f32', 0, .72), 'horse2': ('#4a3426', 0, .72),
    'horse3': ('#c9b79a', 0, .72), 'horse4': ('#8e8a84', 0, .72), 'camel': ('#c49a62', 0, .8), 'ele': ('#7f7b7c', 0, .85), 'ivory': ('#efe6cf', 0, .5),
    'wolf': ('#77777c', 0, .9), 'fur': ('#6a4a2e', 0, 1), 'jag': ('#d49c3a', 0, .8), 'feather': ('#f2eee4', 0, .9), 'green': ('#2f8f6a', 0, .7),
    'stone': ('#a9a499', 0, .9), 'stone2': ('#8f8a80', 0, .9), 'roof': ('#6b4a36', 0, .85), 'canvas': ('#e7dcc3', 0, .95), 'leaf': ('#4d8a3a', 0, .9),
    'leaf2': ('#3d7432', 0, .9), 'pine': ('#2f5f38', 0, .9), 'snow': ('#f4f7fa', 0, .7), 'bark': ('#5e4430', 0, 1), 'rock': ('#8c8880', 0, .9),
    'bone': ('#e2dacb', 0, .7), 'fire': ('#ffb04a', 0, 1), 'blood': ('#5a0e0a', 0, .4), 'obsid': ('#1b1820', .3, .2),
}
TEAM = set()                                 # names of materials that carry the player colour
BUILDERS, SCENERY = {}, {}
def mat(name):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name)
    if not m.node_tree: m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    if name.startswith('team'):              # team colour: rendered white, tinted in game through the mask
        shade = {'team': 1.0, 'team2': 0.62, 'team3': 0.82}[name]
        b.inputs['Base Color'].default_value = (shade, shade, shade, 1); b.inputs['Roughness'].default_value = .8; TEAM.add(name)
    else:
        col, met, rough = PALETTE[name]
        b.inputs['Base Color'].default_value = srgb(col); b.inputs['Metallic'].default_value = met; b.inputs['Roughness'].default_value = rough
    if name in ('stone', 'stone2', 'rock', 'bark', 'roof'):   # a little surface noise
        nt = m.node_tree; n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 9; mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        mix.inputs['Factor'].default_value = .35; mix.inputs['A'].default_value = srgb(PALETTE[name][0]); mix.inputs['B'].default_value = srgb('#5a554d')
        nt.links.new(n.outputs['Fac'], mix.inputs['Factor']); nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    if name == 'jag':                         # jaguar spots
        nt = m.node_tree; v = nt.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = 22; ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = .18; ramp.color_ramp.elements[0].color = srgb('#2a1a0e'); ramp.color_ramp.elements[1].position = .22; ramp.color_ramp.elements[1].color = srgb('#d49c3a')
        nt.links.new(v.outputs['Distance'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    if name == 'fire':
        b.inputs['Emission Color'].default_value = srgb('#ff9a3a'); b.inputs['Emission Strength'].default_value = 6
    MATS[name] = m; return m

# ------------------------------------------------------------------ geometry helpers (all sizes in metres, scaled by the root)
COLL = None
def link(o): bpy.context.scene.collection.objects.link(o); return o
def node(name, parent, loc):
    e = link(bpy.data.objects.new(name, None)); e.parent = parent; e.location = loc; e.empty_display_size = .05; return e
def wpos(o):
    bpy.context.view_layer.update(); return o.matrix_world.translation.copy()
def attach(o, parent, smooth=True, bevel=0):
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if bevel:
        md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'ANGLE'
    if parent is not None:
        bpy.context.view_layer.update(); mw = o.matrix_world.copy(); o.parent = parent; o.matrix_world = mw
    return o
def mesh_from_bm(bm, name, m):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = link(bpy.data.objects.new(name, me)); o.data.materials.append(mat(m)); return o
def box(parent, loc, size, m, rot=(0, 0, 0), bevel=.012, smooth=False):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    o = mesh_from_bm(bm, 'box', m); o.location = loc; o.rotation_euler = rot; return attach(o, parent, smooth, bevel)
def sphere(parent, loc, r, m, scale=(1, 1, 1), seg=14, rings=9, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    o = mesh_from_bm(bm, 'sph', m); o.location = loc; o.scale = scale; o.rotation_euler = rot; return attach(o, parent)
def cyl(parent, p1, p2, r1, m, r2=None, seg=12, caps=True):
    p1, p2 = Vector(p1), Vector(p2); d = p2 - p1; L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1, radius2=r1 if r2 is None else r2, depth=L)
    o = mesh_from_bm(bm, 'cyl', m); o.location = (p1 + p2) / 2
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized()); return attach(o, parent)
def limb(parent, p1, p2, r, m, r2=None):
    cyl(parent, p1, p2, r, m, r2); sphere(parent, p1, r, m, seg=10, rings=6); sphere(parent, p2, r2 or r, m, seg=10, rings=6)
def cone(parent, base, tip, r, m, seg=12): return cyl(parent, base, tip, r, m, r2=0.0005, seg=seg)
def disc(parent, loc, r, th, m, axis='x', seg=20, rot=None):
    p = Vector(loc); a = {'x': Vector((th / 2, 0, 0)), 'y': Vector((0, th / 2, 0)), 'z': Vector((0, 0, th / 2))}[axis]
    return cyl(parent, p - a, p + a, r, m, seg=seg)
def torus(parent, loc, R1, r1, m, rot=(0, 0, 0)):
    bm = bmesh.new(); seg, ring = 18, 8
    verts = [[bm.verts.new(((R1 + r1 * math.cos(v * 2 * math.pi / ring)) * math.cos(u * 2 * math.pi / seg), (R1 + r1 * math.cos(v * 2 * math.pi / ring)) * math.sin(u * 2 * math.pi / seg), r1 * math.sin(v * 2 * math.pi / ring))) for v in range(ring)] for u in range(seg)]
    for u in range(seg):
        for v in range(ring): bm.faces.new((verts[u][v], verts[(u + 1) % seg][v], verts[(u + 1) % seg][(v + 1) % ring], verts[u][(v + 1) % ring]))
    o = mesh_from_bm(bm, 'tor', m); o.location = loc; o.rotation_euler = rot; return attach(o, parent)
def prism(parent, pts2d, depth, m, loc, rot=(0, 0, 0), bevel=.006):
    """an extruded 2D outline (x, z) along y"""
    bm = bmesh.new(); a = [bm.verts.new((x, -depth / 2, z)) for x, z in pts2d]; b = [bm.verts.new((x, depth / 2, z)) for x, z in pts2d]
    bm.faces.new(a[::-1]); bm.faces.new(b); n = len(pts2d)
    for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm(bm, 'pri', m); o.location = loc; o.rotation_euler = rot; return attach(o, parent, False, bevel)

# ------------------------------------------------------------------ people
# armour: torso, sleeves, legs, skirt, extras
ARMOUR = {
    'cloth':  dict(t='team', s='team2', l='cloth', k='team', belt='leather'),
    'leather': dict(t='leather', s='team', l='leather2', k='leather', tab='team', belt='leather2'),
    'mail':   dict(t='mail', s='mail', l='mail', k='mail', tab='team', belt='leather'),
    'plate':  dict(t='plate', s='plate', l='plate', k='plate', tab='team', belt='leather2', paul='plate'),
    'robe':   dict(t='team', s='team', l='team', k=None, robe='team', belt='rope'),
    'bare':   dict(t='skin', s='skin', l='leather2', k='leather2', sash='team', belt='leather'),
    'lorica': dict(t='steel', s='team', l='skin', k='team', bands='dsteel', strips='leather', belt='leather', paul='steel'),
    'linothorax': dict(t='cloth2', s='skin', l='skin', k='team', strips='team', belt='team'),
    'osode':  dict(t='lacquer', s='team2', l='black', k='lacquer', laces='team', paul='lacquer', wide=1),
    'lamellar': dict(t='dsteel', s='team', l='leather2', k='dsteel', laces='team', belt='leather'),
    'slashed': dict(t='team', s='team', l='team', k='team', slash='cloth2', puff=1, belt='leather2'),
    'jaguar': dict(t='jag', s='jag', l='jag', k='jag', belt='team'),
    'deel':   dict(t='team', s='team', l='leather2', k='team', coat=1, trim='fur', belt='leather'),
}
SLASH = {'sword', 'greatsword', 'axes', 'axe', 'club', 'macuahuitl', 'katana', 'zweihander'}
TWOHAND = {'greatsword', 'zweihander', 'katana', 'pike', 'sarissa', 'crossbow', 'repeater', 'musket'}

def torso_shape(parent, z0, z1, wb, wt, d, m, bevel=.045):
    """a slightly tapered, rounded torso block between heights z0 and z1"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        top = v.co.z > 0; w = wt if top else wb
        v.co = Vector((v.co.x * d * (1.05 if top else 0.92), v.co.y * w, z0 + (v.co.z + .5) * (z1 - z0)))
    o = mesh_from_bm(bm, 'torso', m); md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 3
    sub = o.modifiers.new('s', 'SUBSURF'); sub.levels = 1; sub.render_levels = 1
    return attach(o, parent)

def human(look, root, mounted=False):
    J = {}; A = ARMOUR[look.get('armor', 'cloth')]
    body = J['body'] = node('body', root, (0, 0, 0))
    hips = J['hips'] = node('hips', body, (0, 0, 0.95))
    spine = J['spine'] = node('spine', hips, (0, 0, 0.04))
    neck = J['neck'] = node('neck', spine, (0, 0, 0.5))
    head = J['head'] = node('head', neck, (0, 0, 0.13))
    for s, sy in (('R', -1), ('L', 1)):
        sh = J['sh' + s] = node('sh' + s, spine, (0, sy * 0.205, 0.41))
        el = J['el' + s] = node('el' + s, sh, (0, 0, -0.29))
        J['h' + s] = node('h' + s, el, (0, 0, -0.27))
        hp = J['hip' + s] = node('hip' + s, hips, (0, sy * 0.1, -0.03))
        J['kn' + s] = node('kn' + s, hp, (0, 0, -0.43))
    bpy.context.view_layer.update()
    W = lambda n: wpos(J[n])
    # legs
    for s in 'RL':
        hp, kn = W('hip' + s), W('kn' + s); ft = kn + Vector((0, 0, -0.41))
        if not A.get('robe'):
            limb(J['hip' + s], hp, kn, .088 if not A.get('wide') else .11, A['l'], .074)
            limb(J['kn' + s], kn, ft + Vector((0, 0, .05)), .072, A['l'], .06)
            box(J['kn' + s], ft + Vector((.045, 0, .0)), (.24, .1, .085), 'boot' if A['l'] != 'skin' else 'leather', bevel=.025)
            if A['l'] == 'skin': cyl(J['kn' + s], kn + Vector((0, 0, -0.16)), ft + Vector((0, 0, .04)), .068, 'leather')
        else:
            box(J['kn' + s], ft + Vector((.05, 0, .0)), (.22, .09, .07), 'boot', bevel=.02)
    # pelvis, skirt and torso
    box(hips, W('hips') + Vector((0, 0, -0.02)), (.25, .34, .2), A['l'] if not A.get('robe') else A['t'], bevel=.05)
    if A.get('robe'):
        cyl(hips, W('hips') + Vector((0, 0, .05)), Vector((0, 0, 0.04)), .2, A['robe'], r2=.3, seg=16)
    elif A.get('coat'):
        cyl(hips, W('hips') + Vector((0, 0, .05)), W('hips') + Vector((0, 0, -0.5)), .19, A['t'], r2=.24, seg=16)
        cyl(hips, W('hips') + Vector((0, 0, -0.47)), W('hips') + Vector((0, 0, -0.54)), .245, A['trim'], seg=16)
    elif A.get('k'):
        cyl(hips, W('hips') + Vector((0, 0, .04)), W('hips') + Vector((0, 0, -0.26)), .18, A['k'], r2=.215, seg=16)
    if A.get('strips'):
        for i in range(9):
            a = -math.pi * .9 + i * math.pi * 1.8 / 8
            box(hips, W('hips') + Vector((math.cos(a) * .2, math.sin(a) * .2, -0.2)), (.03, .055, .2), A['strips'], rot=(0, 0, a), bevel=.004)
    sp = W('spine')
    torso_shape(spine, sp.z - 0.06, sp.z + 0.52, .185, .225, .27, A['t'])
    if A.get('tab'): box(spine, sp + Vector((.112, 0, .2)), (.03, .2, .5), A['tab'], bevel=.01); box(spine, sp + Vector((-.112, 0, .2)), (.03, .2, .5), A['tab'], bevel=.01)
    if A.get('bands'):
        for k in range(4): torus(spine, sp + Vector((0, 0, .1 + k * .085)), .19, .014, A['bands'], rot=(0, 0, 0))
    if A.get('laces'):
        for k in range(5): box(spine, sp + Vector((.118, 0, .05 + k * .085)), (.015, .3, .022), A['laces'], bevel=.003)
    if A.get('slash'):
        for yy in (-.11, 0, .11): box(spine, sp + Vector((.112, yy, .22)), (.02, .045, .42), A['slash'], bevel=.006)
    if A.get('sash'): box(spine, sp + Vector((.11, 0, .25)), (.02, .07, .55), A['sash'], rot=(R(40), 0, 0), bevel=.006)
    if A.get('belt'): torus(spine, sp + Vector((0, 0, -0.01)), .175, .028, A['belt'])
    if A.get('paul'):
        for s, sy in (('R', -1), ('L', 1)): sphere(J['sh' + s], W('sh' + s) + Vector((0, sy * .03, .02)), .1, A['paul'], scale=(1.1, 1, .7))
    cyl(spine, sp + Vector((0, 0, .45)), W('head') + Vector((0, 0, -0.06)), .055, 'skin')
    # arms
    for s in 'RL':
        sh, el, h = W('sh' + s), W('el' + s), W('h' + s)
        limb(J['sh' + s], sh, el, .08 if not A.get('puff') else .1, A['s'], .068)
        limb(J['el' + s], el, h + Vector((0, 0, .03)), .063, A['s'] if A['s'] not in ('team2',) else 'team2', .055)
        sphere(J['h' + s], h, .055, 'skin' if A['s'] not in ('plate',) else 'plate')
    # head
    hc = W('head'); sphere(head, hc, .118, 'skin', scale=(1, .92, 1.05))
    box(head, hc + Vector((.115, 0, -0.005)), (.04, .03, .05), 'skin', bevel=.012)
    helmet(head, hc, look.get('helm', 'none'))
    # gear
    weapon(J, look.get('wpn'))
    if look.get('shield'): shield(J, look['shield'])
    if look.get('cape'):
        prism(spine, [(-.12, .48), (-.13, .2), (-.24, -.55), (-.18, -.6), (-.14, -.58)], .44, 'team', sp + Vector((0, 0, 0)), bevel=.01)
    if look.get('cross'):
        box(spine, sp + Vector((.125, 0, .22)), (.02, .24, .46), 'white', bevel=.006); box(spine, sp + Vector((.14, 0, .28)), (.01, .05, .3), 'red', bevel=0); box(spine, sp + Vector((.14, 0, .32)), (.01, .2, .05), 'red', bevel=0)
        prism(spine, [(-.12, .48), (-.13, .2), (-.24, -.55), (-.18, -.6), (-.14, -.58)], .44, 'white', sp, bevel=.01)
    if look.get('wings'):
        for sy in (-1, 1):
            pts = [Vector((-.16, sy * .1, .1)), Vector((-.24, sy * .14, .55)), Vector((-.2, sy * .16, .95)), Vector((-.06, sy * .14, 1.2))]
            for a, b in zip(pts, pts[1:]): cyl(spine, sp + a, sp + b, .02, 'dwood', seg=6)
            for k in range(9):
                q = pts[0].lerp(pts[3], k / 8); box(spine, sp + q + Vector((-.06, 0, 0)), (.14, .02, .045), 'feather', rot=(0, R(-30 + k * 6), 0), bevel=.01)
    if look.get('banner'):
        cyl(spine, sp + Vector((-.16, .12, -.2)), sp + Vector((-.16, .12, 1.5)), .018, 'wood')
        prism(spine, [(0, 0), (.0, -.42), (-.5, -.36), (-.36, -.2), (-.5, -.05)], .015, 'team', sp + Vector((-.17, .12, 1.48)), rot=(0, 0, 0))
    J['look'] = look; J['mounted'] = mounted
    return J

def helmet(head, c, h):
    V = lambda x, y, z: c + Vector((x, y, z))
    if h in ('none', 'horn'): sphere(head, V(-.01, 0, .03), .123, 'hair', scale=(1.02, .97, .95))
    if h == 'none': return
    if h == 'cap': sphere(head, V(0, 0, .045), .128, 'team', scale=(1.04, 1, .78)); torus(head, V(0, 0, .02), .118, .018, 'team2')
    elif h == 'kettle': sphere(head, V(0, 0, .05), .13, 'steel', scale=(1, 1, .9)); disc(head, V(0, 0, .02), .22, .015, 'steel', axis='z', seg=24)
    elif h == 'nasal': cone(head, V(0, 0, .0), V(0, 0, .2), .13, 'steel', seg=16); box(head, V(.13, 0, -.02), (.015, .02, .09), 'steel')
    elif h == 'great': cyl(head, V(0, 0, -.13), V(0, 0, .12), .135, 'plate', seg=16); disc(head, V(0, 0, .13), .135, .02, 'plate', axis='z'); box(head, V(.135, 0, .01), (.01, .17, .018), 'black', bevel=0); box(head, V(.135, 0, -.04), (.01, .015, .06), 'black', bevel=0); sphere(head, V(-.02, 0, .2), .06, 'team', scale=(1.4, .5, 1.2))
    elif h == 'hood': sphere(head, V(-.015, 0, .02), .148, 'team', scale=(1.05, 1, 1.05)); cyl(head, V(-.05, 0, -.12), V(-.03, 0, -.2), .15, 'team', r2=.17)
    elif h == 'turban': torus(head, V(0, 0, .05), .1, .05, 'white'); sphere(head, V(0, 0, .09), .1, 'white', scale=(1, 1, .6)); sphere(head, V(.12, 0, .07), .025, 'team')
    elif h == 'fur': cyl(head, V(0, 0, .02), V(0, 0, .15), .14, 'fur', r2=.13); sphere(head, V(0, 0, .15), .1, 'team', scale=(1, 1, .5))
    elif h == 'hat': disc(head, V(0, 0, .05), .23, .02, 'black', axis='z', seg=24); cyl(head, V(0, 0, .05), V(0, 0, .2), .11, 'black', r2=.1); torus(head, V(0, 0, .08), .11, .015, 'team'); cyl(head, V(-.02, .08, .1), V(-.2, .14, .32), .02, 'feather', r2=.005)
    elif h == 'horn':
        sphere(head, V(0, 0, .04), .128, 'dsteel', scale=(1, 1, .85))
        for sy in (-1, 1): cyl(head, V(0, sy * .11, .08), V(0, sy * .2, .14), .035, 'ivory', r2=.025); cyl(head, V(0, sy * .2, .14), V(.02, sy * .23, .27), .025, 'ivory', r2=.006)
    elif h == 'galea':
        sphere(head, V(0, 0, .04), .13, 'steel', scale=(1, 1, .9)); box(head, V(.03, -.11, -.06), (.08, .015, .1), 'steel'); box(head, V(.03, .11, -.06), (.08, .015, .1), 'steel')
        box(head, V(-.13, 0, -.04), (.02, .2, .06), 'steel'); prism(head, [(-.1, 0), (-.06, .08), (.04, .1), (.12, .05), (.1, 0)], .035, 'red', V(0, 0, .12))
    elif h == 'corinth':
        sphere(head, V(0, 0, .0), .14, 'bronze', scale=(1.02, 1, 1.15)); box(head, V(.13, 0, .02), (.02, .13, .025), 'black', bevel=0); box(head, V(.135, 0, -.05), (.02, .025, .09), 'black', bevel=0)
        prism(head, [(-.2, 0), (-.16, .12), (.0, .16), (.14, .1), (.12, 0)], .04, 'team', V(0, 0, .14))
    elif h == 'phrygian': sphere(head, V(0, 0, .04), .13, 'bronze', scale=(1, 1, .95)); sphere(head, V(.06, 0, .15), .07, 'bronze', scale=(1.3, .8, .9)); box(head, V(.04, -.12, -.06), (.07, .015, .09), 'bronze'); box(head, V(.04, .12, -.06), (.07, .015, .09), 'bronze')
    elif h == 'gogu':
        cone(head, V(0, 0, -.0), V(0, 0, .2), .135, 'dsteel', seg=16); cyl(head, V(0, 0, .19), V(-.03, 0, .32), .012, 'gold'); sphere(head, V(-.04, 0, .33), .04, 'team', scale=(1, .6, 1.5))
        cyl(head, V(-.03, 0, -.02), V(-.05, 0, -.16), .14, 'dsteel', r2=.16)
    elif h == 'kabuto':
        sphere(head, V(0, 0, .04), .135, 'lacquer', scale=(1, 1, .85)); cyl(head, V(-.01, 0, .0), V(-.04, 0, -.11), .15, 'lacquer', r2=.22, seg=18)
        torus(head, V(-.025, 0, -.06), .19, .012, 'team'); disc(head, V(.12, 0, .06), .03, .01, 'gold', axis='x')
        for sy in (-1, 1): cyl(head, V(.13, sy * .02, .07), V(.17, sy * .13, .27), .012, 'gold', r2=.004)
    elif h == 'mongol': cone(head, V(0, 0, .0), V(0, 0, .24), .13, 'steel', seg=14); torus(head, V(0, 0, .0), .13, .035, 'fur'); cyl(head, V(0, 0, .23), V(-.02, 0, .32), .01, 'team', r2=.02)
    elif h == 'jaguar':
        sphere(head, V(.01, 0, .06), .155, 'jag', scale=(1.1, 1, .9))
        box(head, V(.15, 0, .07), (.12, .13, .07), 'jag', bevel=.03); box(head, V(.18, 0, .02), (.08, .1, .02), 'ivory', bevel=.008)
        for sy in (-1, 1): sphere(head, V(-.02, sy * .09, .17), .04, 'jag', scale=(1, .5, 1))
    elif h == 'morion':
        sphere(head, V(0, 0, .05), .13, 'steel', scale=(1, 1, .85)); disc(head, V(0, 0, .02), .2, .012, 'steel', axis='z', seg=24)
        prism(head, [(-.12, 0), (-.08, .09), (.06, .1), (.12, 0)], .02, 'steel', V(0, 0, .1)); torus(head, V(0, 0, .03), .19, .012, 'steel')
    elif h == 'jingasa':
        cone(head, V(0, 0, .03), V(0, 0, .15), .24, 'lacquer', seg=20); disc(head, V(0, 0, .12), .04, .02, 'team', axis='z')
    elif h == 'beret':
        disc(head, V(-.01, 0, .09), .2, .045, 'team', axis='z', seg=22); sphere(head, V(-.01, 0, .1), .17, 'team2', scale=(1, 1, .3))
        for k in range(3): cyl(head, V(-.06, .12, .12), V(-.25 + k * .04, .2 + k * .03, .36 - k * .04), .018, 'feather' if k != 1 else 'team', r2=.004)

def weapon(J, w):
    hR, hL = J['hR'], J['hL']; c = wpos(hR); V = lambda x, y, z: c + Vector((x, y, z)); J['wpn'] = []
    def keep(o): J['wpn'].append(o); return o
    if w in ('sword', 'greatsword', 'zweihander', 'katana'):
        L = {'sword': .78, 'greatsword': 1.1, 'zweihander': 1.3, 'katana': .9}[w]; g = .1 if w == 'sword' else .26
        cyl(hR, V(-g, 0, 0), V(.06, 0, 0), .022, 'leather2'); box(hR, V(.07, 0, 0), (.03, .22 if w != 'katana' else .07, .035), 'gold' if w != 'katana' else 'black')
        if w == 'katana':
            for k in range(3): box(hR, V(.12 + k * .27, 0, .01 + k * k * .012), (.28, .012, .04), 'steel', rot=(0, R(-2 - k * 3), 0), bevel=.003)
        else: box(hR, V(.09 + L / 2, 0, 0), (L, .012, .06 if w == 'sword' else .075), 'steel', bevel=.004); cone(hR, V(.09 + L, 0, 0), V(.16 + L, 0, 0), .035, 'steel', seg=4)
        if w == 'zweihander': box(hR, V(.3, 0, 0), (.02, .12, .02), 'gold')
    elif w in ('axes', 'axe', 'francisca'):
        L = .55 if w != 'francisca' else .38
        keep(cyl(hR, V(-.12, 0, 0), V(L, 0, 0), .02, 'wood'))
        keep(prism(hR, [(0, 0), (.06, .02), (.1, .14), (-.06, .12), (-.03, .03)], .02, 'steel', V(L - .06, 0, .0), rot=(R(90), 0, 0)))
        if w == 'axes':
            c2 = wpos(hL); cyl(hL, c2 + Vector((-.12, 0, 0)), c2 + Vector((L, 0, 0)), .02, 'wood')
            prism(hL, [(0, 0), (.06, .02), (.1, .14), (-.06, .12), (-.03, .03)], .02, 'steel', c2 + Vector((L - .06, 0, 0)), rot=(R(90), 0, 0))
    elif w == 'club': cyl(hR, V(-.1, 0, 0), V(.6, 0, 0), .03, 'wood', r2=.06)
    elif w == 'macuahuitl':
        cyl(hR, V(-.12, 0, 0), V(.08, 0, 0), .022, 'wood'); box(hR, V(.42, 0, 0), (.7, .025, .1), 'lwood', bevel=.01)
        for k in range(6):
            for sz in (-1, 1): cone(hR, V(.16 + k * .1, 0, sz * .05), V(.16 + k * .1, 0, sz * .09), .022, 'obsid', seg=4)
    elif w in ('spear', 'fork', 'pike', 'sarissa', 'javelin'):
        a, b = {'spear': (-.6, 1.45), 'fork': (-.6, 1.25), 'pike': (-1.2, 3.0), 'sarissa': (-1.4, 4.1), 'javelin': (-.35, .9)}[w]
        keep(cyl(hR, V(0, 0, -a), V(0, 0, -b), .019 if w != 'javelin' else .014, 'wood', seg=8))
        if w == 'fork':
            box(hR, V(0, 0, -b), (.02, .16, .02), 'iron')
            for yy in (-.07, 0, .07): cyl(hR, V(0, yy, -b), V(0, yy, -b - .22), .008, 'iron', seg=6)
        else: keep(cone(hR, V(0, 0, -b), V(0, 0, -b - (.2 if w != 'javelin' else .14)), .035, 'steel', seg=6))
    elif w == 'lance':
        cyl(hR, V(0, 0, .7), V(0, 0, -2.7), .03, 'cloth2', r2=.018, seg=10); cone(hR, V(0, 0, -.12), V(0, 0, .12), .08, 'steel', seg=12)
        cone(hR, V(0, 0, -2.7), V(0, 0, -2.86), .03, 'steel', seg=6); prism(hR, [(0, 0), (0, .2), (-.36, .1)], .01, 'team', V(0, 0, -2.5), rot=(R(90), 0, R(90)))
    elif w in ('bow', 'longbow'):
        k = 1.45 if w == 'longbow' else 1; c2 = wpos(hL); pts = [(x * k, z * k) for x, z in [(-.62, .1), (-.45, .03), (-.2, -.03), (0, -.05), (.2, -.03), (.45, .03), (.62, .1)]]
        for (x1, z1), (x2, z2) in zip(pts, pts[1:]): cyl(hL, c2 + Vector((x1, 0, z1)), c2 + Vector((x2, 0, z2)), .018, 'dwood', r2=.015, seg=8)
        J['string'] = cyl(hL, c2 + Vector((-.62 * k, 0, .1 * k)), c2 + Vector((.62 * k, 0, .1 * k)), .004, 'cloth2', seg=4)
        J['arrow'] = cyl(hL, c2 + Vector((0, 0, .5)), c2 + Vector((0, 0, -.15)), .008, 'lwood', seg=6)
    elif w in ('crossbow', 'repeater'):
        cyl(hR, V(0, 0, .25), V(0, 0, -.55), .03, 'wood', seg=8); cyl(hR, V(0, -.32, -.5), V(0, .32, -.5), .018, 'dwood' if w == 'repeater' else 'iron', seg=8)
        if w == 'repeater': box(hR, V(.06, 0, -.2), (.08, .05, .4), 'lwood', bevel=.01)
    elif w == 'musket':
        cyl(hR, V(0, 0, .3), V(0, 0, -.15), .035, 'wood', seg=8); cyl(hR, V(0, 0, -.15), V(0, 0, -1.05), .016, 'iron', seg=8)
    elif w == 'sling':
        cyl(hR, V(0, 0, 0), V(.1, 0, -.35), .006, 'rope', seg=4); cyl(hR, V(0, 0, 0), V(-.05, 0, -.35), .006, 'rope', seg=4); keep(sphere(hR, V(.02, 0, -.38), .045, 'leather', scale=(1, .8, .6)))
        box(J['spine'], wpos(J['spine']) + Vector((-.05, .16, .02)), (.14, .05, .16), 'leather', bevel=.02)
    elif w == 'firelance':
        keep(cyl(hR, V(0, 0, .6), V(0, 0, -1.4), .019, 'wood', seg=8)); keep(cone(hR, V(0, 0, -1.4), V(0, 0, -1.6), .035, 'steel', seg=6))
        keep(cyl(hR, V(.03, 0, -1.05), V(.03, 0, -1.35), .04, 'dwood', seg=10)); keep(torus(hR, V(.03, 0, -1.12), .042, .01, 'rope'))
    elif w == 'staff':
        cyl(hR, V(-.9, 0, 0), V(.75, 0, 0), .018, 'wood', seg=8); sphere(hR, V(.8, 0, 0), .05, 'gold')

def shield(J, kind):
    sp = J['spine']; c = wpos(sp) + Vector((.24, .16, .2)); rot = (0, 0, R(28))
    if kind == 'round': o = disc(sp, c, .27, .035, 'team', axis='x'); o.rotation_mode = 'XYZ'; o.rotation_euler = rot; s = sphere(sp, c + Vector((.04, .02, 0)), .06, 'steel', scale=(.6, 1, 1))
    elif kind == 'kite':
        prism(sp, [(-.2, .3), (.2, .3), (.21, -.05), (0, -.45), (-.21, -.05)], .03, 'team', c, rot=(0, 0, R(90 + 28)))
    elif kind == 'scutum':
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=(.04, .44, .66), verts=bm.verts)
        for v in bm.verts: v.co.x -= (v.co.y ** 2) * 1.2
        o = mesh_from_bm(bm, 'scutum', 'team'); o.location = c + Vector((.03, 0, -.02)); o.rotation_euler = rot; attach(o, sp, False, .01)
        sphere(sp, c + Vector((.07, .03, -.02)), .055, 'gold', scale=(.6, 1, 1))
    elif kind == 'aspis': o = disc(sp, c, .36, .05, 'bronze', axis='x'); o.rotation_mode = 'XYZ'; o.rotation_euler = rot; o2 = disc(sp, c + Vector((.012, .006, 0)), .3, .05, 'team', axis='x'); o2.rotation_mode = 'XYZ'; o2.rotation_euler = rot
    elif kind == 'pelte': o = disc(sp, c + Vector((0, 0, .1)), .17, .03, 'bronze', axis='x'); o.rotation_mode = 'XYZ'; o.rotation_euler = rot
    elif kind == 'chimalli':
        o = disc(sp, c, .24, .03, 'team', axis='x'); o.rotation_mode = 'XYZ'; o.rotation_euler = rot
        for k in range(7):
            a = R(200 + k * 20); box(sp, c + Vector((0, math.cos(a) * .27, math.sin(a) * .27)), (.02, .05, .12), 'feather' if k % 2 else 'green', rot=(a, 0, R(28)))

# ------------------------------------------------------------------ poses
def rot(n, x=0, y=0, z=0): n.rotation_mode = 'XYZ'; n.rotation_euler = (R(x), R(y), R(z))
def arm(J, s, p, bend, spread=0, roll=0): sg = -1 if s == 'R' else 1; rot(J['sh' + s], x=sg * spread, y=-p, z=roll); rot(J['el' + s], y=-bend)
def leg(J, s, p, bend, spread=0): sg = -1 if s == 'R' else 1; rot(J['hip' + s], x=sg * spread, y=-p); rot(J['kn' + s], y=bend)
lerp = lambda a, b, t: a + (b - a) * t
def seg(t, a, b): return 0 if t <= a else 1 if t >= b else (t - a) / (b - a)
def ease(t): return t * t * (3 - 2 * t)

def pose_human(J, mode, ph):
    look = J['look']; w = look.get('wpn'); mounted = J['mounted']
    for k in ('body', 'hips', 'spine', 'neck', 'head'): rot(J[k])
    J['body'].location = (0, 0, 0); J['hips'].location = (0, 0, 0.95)
    for o in J['wpn']: o.hide_render = False
    if 'arrow' in J: J['arrow'].hide_render = True
    t = ph if mode == 'atk' else -1
    # ---- arms at rest for the weapon
    two = w in TWOHAND
    if w in SLASH:
        arm(J, 'R', 25, 70); arm(J, 'L', 30, 65, spread=-10) if look.get('shield') or two else arm(J, 'L', 10, 15, spread=6)
        if two: arm(J, 'R', 40, 55, spread=-5); arm(J, 'L', 42, 62, spread=-28)
        if w == 'axes': arm(J, 'L', 25, 70)
        if t >= 0:
            up, dn, ret = ease(seg(t, 0, .42)), ease(seg(t, .42, .62)), ease(seg(t, .75, 1))
            p = lerp(25, 155, up) - 135 * dn + 15 * ret * 0; b = lerp(70, 35, up) - 20 * dn + 55 * ret
            arm(J, 'R', p if p > 20 else 20 + 0 * ret, b if b > 15 else 15); rot(J['spine'], z=lerp(0, 18, up) - 35 * dn + 17 * ret)
            if two: arm(J, 'L', p - 5, b + 5, spread=-26)
            if w == 'axes': arm(J, 'L', lerp(25, 140, seg(t, .3, .6)) - 120 * seg(t, .6, .85), 60)
    elif w in ('spear', 'fork', 'pike', 'sarissa', 'firelance'):
        tilt = {'spear': 8, 'fork': 8, 'pike': 0, 'sarissa': 16, 'firelance': 6}[w]
        arm(J, 'R', 12, 88 - tilt, spread=-6); arm(J, 'L', 40, 50, spread=-25) if w in ('pike', 'sarissa') else (arm(J, 'L', 30, 65, spread=-10) if look.get('shield') else arm(J, 'L', 10, 20))
        if t >= 0:
            back, go, ret = ease(seg(t, 0, .4)), ease(seg(t, .4, .6)), ease(seg(t, .75, 1))
            p = 12 - 22 * back + 52 * go - 30 * ret; b = 88 - tilt + 12 * back - 55 * go + 43 * ret
            arm(J, 'R', p, b, spread=-6); rot(J['spine'], y=-(6 * go - 6 * ret) * -1)
            if w in ('pike', 'sarissa'): arm(J, 'L', 40 - 15 * back + 30 * go - 15 * ret, 50 + 10 * back - 35 * go + 25 * ret, spread=-25)
    elif w == 'lance':
        arm(J, 'R', 5, 92, spread=-4); arm(J, 'L', 25, 60)
        if t >= 0: g = math.sin(seg(t, .3, .7) * math.pi); arm(J, 'R', 5 + 25 * g, 92 - 25 * g, spread=-4)
    elif w in ('javelin', 'francisca', 'sling'):
        arm(J, 'R', 20, 75); arm(J, 'L', 30, 65, spread=-10) if look.get('shield') else arm(J, 'L', 10, 15)
        if t >= 0:
            back, go = ease(seg(t, 0, .45)), ease(seg(t, .45, .62))
            arm(J, 'R', lerp(20, 170, back) - 130 * go, lerp(75, 50, back) - 40 * go); rot(J['spine'], z=25 * back - 45 * go)
            for o in J['wpn']: o.hide_render = t > .56 and w != 'sling'
            if w == 'francisca' and t > .56: pass
    elif w in ('bow', 'longbow'):
        arm(J, 'L', 35, 30, spread=-6); arm(J, 'R', 15, 40)
        if t >= 0:
            up, pull, rel = ease(seg(t, 0, .2)), ease(seg(t, .15, .55)), seg(t, .6, .62)
            arm(J, 'L', lerp(35, 88, up), lerp(30, 0, up), spread=lerp(-6, 4, up)); arm(J, 'R', lerp(15, 88, up), lerp(40, 10, up) + 130 * pull * (1 - rel), spread=-lerp(0, 12, up))
            rot(J['spine'], z=lerp(0, 35, up)); J['arrow'].hide_render = not (.08 < t < .61)
    elif w in ('crossbow', 'repeater', 'musket'):
        arm(J, 'R', 60, 70, spread=-4); arm(J, 'L', 62, 65, spread=-26)
        if t >= 0:
            aim, kick, ret = ease(seg(t, 0, .4)), seg(t, .55, .62), ease(seg(t, .7, 1))
            p = lerp(60, 82, aim) - 14 * kick * (1 - ret) - 22 * ret; arm(J, 'R', p, lerp(70, 18, aim) + 50 * ret, spread=-4); arm(J, 'L', p + 3, lerp(65, 10, aim) + 50 * ret, spread=-28)
    elif w == 'staff':
        arm(J, 'R', 18, 72); arm(J, 'L', 8, 20)
        if t >= 0: g = math.sin(seg(t, 0, 1) * math.pi); arm(J, 'R', 18 + 60 * g, 72 - 40 * g)
    else:
        arm(J, 'R', 8, 12); arm(J, 'L', 8, 12)
    # ---- legs
    if mounted:
        leg(J, 'R', 72, 88, spread=22); leg(J, 'L', 72, 88, spread=22)
    elif mode == 'walk':
        s = math.sin(ph * 2 * math.pi); c = math.cos(ph * 2 * math.pi)
        leg(J, 'R', 28 * s, max(0, -c) * 45 + 5); leg(J, 'L', -28 * s, max(0, c) * 45 + 5)
        J['hips'].location = (0, 0, 0.95 - 0.03 + abs(c) * 0.03); rot(J['spine'], y=4, z=J['spine'].rotation_euler.z / R(1) * 0 + 4 * s)
        if w not in SLASH and w not in ('bow', 'crossbow', 'repeater', 'musket', 'pike', 'sarissa', 'spear', 'fork', 'lance') and not look.get('shield'): arm(J, 'L', -22 * s, 15)
        if w in (None, 'staff'): arm(J, 'R', 22 * s, 15 if w is None else 72)
    else:
        leg(J, 'R', 4, 6, spread=2); leg(J, 'L', -6, 4, spread=2)
        if t >= 0 and w in SLASH | {'spear', 'fork', 'javelin', 'francisca'}: leg(J, 'L', 25 * seg(t, .3, .6), 10); leg(J, 'R', -10, 10)
    # ---- death: buckle, then fall backwards
    if mode == 'death':
        e = ease(ph); rot(J['body'], y=-86 * e); J['body'].location = (-0.15 * e, 0, 0.13 * e)
        leg(J, 'R', 30 * math.sin(ph * math.pi), 50 * math.sin(ph * math.pi)); leg(J, 'L', 10, 30 * math.sin(ph * math.pi))
        arm(J, 'R', 40 + 80 * e, 20, spread=-20 * e); arm(J, 'L', 30 + 90 * e, 30, spread=-25 * e); rot(J['head'], y=20 * e)
        for o in J['wpn']: o.hide_render = False

def pose_for(frame):
    k, i = frame[0], int(frame[1:] or 0) if frame != 'idle' else 0
    if frame == 'idle': return 'idle', 0
    if k == 'w': return 'walk', i / 8
    if k == 'a': return 'atk', ATK_T[i]
    return 'death', (i + 1) / 5

# ------------------------------------------------------------------ rendering
HOLD = None
def holdout():
    global HOLD
    if HOLD: return HOLD
    m = bpy.data.materials.new('holdout')
    if not m.node_tree: m.use_nodes = True
    nt = m.node_tree; [nt.nodes.remove(n) for n in list(nt.nodes) if n.type != 'OUTPUT_MATERIAL']
    h = nt.nodes.new('ShaderNodeHoldout'); nt.links.new(h.outputs[0], nt.nodes['Material Output'].inputs['Surface']); HOLD = m; return m

def render_frames(sc, root, poser, yaws, frames, tmp, tag):
    files = []
    for yi, yaw in enumerate(yaws):
        root.rotation_mode = 'XYZ'; root.rotation_euler = (0, 0, R(yaw))
        for fi, fr in enumerate(frames):
            mode, ph = pose_for(fr); poser(mode, ph)
            f = os.path.join(tmp, '%s_%d_%d.png' % (tag, yi, fi)); sc.render.filepath = f; bpy.ops.render.render(write_still=True); files.append((yi, fi, f))
    return files

def mask_mode(sc, on):
    for o in sc.objects:
        if o.name == 'ground': o.hide_render = on; continue
        if o.type != 'MESH': continue
        if on:
            o['orig'] = [s.material.name for s in o.material_slots]
            for s in o.material_slots:
                if s.material.name not in TEAM: s.material = holdout()
        elif 'orig' in o:
            for s, n in zip(o.material_slots, o['orig']): s.material = bpy.data.materials[n]

def pack(files, rows, cols, kind, path):
    from PIL import Image
    w, h = CELL[kind][0] * SS, CELL[kind][1] * SS; sheet = Image.new('RGBA', (cols * w, rows * h))
    for yi, fi, f in files: sheet.paste(Image.open(f).convert('RGBA'), (fi * w, yi * h))
    sheet.save(path, 'WEBP', quality=84, method=6, alpha_quality=85)
    return os.path.getsize(path)

def bake(id, kind, build, poser, yaws=YAWS, frames=FRAMES, samples=None):
    t0 = time.time(); sc = reset(); MATS.clear(); TEAM.clear()
    global HOLD; HOLD = None
    if samples: sc.cycles.samples = samples
    root = node('root', None, (0, 0, 0)); ctx = build(root); root.scale = (M, M, M); set_cell(sc, kind)
    tmp = os.path.join(OUT, '.tmp'); os.makedirs(tmp, exist_ok=True)
    P = lambda mode, ph: poser(ctx, mode, ph)
    col = render_frames(sc, root, P, yaws, frames, tmp, id + 'c'); mask_mode(sc, True)
    msk = render_frames(sc, root, P, yaws, frames, tmp, id + 'm'); mask_mode(sc, False)
    s1 = pack(col, len(yaws), len(frames), kind, os.path.join(OUT, id + '.webp')); s2 = pack(msk, len(yaws), len(frames), kind, os.path.join(OUT, id + '_m.webp'))
    for _, _, f in col + msk: os.remove(f)
    w, h, ax, ay = CELL[kind]
    print('baked %-12s %5.1fs  %4dKB + %3dKB' % (id, time.time() - t0, s1 // 1024, s2 // 1024), flush=True)
    return {'w': w, 'h': h, 'ax': ax, 'ay': ay, 'ss': SS, 'dirs': len(yaws), 'frames': frames}


# ------------------------------------------------------------------ animals
def quad_leg(J, name, parent, hip, up, lo, r, m, hoof='black'):
    h = J[name] = node(name, parent, hip - wpos(parent)); k = J[name + 'k'] = node(name + 'k', h, (0, 0, -up))
    bpy.context.view_layer.update(); a, b = wpos(h), wpos(k)
    limb(h, a, b, r, m, r * .8); limb(k, b, b + Vector((0, 0, -lo)), r * .75, m, r * .6)
    if hoof: cyl(k, b + Vector((0, 0, -lo + .02)), b + Vector((0, 0, -lo - .08)), r * .7, hoof, r2=r * .8, seg=10)

def horse(look, root, camel=False):
    J = {}; col = {'#8a5a3a': 'horse', '#5a4334': 'horse2', '#a9834f': 'horse', '#e6e0d2': 'horse3', '#7d6a55': 'horse4', '#4a3a2e': 'horse2', '#c9a36a': 'camel'}.get(look.get('mc'), 'horse')
    if camel: col = 'camel'
    bz = 1.55 if camel else 1.25; up, lo = (.62, .7) if camel else (.5, .58)
    hb = J['hbody'] = node('hbody', root, (0, 0, 0)); body = J['torso'] = node('torso', hb, (0, 0, bz))
    sphere(body, Vector((0, 0, bz)), 1, col, scale=(.78, .29, .32), seg=20, rings=12)
    if camel: sphere(body, Vector((-.05, 0, bz + .3)), .3, col, scale=(1.1, .8, .9))
    for s, sy in (('R', -1), ('L', 1)):
        quad_leg(J, 'f' + s, body, Vector((.52, sy * .15, bz - .12)), up, lo, .085, col)
        quad_leg(J, 'b' + s, body, Vector((-.52, sy * .15, bz - .1)), up, lo, .095, col)
    n0, n1 = Vector((.62, 0, bz + .12)), Vector((.98, 0, bz + (.78 if camel else .6)))
    if camel: n0, n1 = Vector((.65, 0, bz)), Vector((1.15, 0, bz + .75))
    neck = J['neck'] = node('neck', body, n0 - Vector((0, 0, bz)))
    cyl(neck, n0, n1, .16, col, r2=.11, seg=14)
    hd = J['hd'] = node('hd', neck, n1 - n0); bpy.context.view_layer.update(); c = wpos(hd)
    box(hd, c + Vector((.17, 0, -.09)), (.46, .15, .19), col, rot=(0, R(48), 0), bevel=.05)
    for sy in (-1, 1): cone(hd, c + Vector((-.02, sy * .05, .06)), c + Vector((-.04, sy * .07, .19)), .035, col, seg=6)
    if not camel:
        box(neck, (n0 + n1) / 2 + Vector((-.08, 0, .1)), (.08, .05, .62), 'black', rot=(0, R(-38), 0), bevel=.02)
        tl = J['tail'] = node('tail', body, (-.76, 0, .1)); bpy.context.view_layer.update(); t0 = wpos(tl); cyl(tl, t0, t0 + Vector((-.25, 0, -.65)), .06, 'black', r2=.03)
    else:
        tl = J['tail'] = node('tail', body, (-.76, 0, .05)); bpy.context.view_layer.update(); t0 = wpos(tl); cyl(tl, t0, t0 + Vector((-.1, 0, -.5)), .03, col)
    # tack
    sad = Vector((-.05, 0, bz + .3 + (.35 if camel else 0)))
    if look.get('bard') == 2:
        sphere(body, Vector((0, 0, bz + .01)), 1, 'dsteel', scale=(.8, .305, .335), seg=20, rings=12)
        cyl(body, Vector((.55, 0, bz - .08)), Vector((-.6, 0, bz - .08)), .3, 'dsteel', seg=16).scale = (1, .99, 1.12)
        sphere(body, Vector((0, 0, bz - .3)), 1, 'team', scale=(.78, .3, .05), seg=20, rings=6)
        box(hd, c + Vector((.17, 0, -.07)), (.42, .17, .12), 'steel', rot=(0, R(48), 0), bevel=.03); cyl(neck, n0, n1, .175, 'dsteel', r2=.125, seg=14)
    elif look.get('bard'):
        sphere(body, Vector((0, 0, bz + .01)), 1, 'team', scale=(.8, .305, .335), seg=20, rings=12)
        cyl(body, Vector((.55, 0, bz - .08)), Vector((-.6, 0, bz - .08)), .3, 'team', seg=16, caps=True).scale = (1, .99, 1.12)
        sphere(body, Vector((0, 0, bz - .3)), 1, 'team2', scale=(.78, .3, .06), seg=20, rings=6)
    else:
        box(body, sad + Vector((0, 0, -.06)), (.55, .62, .05), 'team', bevel=.02)
    box(body, sad, (.42, .34, .1), 'leather2', bevel=.04)
    seat = node('seat', body, sad + Vector((0, 0, -0.9)) - Vector((0, 0, bz)))
    rider = human(look, seat, mounted=True); J.update({k: v for k, v in rider.items() if k not in J}); J['rider'] = rider; J['camel'] = camel
    return J

def pose_horse(J, mode, ph):
    pose_human(J['rider'], 'atk' if mode == 'atk' else 'idle', ph)
    rot(J['hbody']); J['hbody'].location = (0, 0, 0); rot(J['torso']); rot(J['neck']); rot(J['hd']); rot(J['tail'], y=-20)
    if mode == 'walk':
        w = ph * 2 * math.pi
        for leg_, off, amp in (('fR', 0, 38), ('fL', .5, 38), ('bR', 2.6, 30), ('bL', 3.1, 30)):
            s = math.sin(w + off); rot(J[leg_], y=-amp * s); rot(J[leg_ + 'k'], y=(40 * max(0, math.cos(w + off))) * (1 if leg_[0] == 'b' else -1))
        rot(J['torso'], y=-4 * math.sin(w * 1)); J['hbody'].location = (0, 0, .05 * abs(math.sin(w))); rot(J['neck'], y=6 * math.sin(w)); rot(J['tail'], y=-40 - 15 * math.sin(w))
    else:
        for leg_ in ('fR', 'fL', 'bR', 'bL'): rot(J[leg_]); rot(J[leg_ + 'k'])
        if mode == 'atk':
            g = math.sin(seg(ph, .2, .8) * math.pi); rot(J['torso'], y=-10 * g); rot(J['fR'], y=-40 * g); rot(J['fRk'], y=-60 * g); rot(J['neck'], y=-10 * g)
    if mode == 'death':
        e = ease(ph); rot(J['hbody'], x=-82 * e); J['hbody'].location = (0, -.1 * e, .2 * e)
        for leg_ in ('fR', 'fL', 'bR', 'bL'): rot(J[leg_], y=-25 * math.sin(ph * 3 + len(leg_)))
        rot(J['neck'], y=30 * e)

def elephant(look, root):
    J = {}; bz = 2.0; hb = J['hbody'] = node('hbody', root, (0, 0, 0)); body = J['torso'] = node('torso', hb, (0, 0, bz))
    sphere(body, Vector((0, 0, bz)), 1, 'ele', scale=(1.45, .78, .85), seg=22, rings=14)
    for s, sy in (('R', -1), ('L', 1)):
        for f, fx in (('f', .85), ('b', -.85)):
            n = f + s; h = J[n] = node(n, body, (fx, sy * .42, -.45)); k = J[n + 'k'] = node(n + 'k', h, (0, 0, -.7)); bpy.context.view_layer.update()
            a, b = wpos(h), wpos(k); cyl(h, a, b, .26, 'ele', r2=.24); cyl(k, b, b + Vector((0, 0, -.8)), .24, 'ele', r2=.27); cyl(k, b + Vector((0, 0, -.78)), b + Vector((0, 0, -.86)), .28, 'ivory')
    hd = J['hd'] = node('hd', body, (1.35, 0, .35)); bpy.context.view_layer.update(); c = wpos(hd)
    sphere(hd, c, .58, 'ele', scale=(1, .95, 1.05))
    for sy in (-1, 1): sphere(hd, c + Vector((-.2, sy * .55, .05)), .5, 'ele', scale=(.18, .75, 1), rot=(0, 0, R(sy * 15)))
    tr = hd; p = c + Vector((.45, 0, -.2)); J['trunk'] = []
    for i in range(4):
        n = node('tr%d' % i, tr, p - wpos(tr)); J['trunk'].append(n); bpy.context.view_layer.update(); q = wpos(n) + Vector((.12, 0, -.42))
        cyl(n, wpos(n), q, .17 - i * .03, 'ele', r2=.14 - i * .03); tr = n; p = q
    for sy in (-1, 1): cyl(hd, c + Vector((.35, sy * .25, -.35)), c + Vector((.95, sy * .3, -.45)), .06, 'ivory', r2=.02)
    tl = node('tail', body, (-1.42, 0, .2)); bpy.context.view_layer.update(); t0 = wpos(tl); cyl(tl, t0, t0 + Vector((-.15, 0, -.8)), .04, 'ele')
    sphere(body, Vector((0, 0, bz + .05)), 1, 'team', scale=(.95, .8, .82), seg=20, rings=12); box(body, Vector((0, 0, bz - .2)), (1.9, 1.62, .06), 'gold', bevel=.02)
    hw = Vector((-.1, 0, bz + .9)); box(body, hw, (1.1, .95, .3), 'wood', bevel=.03)
    box(body, hw + Vector((0, 0, .2)), (1.14, .99, .08), 'team2', bevel=.02)
    for i, x in enumerate((.25, -.3)):
        seat = node('seat%d' % i, body, hw + Vector((x, 0, -.75)) - Vector((0, 0, bz)))
        r = human({'b': 'human', 'helm': 'kettle', 'armor': 'cloth', 'wpn': 'spear' if i == 0 else 'bow'}, seat, mounted=True); J['rider%d' % i] = r
    seat = node('mahout', hd, Vector((-.25, 0, .35)) + Vector((0, 0, -.8))); J['mahout'] = human({'b': 'human', 'helm': 'turban', 'armor': 'cloth', 'wpn': 'staff'}, seat, mounted=True)
    return J

def pose_elephant(J, mode, ph):
    for k in ('rider0', 'rider1', 'mahout'): pose_human(J[k], 'idle', 0)
    rot(J['hbody']); J['hbody'].location = (0, 0, 0); rot(J['torso']); rot(J['hd'])
    for i, n in enumerate(J['trunk']): rot(n, y=-8 - i * 6)
    w = ph * 2 * math.pi
    for n, off in (('fR', 0), ('fL', math.pi), ('bR', math.pi), ('bL', 0)):
        if mode == 'walk': s = math.sin(w + off); rot(J[n], y=-18 * s); rot(J[n + 'k'], y=-12 * max(0, s) if n[0] == 'f' else 12 * max(0, s))
        else: rot(J[n]); rot(J[n + 'k'])
    if mode == 'walk':
        J['hbody'].location = (0, 0, .04 * abs(math.sin(w))); rot(J['hd'], z=4 * math.sin(w))
        for i, n in enumerate(J['trunk']): rot(n, y=-8 - i * 6, z=10 * math.sin(w + i))
    if mode == 'atk':
        g = math.sin(seg(ph, .1, .8) * math.pi); rot(J['hd'], y=-14 * g); rot(J['torso'], y=-6 * g)
        for i, n in enumerate(J['trunk']): rot(n, y=-8 - i * 6 + 30 * g * (i + 1))
        rot(J['fR'], y=-30 * g); rot(J['fRk'], y=-40 * g)
    if mode == 'death':
        e = ease(ph); rot(J['hbody'], x=-80 * e); J['hbody'].location = (0, -.2 * e, .45 * e)

def wolf(look, root):
    dog = look.get('dog'); J = {}; bz = .62; hb = J['hbody'] = node('hbody', root, (0, 0, 0)); body = J['torso'] = node('torso', hb, (0, 0, bz))
    fur = 'horse' if dog else 'wolf'
    sphere(body, Vector((0, 0, bz)), 1, fur, scale=(.48, .17, .2), seg=16, rings=10)
    if dog: sphere(body, Vector((0, 0, bz + .02)), 1, 'leather', scale=(.36, .18, .19), seg=14, rings=8); box(body, Vector((0, 0, bz + .17)), (.5, .3, .04), 'team', bevel=.02)
    for s, sy in (('R', -1), ('L', 1)):
        quad_leg(J, 'f' + s, body, Vector((.3, sy * .08, bz - .08)), .27, .28, .045, fur, hoof=None)
        quad_leg(J, 'b' + s, body, Vector((-.3, sy * .08, bz - .06)), .27, .28, .05, fur, hoof=None)
    hd = J['hd'] = node('hd', body, (.48, 0, .1)); bpy.context.view_layer.update(); c = wpos(hd)
    sphere(hd, c, .14 if dog else .13, fur, scale=(1.1, .95, .95)); box(hd, c + Vector((.15, 0, -.05)), (.2, .1 if dog else .09, .09), fur, bevel=.03); sphere(hd, c + Vector((.25, 0, -.03)), .025, 'black')
    for sy in (-1, 1): (sphere(hd, c + Vector((-.03, sy * .1, .03)), .05, fur, scale=(.5, .6, 1.2)) if dog else cone(hd, c + Vector((-.02, sy * .06, .08)), c + Vector((-.04, sy * .07, .2)), .04, fur, seg=6))
    torus(hd, c + Vector((-.12, 0, -.03)), .1, .025, 'team', rot=(0, R(70), 0))
    tl = J['tail'] = node('tail', body, (-.48, 0, .05)); bpy.context.view_layer.update(); t0 = wpos(tl); cyl(tl, t0, t0 + Vector((-.32, 0, -.12)), .05, fur, r2=.03)
    return J

def pose_wolf(J, mode, ph):
    rot(J['hbody']); J['hbody'].location = (0, 0, 0); rot(J['torso']); rot(J['hd']); rot(J['tail'], y=-10)
    w = ph * 2 * math.pi
    for n, off in (('fR', 0), ('fL', .6), ('bR', 3.0), ('bL', 3.6)):
        if mode == 'walk': s = math.sin(w + off); rot(J[n], y=-45 * s); rot(J[n + 'k'], y=(35 * max(0, math.cos(w + off))) * (1 if n[0] == 'b' else -1))
        else: rot(J[n]); rot(J[n + 'k'])
    if mode == 'walk': J['hbody'].location = (0, 0, .05 * abs(math.sin(w))); rot(J['torso'], y=-6 * math.sin(w))
    if mode == 'atk': g = math.sin(seg(ph, .1, .7) * math.pi); J['hbody'].location = (.15 * g, 0, .08 * g); rot(J['torso'], y=-12 * g); rot(J['hd'], y=20 * g)
    if mode == 'death': e = ease(ph); rot(J['hbody'], x=-85 * e); J['hbody'].location = (0, 0, .12 * e)

# ------------------------------------------------------------------ siege engines (metres)
def wheel(J, parent, c, r, name):
    w = J.setdefault('wheels', []); n = node(name, parent, c - wpos(parent)); w.append(n)
    disc(n, c, r, .1, 'dwood', axis='y', seg=18); disc(n, c, r * .25, .14, 'iron', axis='y', seg=10)
    for k in range(4): a = k * math.pi / 4; box(n, c, (r * 1.9, .06, .05), 'wood', rot=(0, a, 0), bevel=.005)
def flag(parent, c, h=1.3):
    cyl(parent, c, c + Vector((0, 0, h)), .02, 'dwood'); prism(parent, [(0, 0), (0, -.32), (-.45, -.16)], .015, 'team', c + Vector((0, 0, h)))

def siege(id, look, root):
    J = {'id': id}; hb = J['hbody'] = node('hbody', root, (0, 0, 0)); bpy.context.view_layer.update()
    if id == 'catapult':
        box(hb, Vector((0, 0, .45)), (2.3, 1.0, .18), 'wood'); [box(hb, Vector((0, y, .45)), (2.3, .12, .2), 'dwood') for y in (-.45, .45)]
        for x in (-.75, .75):
            for y in (-.55, .55): wheel(J, hb, Vector((x, y, .38)), .38, 'w%d%d' % (x > 0, y > 0))
        for y in (-.42, .42): cyl(hb, Vector((.35, y, .5)), Vector((.15, y, 1.55)), .07, 'dwood')
        box(hb, Vector((.15, 0, 1.5)), (.2, 1.0, .18), 'wood'); cyl(hb, Vector((-.55, -.3, .62)), Vector((-.55, .3, .62)), .17, 'rope')
        arm = J['arm'] = node('arm', hb, (-.55, 0, .62)); bpy.context.view_layer.update(); a0 = wpos(arm)
        cyl(arm, a0, a0 + Vector((0, 0, 1.75)), .07, 'wood'); sphere(arm, a0 + Vector((0, 0, 1.85)), .2, 'leather2', scale=(1, 1, .5)); J['load'] = sphere(arm, a0 + Vector((0, 0, 1.95)), .14, 'rock')
        flag(hb, Vector((-1.1, .45, .55)))
    elif id == 'ballista':
        box(hb, Vector((0, 0, .5)), (1.8, .6, .12), 'wood'); [wheel(J, hb, Vector((-.3, y, .4)), .4, 'w%d' % (y > 0)) for y in (-.45, .45)]
        cyl(hb, Vector((.2, 0, .5)), Vector((.0, 0, 1.15)), .08, 'dwood'); tb = J['arm'] = node('arm', hb, (0, 0, 1.2)); bpy.context.view_layer.update(); c = wpos(tb)
        box(tb, c, (2.0, .2, .14), 'wood'); [cyl(tb, c + Vector((.75, 0, 0)), c + Vector((.55, y * .95, 0)), .045, 'dwood') for y in (-1, 1)]
        J['string'] = [cyl(tb, c + Vector((.55, y * .95, 0)), c + Vector((-.5, 0, 0)), .008, 'cloth2', seg=4) for y in (-1, 1)]
        J['load'] = cyl(tb, c + Vector((-.5, 0, .1)), c + Vector((1.3, 0, .1)), .03, 'lwood', seg=6); flag(hb, Vector((-.85, .3, .55)))
    elif id == 'cannon':
        hb2 = J['arm'] = node('arm', hb, (0, 0, 0)); box(hb2, Vector((-.5, 0, .45)), (1.4, .45, .22), 'wood', rot=(0, R(12), 0)); [wheel(J, hb2, Vector((.1, y, .5)), .5, 'w%d' % (y > 0)) for y in (-.32, .32)]
        cyl(hb2, Vector((-.5, 0, .72)), Vector((1.35, 0, .95)), .18, 'bronze', r2=.13, seg=16); torus(hb2, Vector((1.3, 0, .94)), .14, .03, 'bronze', rot=(0, R(84), 0)); sphere(hb2, Vector((-.55, 0, .72)), .16, 'bronze')
        box(hb2, Vector((-.3, 0, .62)), (.3, .5, .05), 'team', bevel=.01)
    elif id == 'ram':
        [wheel(J, hb, Vector((x, y, .38)), .38, 'w%d%d' % (x > 0, y > 0)) for x in (-.9, .9) for y in (-.6, .6)]
        box(hb, Vector((0, 0, .45)), (2.6, 1.2, .12), 'dwood')
        for x in (-1.15, 1.15):
            for y in (-.55, .55): cyl(hb, Vector((x, y, .45)), Vector((x, y, 1.45)), .06, 'dwood')
        prism(hb, [(-1.4, 0), (1.4, 0), (1.4, .05), (0, .8), (-1.4, .05)], 1.4, 'team', Vector((0, 0, 1.4)), rot=(0, 0, 0))
        ram = J['arm'] = node('arm', hb, (0, 0, .95)); bpy.context.view_layer.update(); c = wpos(ram)
        cyl(ram, c + Vector((-1.2, 0, 0)), c + Vector((1.5, 0, 0)), .16, 'wood'); sphere(ram, c + Vector((1.55, 0, 0)), .22, 'iron', scale=(.8, 1, 1))
    elif id == 'hwacha':
        [wheel(J, hb, Vector((-.1, y, .5)), .5, 'w%d' % (y > 0)) for y in (-.6, .6)]
        box(hb, Vector((-.1, 0, .75)), (1.5, .95, .1), 'wood'); cyl(hb, Vector((-.8, -.3, .75)), Vector((-1.6, -.3, .55)), .04, 'dwood'); cyl(hb, Vector((-.8, .3, .75)), Vector((-1.6, .3, .55)), .04, 'dwood')
        rack = J['arm'] = node('arm', hb, (.0, 0, .9)); bpy.context.view_layer.update(); c = wpos(rack)
        bx = box(rack, c + Vector((0, 0, .35)), (.5, .9, .7), 'wood', rot=(0, R(-40), 0), bevel=.02)
        J['tips'] = []
        for i in range(5):
            for k in range(6):
                p = c + Vector((0, 0, .35)) + Vector((.26 * math.cos(R(-40)) * 1, -.36 + k * .145, 0)) + Vector((math.sin(R(40)) * (-.25 + i * .125) * -1, 0, math.cos(R(40)) * (-.25 + i * .125)))
                J['tips'].append(cone(rack, p, p + Vector((.08, 0, .07)), .02, 'red', seg=4))
        J['fire'] = [sphere(rack, c + Vector((-.3 - k * .08, -.3 + k * .15, .1 + (k % 2) * .1)), .1, 'fire') for k in range(5)]
        flag(hb, Vector((-.8, .4, .8)))
    elif id == 'trebuchet':
        for y in (-.7, .7):
            box(hb, Vector((0, y, .2)), (3.4, .2, .25), 'dwood'); cyl(hb, Vector((-1.2, y, .25)), Vector((0, y * .55, 3.3)), .1, 'wood'); cyl(hb, Vector((1.2, y, .25)), Vector((0, y * .55, 3.3)), .1, 'wood')
        [box(hb, Vector((x, 0, .2)), (.25, 1.6, .2), 'dwood') for x in (-1.5, 1.5)]; cyl(hb, Vector((0, -.6, 3.3)), Vector((0, .6, 3.3)), .08, 'iron')
        [wheel(J, hb, Vector((x, y, .3)), .3, 'w%d%d' % (x > 0, y > 0)) for x in (-1.3, 1.3) for y in (-.85, .85)]
        arm = J['arm'] = node('arm', hb, (0, 0, 3.3)); bpy.context.view_layer.update(); c = wpos(arm)
        cyl(arm, c + Vector((0, 0, 0)), c + Vector((-5.0, 0, 0)), .1, 'wood', r2=.06); cyl(arm, c, c + Vector((1.4, 0, 0)), .13, 'wood')
        box(arm, c + Vector((1.45, 0, -.55)), (.9, .9, .9), 'dwood', bevel=.03); box(arm, c + Vector((1.45, 0, -.15)), (.95, .95, .1), 'iron')
        J['sling'] = cyl(arm, c + Vector((-5.0, 0, 0)), c + Vector((-5.0, 0, -.9)), .015, 'rope'); J['load'] = sphere(arm, c + Vector((-5.0, 0, -.95)), .28, 'rock')
        flag(hb, Vector((1.6, .8, .3)), 1.6)
    return J

def pose_siege(J, mode, ph):
    id = J['id']; rot(J['hbody']); J['hbody'].location = (0, 0, 0); arm = J.get('arm')
    for wn in J.get('wheels', []): rot(wn, y=(ph * 360 if mode == 'walk' else 0))
    if mode == 'walk': J['hbody'].location = (0, 0, .015 * abs(math.sin(ph * 4 * math.pi)))
    t = ph if mode == 'atk' else -1
    if id == 'catapult':
        k = ease(seg(t, .5, .68)) - ease(seg(t, .8, 1)) if t >= 0 else 0; rot(arm, y=lerp(-70, 15, k)); J['load'].hide_render = t > .6
    elif id == 'ballista':
        rot(arm, y=-4); J['load'].hide_render = .55 < t < .95
    elif id == 'cannon':
        k = seg(t, .55, .62) - ease(seg(t, .65, 1)) if t >= 0 else 0; arm.location = (-.25 * k, 0, 0); rot(arm, y=-3 * k)
    elif id == 'ram':
        k = (-ease(seg(t, 0, .5)) * .45 + ease(seg(t, .5, .62)) * .8 - ease(seg(t, .7, 1)) * .35) if t >= 0 else 0; arm.location = (k, 0, .95)
    elif id == 'hwacha':
        firing = .5 < t < .85
        for o in J['tips']: o.hide_render = t > .55
        for o in J['fire']: o.hide_render = not firing
    elif id == 'trebuchet':
        k = ease(seg(t, .3, .62)) if t >= 0 and t < .9 else 0; rot(arm, y=lerp(-62, 70, k)); J['load'].hide_render = t > .58; J['sling'].hide_render = False
    if mode == 'death':
        e = ease(ph); rot(J['hbody'], x=-18 * e, y=8 * e); J['hbody'].location = (0, 0, -.25 * e)
        if arm is not None: rot(arm, y=40 * e)

BUILDERS.update({
    'rider': lambda id, L: ('rider', lambda root: horse(L, root, camel=L.get('mount') == 'camel'), pose_horse),
    'elephant': lambda id, L: ('elephant', lambda root: elephant(L, root), pose_elephant),
    'wolf': lambda id, L: ('wolf', lambda root: wolf(L, root), pose_wolf),
    'trebuchet': lambda id, L: ('trebuchet', lambda root: siege(id, L, root), pose_siege),
})
for _k in ('catapult', 'ballista', 'cannon', 'ram', 'hwacha'): BUILDERS[_k] = (lambda id, L: ('siege', lambda root: siege(id, L, root), pose_siege))

# ------------------------------------------------------------------ buildings and scenery (sizes in tiles, converted to metres)
TL = 1 / M
def tv(x, y, z): return Vector((x * TL, y * TL, z * TL))
def crenel(parent, cx, cy, z, hw, m, n=3):
    for i in range(n):
        f = -1 + (2 * i + 1) / n
        for x, y in ((cx + f * hw, cy - hw), (cx + f * hw, cy + hw), (cx - hw, cy + f * hw), (cx + hw, cy + f * hw)): box(parent, tv(x, y, z + .06), (.11 * TL, .11 * TL, .12 * TL), m, bevel=.02)

def building(id, root):
    J = {}; b = root
    if id == 'palisade':
        import random; rnd = random.Random(3)
        for axis in (0, 1):
            for i in range(7):
                f = -.5 + (i + .5) / 7; h = .62 + rnd.random() * .1; x, y = (f, 0) if axis == 0 else (0, f)
                cyl(b, tv(x, y, 0), tv(x, y, h), .055 * TL, 'wood', seg=8); cone(b, tv(x, y, h), tv(x, y, h + .1), .055 * TL, 'wood', seg=8)
        box(b, tv(0, 0, .42), (.95 * TL, .05 * TL, .05 * TL), 'dwood'); box(b, tv(0, 0, .42), (.05 * TL, .95 * TL, .05 * TL), 'dwood'); flag(b, tv(.05, .05, .7), .25 * TL)
    elif id in ('wall', 'gate'):
        box(b, tv(0, 0, .45), (.96 * TL, .96 * TL, .9 * TL), 'stone', bevel=.05); box(b, tv(0, 0, .9), (1.0 * TL, 1.0 * TL, .06 * TL), 'stone2', bevel=.02); crenel(b, 0, 0, .93, .44, 'stone')
        if id == 'gate':
            for sx in (-1, 1):
                box(b, tv(.49, sx * .2, .3), (.04 * TL, .36 * TL, .6 * TL), 'dwood', bevel=.01); box(b, tv(-.49, sx * .2, .3), (.04 * TL, .36 * TL, .6 * TL), 'dwood', bevel=.01)
            for x in (.5, -.5): cyl(b, tv(x, -.4, .64), tv(x, .4, .64), .4 * TL, 'stone2', seg=18); box(b, tv(x, 0, .75), (.04 * TL, .3 * TL, .2 * TL), 'team', bevel=.01)
        else:
            for x, y in ((.49, 0), (0, .49)): box(b, tv(x, y, .58), (.03 * TL if x else .3 * TL, .3 * TL if x else .03 * TL, .26 * TL), 'team', bevel=.01)
    elif id == 'tower':
        box(b, tv(0, 0, 1.0), (.9 * TL, .9 * TL, 2.0 * TL), 'stone', bevel=.05); box(b, tv(0, 0, 2.05), (1.04 * TL, 1.04 * TL, .14 * TL), 'stone2', bevel=.03); crenel(b, 0, 0, 2.1, .47, 'stone')
        for x, y in ((.46, 0), (0, .46)): box(b, tv(x, y, 1.3), (.04 * TL if x else .07 * TL, .07 * TL if x else .04 * TL, .22 * TL), 'black', bevel=0)
        box(b, tv(.46, 0, 1.7), (.03 * TL, .25 * TL, .35 * TL), 'team', bevel=.01); box(b, tv(0, .46, 1.7), (.25 * TL, .03 * TL, .35 * TL), 'team', bevel=.01); flag(b, tv(0, 0, 2.15), .7 * TL)
    elif id == 'keep':
        box(b, tv(0, 0, .5), (2.7 * TL, 2.7 * TL, 1.0 * TL), 'stone2', bevel=.05); crenel(b, 0, 0, 1.0, 1.3, 'stone', n=7)
        for x in (-1.15, 1.15):
            for y in (-1.15, 1.15): cyl(b, tv(x, y, 0), tv(x, y, 1.7), .34 * TL, 'stone', seg=18); cone(b, tv(x, y, 1.7), tv(x, y, 2.35), .4 * TL, 'team', seg=18)
        box(b, tv(-.1, -.1, 1.6), (1.5 * TL, 1.5 * TL, 3.2 * TL), 'stone', bevel=.06); crenel(b, -.1, -.1, 3.2, .75, 'stone', n=5)
        prism(b, [(-.8 * TL, 0), (.8 * TL, 0), (0, .9 * TL)], 1.6 * TL, 'team', tv(-.1, -.1, 3.25)); prism(b, [(-.8 * TL, 0), (.8 * TL, 0), (0, .9 * TL)], 1.6 * TL, 'team', tv(-.1, -.1, 3.25), rot=(0, 0, R(90)))
        for x, y in ((.66, -.1), (-.1, .66)):
            for z in (1.6, 2.4): box(b, tv(x, y, z), (.04 * TL if x > .5 else .08 * TL, .08 * TL if x > .5 else .04 * TL, .3 * TL), 'black', bevel=0)
        box(b, tv(1.36, 0, .35), (.06 * TL, .45 * TL, .7 * TL), 'dwood', bevel=.01); flag(b, tv(-.1, -.1, 4.1), .8 * TL)
    elif id == 'tent':
        cone(b, tv(0, 0, 0), tv(0, 0, .95), .48 * TL, 'canvas', seg=8)
        for k in range(4): a = k * math.pi / 2 + .4; prism(b, [(0, 0), (.48 * TL, 0), (0, .95 * TL)], .02, 'team', tv(0, 0, 0), rot=(0, 0, a))
        flag(b, tv(0, 0, .95), .3 * TL)
    return J

def tree(kind, root):
    import random; J = {'vars': []}
    for v in range(3):
        rnd = random.Random(v * 13 + len(kind)); g = node('v%d' % v, root, (0, 0, 0)); J['vars'].append(g); s = .85 + rnd.random() * .3
        if kind == 'oak':
            cyl(g, tv(0, 0, 0), tv(0, 0, .55 * s), .06 * TL, 'bark', r2=.045 * TL, seg=8)
            for i in range(6):
                a = rnd.random() * 6.28; r = rnd.random() * .22
                sphere(g, tv(math.cos(a) * r, math.sin(a) * r, (.75 + rnd.random() * .3) * s), (.22 + rnd.random() * .1) * TL, 'leaf' if i % 2 else 'leaf2', seg=10, rings=7)
        elif kind in ('pine', 'snowpine'):
            cyl(g, tv(0, 0, 0), tv(0, 0, .3), .05 * TL, 'bark', seg=8)
            for i in range(3):
                z = (.22 + i * .32) * s; r = (.36 - i * .09) * s; cone(g, tv(0, 0, z), tv(0, 0, z + .5 * s), r * TL, 'pine', seg=9)
                if kind == 'snowpine': cone(g, tv(0, 0, z + .26 * s), tv(0, 0, z + .5 * s + .01), r * .55 * TL, 'snow', seg=9)
        elif kind == 'palm':
            p = tv(0, 0, 0); bend = rnd.random() * .15 + .1
            for i in range(5): q = p + tv(bend * .25, 0, .25 * s); cyl(g, p, q, (.055 - i * .006) * TL, 'bark', seg=8); p = q
            for i in range(8): a = i * math.pi / 4 + rnd.random() * .3; prism(g, [(0, 0), (.25 * TL, .06 * TL), (.55 * TL, -.12 * TL), (.25 * TL, 0)], .03, 'leaf' if i % 2 else 'leaf2', p, rot=(0, R(10), a))
        elif kind == 'rock':
            bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=.25 * TL)
            for vt in bm.verts: vt.co *= .8 + rnd.random() * .4; vt.co.z = max(vt.co.z * (.6 + v * .1), -.02)
            o = mesh_from_bm(bm, 'rock', 'rock'); o.location = tv(0, 0, .05); attach(o, g, smooth=False)
    return J

def pose_variant(J, mode, ph):
    v = 0 if mode == 'idle' else 1 + int(ph * 8 + .01)
    for i, g in enumerate(J['vars']):
        for o in g.children_recursive: o.hide_render = i != v
VAR = ['idle', 'w0', 'w1']
SCENERY.update({k: (('b3' if k == 'keep' else 'b1'), (lambda root, k=k: building(k, root)), (lambda J, m, p: None), {'yaws': [0], 'frames': ['idle'], 'samples': 32})
                for k in ('palisade', 'wall', 'gate', 'tower', 'keep', 'tent')})
SCENERY.update({k: ('tree' if k != 'rock' else 'rock', (lambda root, k=k: tree(k, root)), pose_variant, {'yaws': [0], 'frames': VAR, 'samples': 32}) for k in ('oak', 'pine', 'palm', 'snowpine', 'rock')})

# ------------------------------------------------------------------ dispatch
def unit_job(id):
    d = LOOKS[id]; L = d['look']; b = L['b']
    if b == 'human': return 'human', (lambda root: human(L, root)), pose_human
    if b in BUILDERS: return BUILDERS[b](id, L)
    return None

def main():
    os.makedirs(OUT, exist_ok=True); man_path = os.path.join(OUT, 'manifest.json')
    man = json.load(open(man_path)) if os.path.exists(man_path) else {}
    preview = os.environ.get('PREVIEW')
    ids = ONLY or [k for k in LOOKS]
    for id in ids:
        job = SCENERY.get(id) if id in SCENERY else unit_job(id)
        if not job: print('skip', id); continue
        kind, build, poser = job[:3]; extra = job[3] if len(job) > 3 else {}
        yaws = extra.get('yaws', YAWS); frames = extra.get('frames', FRAMES)
        if preview and len(yaws) > 1: yaws = [45, 135, 225]
        if preview: frames = [f for f in ['idle', 'w2', 'w6', 'a1', 'a3', 'a4', 'd2', 'd4'] if f in frames] or frames
        man[id] = bake(id, kind, build, poser, yaws, frames, extra.get('samples'))
        json.dump(man, open(man_path, 'w'), indent=0)

if __name__ == '__main__':
    main()
