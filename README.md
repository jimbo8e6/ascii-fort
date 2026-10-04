# ASCII Fort

A first-person walk around a night-time fort, rendered in real time as coloured ASCII characters. Everything is in one file, `index.html`. The geometry, textures, lighting and ASCII shader are all generated in code; the only external dependency is Three.js, loaded from a CDN.

## Run it

Open `index.html` in a browser. Some browsers block ES modules from `file://`, so if the page stays blank, serve the folder:

```
npx serve .        # or: python3 -m http.server
```

## Controls

| Desktop | Mobile |
|---|---|
| WASD / arrows: move, mouse: look | left thumb: move |
| Shift: run, Space: jump | right thumb: look, JUMP button |
| T: toggle ASCII, `[` `]`: character size | ASCII / SIZE buttons |

## How it works

1. **Voxel world.** The fort is a 64×14×64 grid of blocks filled in by code: walls, towers, gate, stairs and keep. Only blocks with an exposed face are drawn, using one `InstancedMesh` per material. The same grid is used for collision.
2. **Procedural textures.** Brick, wood, grass and dirt are drawn into small canvases at startup.
3. **Lighting.** Dim blue hemisphere and moon light, exponential fog, and flickering point lights at each torch.
4. **ASCII pass.** The 3D scene is rendered into a low-resolution target, at 2× the character grid. A full-screen shader picks a character from ` .,:-=+*o#%@` for each cell based on its brightness, then tints it with the scene colour.
