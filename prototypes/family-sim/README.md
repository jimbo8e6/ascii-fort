# Family simulation prototype

A standalone test of the family simulation for Connected Histories (see `docs/connected-histories.md`).
Nothing in the game uses it.

- `family-sim.mjs`: the simulation. Placeholder lifespans in `RACES`; ⚠ temporary inheritance rules
  for mixed-race families in `TEMP_RULES` (one small function each, to be decided); other placeholder
  rules in `RULES`; the places it runs over in `PLACES`; five placeholder notable founders in `NOTABLES`.
- `test.mjs`: runs the six checks and times generation. `node test.mjs` prints the report and writes
  `results.txt`, plus a saved history in `out/` (not committed).
- `viewer.html`: generate a history and browse it: search people, follow parents, spouses and children,
  see ancestry trees, family lines and notable ancestors, and pick two people to see how they're related
  and through whom. Edit the placeholder lifespans, save and load histories. It's an ES module, so serve
  the folder (`npx serve .` or `python3 -m http.server`) rather than opening the file directly.

## How it works
- **Year 0** is the end of the war. Each place starts with families of its races: couples (married before
  the war) and children born before it. Founders have no recorded parents.
- **Each year**, in order: deaths (a small yearly chance, rising sharply past old age, certain at the race's
  maximum); coming of age (a trade, from father, mother or the place, and perhaps a move away); weddings
  (unmarried women look for a match at home or, now and then, in another place; no one marries a sibling,
  half sibling or first cousin); births (to couples in the mother's child-bearing years, while there's room
  for the child's race in their home).
- **Each place has room for each of its races** (`cap` × the race's share). Without this, long-lived elves
  and dwarves slowly filled every place and humans and orcs died out within 1,000 years.
- **Randomness** comes from hashing the seed, the year, what's being decided and who it concerns, never
  from a running stream. That's what makes later starts extend earlier ones exactly, and lets a saved
  history be carried on to give the same result as running straight through.
- **Saved form:** people (with mother, father and marriages), founding family lines, and the event log.
  Children, ancestors and relationships are worked out from those.
