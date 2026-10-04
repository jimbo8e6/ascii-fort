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
| Shift: run, Space: jump (hold to swim up) | right thumb: look, JUMP button (hold to swim up) |
| T: toggle ASCII, G: style, `[` `]`: character size | ASCII / STYLE / SIZE buttons |
| M: world map, N: minimap | MAP button |
| K: time speed (normal / 20× / paused) | TIME button |
| E: answer a guard's challenge | TALK button (appears when challenged) |
| Esc: pause and free the mouse (top-right buttons stay clickable) | |

## Guards

Guards patrol the walls and courtyards and stand watch at the gates. They now notice you.

- **Seeing you:** a guard sees you within about 16 blocks by day and 9 at night, as long as no blocks are in the way. Walls, keeps and hills hide you, though they'll still hear you right up close.
- **Noticing:** the guard stops, turns to face you and says something like "?" or "Who goes there?". Patrols resume where they left off.
- **Challenging:** within about 6 blocks they challenge you ("Halt! Who goes there?"), with a different line if you're up on the battlements, and repeat it if you linger.
- **Answering:** press **E** or tap **TALK** to answer. Every guard nearby who was watching you lets you pass and stays friendly for two minutes, with the odd greeting.
- **Losing you:** walk off or slip out of sight for a few seconds and they give up ("Must have been the wind.", "And stay away!") and go back to their rounds.
- **Speech bubbles** are drawn over the 3D view rather than inside it, so they stay readable in ASCII mode.
- **Solid:** guards block your way, but you can always step away from one.

## Saving

The game saves to this browser's local storage, automatically every 10 seconds and whenever you leave the page.

- **What's saved for each world (seed):** where you are, which way you're facing, and the time and day. The 8 most recently played worlds are kept.
- **Settings** are saved too: ASCII on or off, style, character size, minimap and time speed.
- **Coming back:** opening the page returns you to the last world you played, and the start screen shows *continue* with the day and time.
- **On the world map:** a list of your other saved worlds to jump between, and RESTART THIS WORLD to forget your progress in the current one.
- **Limits:** saves stay on this device and browser. A private window, or a browser that blocks storage, simply won't remember; the game still runs.
- If a newer version of the world generator puts a block where you saved, you're placed on top of it.

## Day and night

A full day lasts 10 minutes. The game starts at 18:30, just after sunset. Add `?time=` to the URL to start at another hour, e.g. `index.html?time=12` for noon. The clock and day number show under the minimap and on the world map.

- **Sky:** a gradient dome with a glow around the sun. Dawn and dusk are pink and orange, noon is blue, and stars fade in at night.
- **Sun and moon:** the sun rises in the east, peaks to the south and sets in the west, and the moon is always opposite it.
- **Lighting:** one directional light follows whichever of the two is up, and the sky light, ground light and fog colour all follow the time of day.
- **ASCII view:** the shader's brightness drops in daylight so bright scenes don't saturate into solid `@`.
- **Torches** dim during the day.

## World seed and map

The terrain is generated from a seed. Add `?seed=` to the URL to get a different world, e.g. `index.html?seed=42`. The same seed always produces the same world. The default is 1337. The world map also has a seed box and a NEW WORLD button.

The world map (M) shows biomes, water depth and hill shading, with the fort and your position and facing marked. Drag to pan, scroll or use +/− to zoom (256 to 8192 blocks across), and CENTRE ON ME to jump back to yourself. A minimap in the top-left corner (N) follows you and shows the biome and coordinates you're at. Both are drawn from the same climate and height functions as the 3D world, a few rows per frame so the game never stalls.

## How it works

1. **Terrain.** Height comes from layered 2D simplex noise: broad hills, smaller bumps, and occasional mountains from a second noise layer. The ground is flattened around the fort and the start of the road. Columns are rock underneath, dirt near the top, and grass on top; steep or high ground is bare rock. Pine trees are placed using a forest-density noise and a per-column hash.
2. **Biomes and water.** Three slow noise layers set temperature, moisture and continent shape. Their weights blend smoothly, so terrain has no seams at biome borders.
   - **Ocean:** low continent values sink below sea level. Wet lowlands also get lakes, and empty space below sea level fills with water. Cold water freezes on top.
   - **Desert:** hot and dry. Flat sand over sandstone, with cacti.
   - **Plains:** temperate. Gentler hills, grass and scattered round oaks.
   - **Forest:** wet. Dense pine forest.
   - **Snowy:** cold, and any very high ground. Snow cover, snow-dusted pines and frozen lakes.
   - **Beaches** form where land meets sea level, and steep slopes are bare rock.
   - The area within about 300 blocks of the fort is kept temperate dry land.
   - Water is drawn as a separate see-through mesh with drifting ripples. Below the surface you swim slowly, hold jump to rise, and the fog turns murky blue.
3. **Chunks.** The world is split into 16×16×64 chunks. Each chunk is generated purely from the seed, so any chunk can be built on demand, including neighbours that the mesher or collision needs. Chunks within 6 of the player are meshed nearest-first, within a few milliseconds per frame. Far chunks are unloaded.
4. **Structures.** The world is divided into 192×192-block regions, and each holds at most one structure, picked from the seed:
   - **Forts:** 40, 44 or 48 blocks across, with a gate on a random side, corner towers, wall walks, stairs, a keep in larger ones, torches and guards.
   - **Watchtowers:** 7×7, with spiral stairs inside up to a lookout platform.
   - **Ruins:** broken, overgrown walls with a fallen corner tower and rubble.
   - Desert structures are built of sandstone.
   - A structure's plan (type, size, rotation, ground level) is cheap to work out. Its blocks are only built when a nearby chunk needs them.
   - The ground is flattened under each structure and blended into the surroundings, all within its own region, so chunks never need neighbouring regions.
   - Sites in water or on very rugged ground are skipped, and forts on rough ground become watchtowers.
   - All forts share one builder, including the starting fort, which comes out identical to the original hand-built version.
   - Torches and guards appear with the chunk they stand in. A fixed pool of 10 point lights moves to the nearest torches, so more forts never add rendering cost.
   - Structures appear on the world map: red squares are forts, triangles are watchtowers and crosses are ruins.
5. **Greedy meshing.** Each chunk becomes one mesh containing only the faces that touch air. Neighbouring faces of the same material are merged into larger rectangles, with one geometry group per material and world-space UVs so the textures still tile once per block.
   - **Ambient occlusion:** each face corner is darkened by how many of the three blocks around it are solid, from fully open down to tucked into a corner. The result is stored as vertex colours.
   - This shades inside corners, the base of walls and the creases of terraced hills, which gives the ASCII view much more depth.
   - Faces only merge when their corner shading matches. Each quad is split along the diagonal that keeps a dark corner from smearing across it.
6. **The starting fort** is built with the same `buildFort()` as the procedural forts, on flattened ground at the spawn, with a road leading to its gate.
7. **Lighting.** Hemisphere sky light and a sun/moon directional light driven by the day/night cycle, exponential fog that hides the edge of the loaded area, and torchlight from the light pool described above.
8. **ASCII pass.** The 3D scene is rendered into a low-resolution target, at 2× the character grid. A full-screen shader picks a character for each cell based on its brightness, then tints it with the scene colour. The glyph atlas is redrawn at the exact on-screen cell size, so small characters stay sharp.
   - **FINE** (default): about 40 characters, sorted at startup by how much ink each covers, with some of the scene colour blended behind them. This gives smooth shading.
   - **CLASSIC**: the short ramp ` .,:-=+*o#%@` on a dark background.
