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
| T: toggle ASCII, G: style, `[` `]`: character size | ASCII / STYLE / SIZE buttons |
| Esc: pause and free the mouse (top-right buttons stay clickable) | |

## World seed

The terrain is generated from a seed. Add `?seed=` to the URL to get a different world, e.g. `index.html?seed=42`. The same seed always produces the same world. The default is 1337.

## How it works

1. **Terrain.** Height comes from layered 2D simplex noise: broad hills, smaller bumps, and occasional mountains from a second noise layer. The ground is flattened around the fort and the start of the road. Columns are rock underneath, dirt near the top, and grass on top; steep or high ground is bare rock. Pine trees are placed using a forest-density noise and a per-column hash.
2. **Chunks.** The world is split into 16×16×64 chunks. Each chunk is generated purely from the seed, so any chunk can be built on demand, including neighbours that the mesher or collision needs. Chunks within 6 of the player are meshed nearest-first, within a few milliseconds per frame. Far chunks are unloaded.
3. **Greedy meshing.** Each chunk becomes one mesh containing only the faces that touch air. Neighbouring faces of the same material are merged into larger rectangles, with one geometry group per material and world-space UVs so the textures still tile once per block.
4. **The fort** is a list of block edits applied on top of the terrain. That makes it easy to turn into a reusable `buildFort()` and place more structures later.
5. **Lighting.** Dim blue hemisphere and moon light, exponential fog that hides the edge of the loaded area, and flickering point lights at each torch.
6. **ASCII pass.** The 3D scene is rendered into a low-resolution target, at 2× the character grid. A full-screen shader picks a character for each cell based on its brightness, then tints it with the scene colour. The glyph atlas is redrawn at the exact on-screen cell size, so small characters stay sharp.
   - **FINE** (default): about 40 characters, sorted at startup by how much ink each covers, with some of the scene colour blended behind them. This gives smooth shading.
   - **CLASSIC**: the short ramp ` .,:-=+*o#%@` on a dark background.
