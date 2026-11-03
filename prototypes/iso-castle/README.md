# Castle Aldermere, isometric (a test)

A standalone page for trying out a top-down, isometric way of playing: Castle Aldermere as the game builds it,
seen from above at an angle, with a person to walk about it. The game itself is untouched.

- **Open:** `iso.html` in a browser (it loads three.js from a CDN).
- **The castle is the game's own.** `build.mjs` copies the castle-building code out of `index.html` by name
  (textures, `Kit`, `makeFort`, `buildCastle`, the cells and their furniture, `hangDoor`...) into `iso.html`, between
  the `// <castle-code>` markers. After changing the castle in the game, run `node prototypes/iso-castle/build.mjs`.
  Edit the page itself in `iso.template.html`.
- **Rooms (the default):** it plays like a console role-playing game, one screen at a time: the courtyard (the
  camera follows you there, and you can climb to the wall walks) and every room of the castle its own screen, 24 in
  all. Walk into a doorway, or a door (no need to open it), and you're through into the next room; step onto a stair
  and you're at the other end. Each room shows only itself, walls cut at chest height, framed to fill the screen.
  `room(...)` lists the rooms, `link(...)` the doorways between them (both ways), `stair(...)` the stairs. Up the
  screen is west, north is to the right.
- **Free roaming (M):** the whole castle at once, the camera following you. Q and R turn it a quarter at a time,
  the mouse wheel or + and − zoom, and indoors everything above head height is cut away (C turns that off).
- **Walking:** WASD or the arrow keys, relative to the screen. Walls, furniture and shut doors are solid (the game's own
  colliders). You step up stairs and fall down them, as in the game. A faint silhouette shows you through walls.
- **Cut walls** show solid dark tops: each mesh's inside faces are drawn again in a flat colour, set a little back in depth
  so they never fight with a real surface.
- **Doors:** E opens or closes the nearest door, as in the game.
- **Light:** daylight, and the castle's torches; the eight nearest cast light.
- **Where you are:** the panel at the top shows your square on the castle plans' grid (columns A–N west to east,
  rows 1–14 north to south) and your floor.
- Not here (yet): the castle's people, the history, day and night.
