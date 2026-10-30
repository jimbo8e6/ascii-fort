# Family simulation prototype

A standalone test of the family simulation for Connected Histories (see `docs/connected-histories.md`).
Nothing in the game uses it.

- `family-sim.mjs`: the simulation. Typical lifespans in `RACES` (James: humans 80, elves 600, dwarves
  300, orcs 60), with placeholder fertility and death rates; ⚠ temporary inheritance rules
  for mixed-race families in `TEMP_RULES` (one small function each, to be decided); other placeholder
  rules in `RULES`; the places it runs over in `PLACES`; five placeholder notable founders in `NOTABLES` (the first rulers of the seats); offices and titles in `OFFICES`.
- `test.mjs`: runs the checks (the six first asked for, then murder, prisons and offices) and times generation. `node test.mjs` prints the report and writes
  `results.txt`, plus a saved history in `out/` (not committed).
- `chronicle.js`: the browser for a finished history (search, person cards, office pages, relationships),
  shared by `viewer.html` and the game, where it's the Chronicle.
- `build-viewer.mjs`: copies the simulation and `chronicle.js` into `viewer.html` and the game's `index.html`
  (between `// <family-sim>` and `// <chronicle>` markers). `test.mjs` runs it.
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
- **Serial killers come by chance** (`serialTurnChance`): each year someone may turn, about one new killer every
  60 years on average, so some stretches have none and some have two at once. Each has a hidden signature of
  method (and weapon), calling card and kind of victim (travellers and newcomers, young women, the old, anyone
  caught alone), and kills first straight away, then now and then over a career of decades. A founding killer,
  with victims from the last years of the war, is a chance too (`foundingKillerChance`). Serial killers keep out
  of petty crime and are never the one wrongly blamed. Caught, they're condemned to hang or imprisoned for
  life, and their whole series comes to light. So a game may start with a killer at large, one awaiting the
  gallows, one in the cells for life, an old unsolved mystery, or none of these (the tests show the shares).
  The history stops at the start year, so no one goes on killing during play.
- **Weapons:** every murder records what it was done with (a bone-handled knife, a knotted cord, a smith's
  hammer, a vial of nightshade…, or nothing for a drowning or a push), ready to turn up later as evidence.
- **The truth and what people believe:** each murder records who did it, how, why (or the calling card), and
  what people believe happened. A quiet method (poison, a push, drowning, a blow) may pass for a natural death.
  A known murder may be solved (the killer condemned to hang, imprisoned or exiled), stay unsolved, or be pinned on an
  innocent, who suffers in their place. The past is never rewritten: a killing taken for natural keeps that
  belief, and the caught event records which killings came to light (`revealedIn`, `solved`).
- `cases(H)` lists the serial killers with their signature, killings and status. In the viewer, search
  `murder`, `unsolved`, `killer` or `prison`.
- On a person's card in the viewer, **Their death** shows how they died if they were murdered or put to death
  (the truth, and what people believe), **Their killings** the people they killed (with what was believed of
  each, and whether it was ever solved), and **Crimes and punishment** their crimes, sentences, time in the cells
  and any wrongful blame.

## Prisons
- **The cells beneath the castles:** dwarves go to Kharn Dolum, orcs to Gor Marakh, and everyone else to the
  nearest human castle (Harrowgate Keep for the west and the Wenmere, Castle Aldermere for the rest).
- **Crimes:** theft, assault and poaching (mostly by hunters) happen to and between ordinary people, each with
  a chance of being caught. Uncaught crimes are still recorded, as the truth.
- **Sentences:** murder 15 to 40 years, or life; theft 1 to 4; assault 2 to 6; poaching 1 to 3. These are for
  a human, multiplied per race (`sentenceScale`): orcs 0.75, following their lifespan; dwarves a gentler 2 and
  elves 1.5, so a thieving dwarf or elf serves years rather than decades. Wrongly blamed innocents are imprisoned
  too.
- **Justice by culture:** only the human castles hold a court. There the condemned (killers and wrongly blamed
  innocents alike) wait in the cells for the lord's court, which sits every 6 years (`courtEvery`, years set by
  the seed: `courtSits`), and hang then. Dwarves are judged by their lawspeaker and the condemned are put to
  death the next year. The orc War Chief judges in person and puts the condemned to death at once. The elves
  exile rather than hang. A caught elf serial killer is usually locked away for life
  instead; rarely (`hushSerial`, likelier for someone in office: `hushOfficial`) the case is hushed up and
  they're quietly exiled, nothing comes to light, and they may go on killing elsewhere. Exiles have left
  their own people's justice for good: caught again for anything, they go before the human court that serves
  where they live now, which can hang them. Lesser crimes go to the
  cells as before.
- **In the cells:** prisoners don't marry, have children, commit crimes or suffer them; they fall ill more
  easily; and they go home when their time is up. Who's in which castle now: `prisoners(H)`.

## Offices
A trade is a livelihood; an **office** is a post someone holds for a while. Holdings are events
(`office`, `left office`, `vacant`), so they follow the same rules as the rest of the history: a later start
only adds to them, and a saved history carries on the same. All the posts and titles are in `OFFICES`.
- **The five seats and their rulers** (James's rules):
  - **Lords** of Castle Aldermere and Harrowgate Keep pass to the eldest child. A child who is dead, in the
    cells or has ever been convicted is skipped. With no child, the nearest relative inherits (a descendant
    before anyone as near, the eldest first). With no relative, the seat stands vacant, and then the highest in
    rank at the castle (the steward first) takes it, or failing them the eldest of the household. A child
    heir rules under a **regent** (the steward) until they come of age. A conviction or exile costs the title.
  - **The Thane** of Kharn Dolum inherits the same way.
  - **The Elder** of Aelith Vara is chosen by the circle of elders, usually the eldest, after a vacancy
    (elf consensus is slow).
  - **The War Chief** of Gor Marakh holds the seat by **challenge to the death**: now and then someone
    challenges, and a vacant seat goes to the strongest claimants, who fight for it. Strength follows age,
    being a warrior, and constitution. The loser's family mostly stays, but each grown member may leave or
    **vow revenge**; a vow can be carried out years later as another fight to the death, which can win the
    chieftaincy too.
- **Posts at the seats**, appointed by the ruler (or the regent), highest in rank first: Steward, Captain of
  the Guard, Magistrate, Priest, Jailer at the human castles; Hold-Warden, Shield-Captain, Lawspeaker,
  Rune-priest, Keeper of the Deeps at Kharn Dolum; Voice of the Elder, Warden-Captain, Lore-keeper at Aelith
  Vara; Blood-Second, Shaman, Pen-Master at Gor Marakh. A ruler looks to fitting trades first (a guard for the
  captain), and a new ruler may dismiss those who served before (`newBroom`). Ageing post-holders may step down.
- **The hangman:** one, appointed at Castle Aldermere, travels to every sitting of a human court and lodges at
  the castle while there (`lodged` on the court event). With no hangman, the castle's jailer does it.
- **Villages:** every other place has a head and a priest in its main race's titles (Reeve and Priest,
  Clan-Head and Rune-priest, Grove-Keeper and Grove-priest, Camp Chief and Shaman), appointed by that race's
  ruler.
- **The court has people in it:** each `court` event names who presided (the lord, or the regent), the
  magistrate and the hangman, and whom it hanged. A vacant seat, or a child lord with no regent, means the
  court can't sit, so the condemned wait for the next sitting. Every verdict, including the wrongful ones,
  records its `judge`: the magistrate (or lawspeaker, Elder or War Chief), failing them the ruler.
- **Who may hold office:** the seat's own race (⚠ temporary rule `mayHold`; the roster suggests the culture
  someone was raised in). No one who has been in the cells or exiled is given an office. Rulers commit no petty
  crimes, and office-holders no theft or poaching. Office-holders don't move away; a spouse moves to them.
- **Questions:** `holdings(H)` (every holding, with how it began and ended), `officeHolders(H)` (every office
  now), `titles(H, id)`, `verdicts(H, judge)`. In the viewer, search `offices`; a person's card lists their
  offices and the verdicts they gave. Every title is a link to that office's page: everyone who has held it in
  turn, how each came to it (inherited from whom, and how they were related; next in rank; appointed by whom;
  won in a fight), why each held it no longer, the vacancies between and why, and the other offices at that place.
