# Castle Aldermere, isometric (a test)

A standalone page for trying out a top-down, isometric way of playing: Castle Aldermere as the game builds it,
seen from above at an angle, with a person to walk about it. The game itself is untouched.

- **Open:** `iso.html` in a browser (it loads three.js from a CDN).
- **The castle is the game's own.** `build.mjs` copies the castle-building code out of `index.html` by name
  (textures, `Kit`, `makeFort`, `buildCastle`, the cells and their furniture, `hangDoor`...) into `iso.html`, between
  the `// <castle-code>` markers. After changing the castle in the game, run `node prototypes/iso-castle/build.mjs`.
  Edit the page itself in `iso.template.html`.
- **The view:** an orthographic camera looking down from one corner, square on to the castle. Q and R turn it a
  quarter at a time; the mouse wheel or + and − zoom.
- **Walking:** WASD or the arrow keys, relative to the screen. Walls, furniture and shut doors are solid (the game's own
  colliders). You step up stairs and fall down them, as in the game. A faint silhouette shows you through walls.
- **The cutaway:** indoors (anywhere with a floor or roof overhead), everything above head height is sliced away, so
  you see into the room you're in and the walls stand cut at about chest height. Outside you see the whole castle,
  spires and all. C turns the cutaway off.
- **Doors:** E opens or closes the nearest door, as in the game.
- **Light:** daylight, and the castle's torches; the eight nearest cast light.
- **Where you are:** the panel at the top shows your square on the castle plans' grid (columns A–N west to east,
  rows 1–14 north to south) and your floor.
- Not here (yet): the castle's people, the history, day and night.
