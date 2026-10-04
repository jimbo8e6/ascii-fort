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
| E: talk to a guard nearby; 1–2 or click to choose, Esc to leave | TALK button (appears near a guard) |
| Esc: pause and free the mouse (top-right buttons stay clickable) | |

## Rivers, roads and discovery

- **Rivers:** long meandering rivers wind across the continents, roughly 8–12 blocks wide. Each sits in a wide grassy valley with sandy banks and a channel cut just below sea level, so it fills with water and runs out to the coast. They freeze over in the far north and are rarer and thinner in deserts.
- **Roads:** every fort, watchtower and village links to its two nearest neighbours within two regions (about 450 blocks), and the starting fort joins in too. The roads wind gently between them.
  - **Bridges:** where a road crosses a river it runs straight over a bridge model, with clean straight edges at any angle. The deck is level with the higher bank and carries on level until it meets ground, so you never step down more than one block. The seed picks one of two kinds:
    - **Wooden:** a slatted deck on stringer beams, posted handrails with top and middle rails, and braced piles down to the riverbed.
    - **Stone:** elliptical arches (two or three on longer spans, with piers between), parapet walls with capstones and a paved deck. Iron-posted lanterns stand on the parapets, a pair at each end and then alternating sides every ~9 blocks. They glow steadily, share the torch light pool, and light the bridge at night. Built in sandstone in the desert. Spans up to 40 blocks are stone about 55% of the time. Longer ones are usually wooden trestles, but about 1 in 8 is a long multi-arched stone viaduct.
    - **Collision** follows the real deck, and the rails and parapets stop you walking off the side. Boats fit underneath, and no road is built across open sea.
  - **Leaving places:** roads leave fort gates and tower doors straight outwards before turning, so they never cut across a structure's walls.
  - Trees never grow on them, and they show on the map when zoomed in.
  - A guard will tell you when a road leads to a place they mention.
- **Discovery:** forts, watchtowers and ruins are hidden on the map until you've been near one. Then a banner announces it (*DISCOVERED — Ravenvale Tower*) and its marker appears. The starting fort is announced when you first enter a world. Discoveries are saved with each world.

## Villages

Villages sit on the road network. The roads meet at a village square with a stone well, and cottages line each road on alternating sides with their doors facing the street.

- **Cottages:** plank walls, log corners, windows, gabled red-tiled roofs, and a torch by the door.
- **Villagers:** they wear coloured tunics and straw hats and potter about outside their doors. They greet you ("Hello there!", "Welcome, stranger.") and talk like guards, with the same "about this area" answer from their village.
- **On the map:** villages show as a little house marker once discovered.
- **Isolated villages:** a village with no road gets a street of its own.

## Windmills, carts and boats

These are placed by the seed like everything else:

- **Windmills:** about half of all villages have one at the edge. It's a stone-based plank tower with a pyramid roof and a door facing the square. Its four canvas sails turn steadily.
- **Carts:** horse-drawn carts with a driver travel about half of all roads, back and forth.
  - The wheels turn with the distance covered, the horse's legs move, and the cart follows the ground, including over bridges.
  - They turn round just short of village squares and fort gates.
  - Only carts within about 120 blocks are drawn.
- **Boats:** about 7% of chunks with open water have a moored boat bobbing on the surface: rowboats with oars on rivers and lakes, and sailboats at sea.
- These are 3D models built from boxes and cylinders, not blocks, so they can move and turn freely.
- **Solid:** carts and boats each have an oriented collision box matching the hull, or the cart and horse together. You can't walk or swim into them, but you can always move out if you end up overlapping one. A cart that runs into you pushes you aside instead of driving through.

## Caves

Winding tunnels and big caverns run under the land, and in some areas they break through to the surface as entrances.

- **Darkness:** underground it's genuinely dark. Each block face knows how much open sky it can see, and that only scales the sun, moon and sky light. Torches still light cave walls and fort interiors.
- **Lantern:** you carry one that glows automatically whenever there's rock over your head. The minimap shows *underground*.
- **Crystals:** glowing violet crystals grow on floors and ceilings deep down.
- **Where they don't go:** caves never cut under the forts, the road or other structures, and they stay a few blocks below the sea bed.

## Guards and conversations

Guards patrol the walls and courtyards and stand at the gates. They're friendly.

- **Noticing you:** a guard sees you within about 16 blocks by day and 9 at night, as long as no blocks are in the way.
- **Greeting:** once you're within about 7 blocks, they stop, turn to face you and greet you ("Good day, traveller.", "Evening. Keep to the torchlight.").
- **Carrying on:** walk off and they go back to their rounds, forgetting you after a few seconds.
- **Talking:** within about 4 blocks, press **E** (or tap **TALK**) to open a conversation. The game pauses and the mouse is freed. Pick an option with the mouse or the number keys; **Esc** leaves.
  1. **What can you tell me about this area?** The guard answers from the world itself:
     - the name of the place you're at;
     - the two nearest named forts, watchtowers or ruins, with compass direction and rough distance;
     - which way the land changes (sea, desert, snowfields, pine woods, grassland);
     - any cave mouth nearby, and a warning at night.
  2. **Goodbye.**
- **Place names:** every fort, watchtower and ruin has a name generated from the seed, e.g. *Fort Greyhold* (the starting fort in the default world), *Ravenvale Tower*, *the ruins of Old Redholm*.
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

The world map (M) shows biomes, water depth and hill shading, with the fort and your position and facing marked. Drag to pan, scroll or use +/− to zoom, from 256 to about 65,000 blocks across (enough to see whole continents). Structure markers thin out when zoomed far out, and an N marker shows north, and CENTRE ON ME to jump back to yourself. A minimap in the top-left corner (N) follows you and shows the biome and coordinates you're at. Both are drawn from the same climate and height functions as the 3D world, a few rows per frame so the game never stalls.

## How it works

1. **Terrain.** Height comes from layered 2D simplex noise: broad hills, smaller bumps, and occasional mountains from a second noise layer. The ground is flattened around the fort and the start of the road. Columns are rock underneath, dirt near the top, and grass on top; steep or high ground is bare rock. Pine trees are placed using a forest-density noise and a per-column hash.
2. **Continents, climate and biomes.** The world is shaped loosely like the real one:
   - **Continents:** a very slow, domain-warped noise field decides land and sea. You get a few continents, each roughly 10,000 blocks across, with wide oceans between them, irregular coastlines and scattered islands. About 40% of the world is land. A home continent is always raised under the start.
   - **Shape of the land:** it rises from beaches at the coast to hills inland. Mountain ranges run through occasional mountain regions, with snow on the high peaks. Lakes are rare, and only in wet lowlands. Offshore, a continental shelf drops away to deep sea.
   - **Latitude:** −z is north. Temperature falls going north and rises going south, with large-scale wobble so the climate lines meander, and it also cools with altitude.
   - **The bands:** polar snowfields and frozen seas roughly 7,000+ blocks north, temperate grassland and forest around the start, and hot country roughly 6,000+ blocks south.
   - **Rainfall:** wetter along coasts, drier deep inland and in the hot south. Deserts form where it's hot and dry, forests where it's temperate and wet, grassland in between.
   - **Biome mix by band:** the far north is about 100% snow; the middle is about 58% grassland, 34% forest and a little snow or desert; the south is about 70% desert and 30% grassland.
   - **Blocks:** beaches form where land meets the sea, and steep slopes are bare rock. Underwater is sand, and empty space below sea level fills with water.
   - **Swimming:** water is a separate see-through mesh with drifting ripples. Below the surface you swim slowly and hold jump to rise, and the fog turns murky blue.
3. **Chunks.** The world is split into 16×16×64 chunks. Each chunk is generated purely from the seed, so any chunk can be built on demand, including neighbours that the mesher or collision needs. Chunks within 6 of the player are meshed nearest-first, within a few milliseconds per frame. Far chunks are unloaded.
4. **Structures.** The world is divided into 192×192-block regions, and each holds at most one structure, picked from the seed. About half of all regions (more counting the sea) are left empty; of the rest, roughly 10% are forts, 12% watchtowers, 10% ruins and 20% villages:
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
5. **Caves.** Three 3D Perlin noise fields are sampled every 4 blocks and blended between grid points, which keeps it cheap. Tunnels form where two fields are both near zero, giving long winding tubes, and caverns form where the third is high, deeper down.
   - A slow 2D noise decides where tunnels may reach the surface.
   - Crystals are placed using a hash on cave floors and ceilings.
6. **Greedy meshing.** Each chunk becomes one mesh containing only the faces that touch air. Neighbouring faces of the same material are merged into larger rectangles, with one geometry group per material and world-space UVs so the textures still tile once per block.
   - **Ambient occlusion:** each face corner is darkened by how many of the three blocks around it are solid, from fully open down to tucked into a corner. The result is stored as vertex colours.
   - This shades inside corners, the base of walls and the creases of terraced hills, which gives the ASCII view much more depth.
   - **Sky light:** each face also stores how much open sky the air in front of it can see. There are four levels: open, under an overhang, sheltered, and deep underground, with light leaking in sideways and leaves letting it through.
   - A small patch to the Lambert shader scales only the sun/moon and sky light by that value, leaving point lights (torches, lantern) untouched.
   - Faces only merge when their corner shading matches. Each quad is split along the diagonal that keeps a dark corner from smearing across it.
7. **Shaped blocks.** As well as full cubes, the grid holds slabs (half blocks), stairs and sloped roof wedges.
   - Each one records its base block (for textures), its shape and the direction it rises.
   - **Terrain:** a slab goes wherever the ground rises by exactly one block next door, turning hard terraces into half-steps.
   - **Structures:** fort and watchtower stairs use stair blocks (rotated with the structure), and cottage roofs are built from wedges into proper sloped gables.
   - **Drawing:** shaped blocks get small per-block meshes, with faces hidden against neighbouring cubes. Cubes still use the merged greedy mesh.
   - **Collision:** it reads each shape's height under your feet, so you walk up slabs and stairs in smooth half-steps.
8. **The starting fort** is built with the same `buildFort()` as the procedural forts, on flattened ground at the spawn, with a road leading to its gate.
9. **Lighting.** Hemisphere sky light and a sun/moon directional light driven by the day/night cycle, exponential fog that hides the edge of the loaded area, and torchlight from the light pool described above.
10. **ASCII pass.** The 3D scene is rendered into a low-resolution target, at 2× the character grid. A full-screen shader picks a character for each cell based on its brightness, then tints it with the scene colour. The glyph atlas is redrawn at the exact on-screen cell size, so small characters stay sharp.
   - **FINE** (default): about 40 characters, sorted at startup by how much ink each covers, with some of the scene colour blended behind them. This gives smooth shading.
   - **CLASSIC**: the short ramp ` .,:-=+*o#%@` on a dark background.
