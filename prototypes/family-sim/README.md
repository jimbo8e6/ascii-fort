# Family simulation prototype

A standalone test of the family simulation for Connected Histories (see `docs/connected-histories.md`).
Nothing in the game uses it.

- `family-sim.mjs`: the simulation. Typical lifespans in `RACES` (James: humans 80, elves 600, dwarves
  300, orcs 60), with placeholder fertility and death rates; ⚠ temporary inheritance rules
  for mixed-race families in `TEMP_RULES` (one small function each, to be decided); other placeholder
  rules in `RULES`; the places it runs over in `PLACES`; five placeholder notable founders in `NOTABLES`.
- `test.mjs`: runs the six checks and times generation. `node test.mjs` prints the report and writes
  `results.txt`, plus a saved history in `out/` (not committed).
- `viewer.html`: generate a history and browse it: search people, follow parents, spouses and children,
  see ancestry trees, family lines and notable ancestors, and pick two people to see how they're related
  and through whom. Edit the placeholder lifespans, save and load histories (LOAD takes a file saved with
  SAVE JSON). It's one self-contained file: open it straight from disk, no server needed.
- `build-viewer.mjs`: copies `family-sim.mjs` into `viewer.html`; with `--hosted <file>` it also writes a copy
  for hosting as a web page (no outer document tags, no SAVE JSON). The hosted copy is published as the
  *Family Line Explorer* page. Run it with `node build-viewer.mjs` (`test.mjs` runs it too),
  so the viewer always uses the same simulation the tests check.

## How it works
- **Year 0** is the end of the war. Each place starts with families of its races: couples (married before
  the war) and children born before it. Founders have no recorded parents.
- **Each year**, in order: deaths, from illness (worst in childhood and old age), injury (worse in
  dangerous trades such as mining, soldiering and the sea, with a fitting cause) or old age, plus a
  small risk in childbirth; coming of age (a trade, from father, mother or the place, and perhaps a move away); weddings
  (unmarried women look for a match at home or, now and then, in another place; no one marries an ancestor
  or descendant at any depth, a sibling, half sibling or first cousin); births (to couples in the mother's child-bearing years, while there's room
  for the child's race in their home).
- **Each place has room for each of its races** (`cap` × the race's share). Without this, long-lived elves
  and dwarves slowly filled every place and humans and orcs died out within 1,000 years.
- **Randomness** comes from hashing the seed, the year, what's being decided and who it concerns, never
  from a running stream. That's what makes later starts extend earlier ones exactly, and lets a saved
  history be carried on to give the same result as running straight through.
- **Rules travel with the history:** every adjustable number (lifespans, fertility, death rates, places, the
  placeholder rules) is copied into a history when it starts and saved with it, so a reopened history carries
  on under its own rules whatever the current settings are. The rule *functions* are code, named by
  `RULES_CODE`; loading a history made under a different version is flagged.
- **Saved form:** the rules, people (with mother, father and marriages), founding family lines, and the event log.
  Children, ancestors and relationships are worked out from those.

## Lifespans and outliers
- Each person has a **constitution** that multiplies their race's typical lifespan. Most are within about
  10% of 1. About 1 in 25 is unusually hardy (up to half as long again) and 1 in 25 frail (down to half).
  The everyday part runs in families (half from the parents); the rare outlier is the person's own.
  ⚠ How much runs in families is a temporary rule.
- Old age starts to tell at 85% of a person's own lifespan, calibrated so that half of those who die of
  old age have done so by it. No one outlives 1.6 × their race's typical life.
- Illness and injury cut lives short at any age, so some elves die young. Every death records its cause.

## Murder
- **Every death has a kind:** old age, illness, injury, childbirth, murder or execution (`deathKind` on the
  person and `kind` on the death event).
- **Ordinary murders** (rare; `murderRate`): an adult kills someone near to a motive: a parent (an
  inheritance), a spouse (a bitter marriage), someone from another family (an old feud), a trader or innkeeper
  (robbery), or anyone (jealousy). Each has a method.
- **Serial killers** (`serialChance` on coming of age, about 1 per century in these places): a hidden
  signature of method, calling card and kind of victim (travellers and newcomers, young women, the old, anyone
  caught alone). Once their time comes they kill now and then, near home, or anywhere if their trade takes them
  travelling. Each killing is a chance of being caught, more so the more there have been. A caught serial
  killer is hanged and their whole series comes to light. Others die uncaught, or are still at large.
- **The truth and what people believe:** each murder records who did it, how, why (or the calling card), and
  what people believe happened. A quiet method (poison, a push, drowning, a blow) may pass for a natural death.
  A known murder may be solved (the killer hanged or exiled), stay unsolved, or be pinned on an innocent, who is
  hanged or exiled in their place. A killing taken for natural keeps that belief, and gains the year the truth
  came out if the killer is caught later.
- `cases(H)` lists the serial killers with their signature, killings and status. In the viewer, search
  `murder`, `unsolved` or `killer`.
