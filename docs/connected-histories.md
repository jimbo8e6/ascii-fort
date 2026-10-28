# Connected Histories: design notes

Working notes for the history system. Nothing here is canon until James confirms it. The family
simulation prototype lives in `prototypes/family-sim/` and is separate from the game.

## The idea
People, families, places and objects share one connected past. When the player finds something or
meets someone, there is a history behind it that fits with everything else. Ordinary histories (a line
of bakers) are as valid as famous ones (a displaced king in the family tree).

## Decisions so far (from James)
- **Start date:** a number of years after the war. The default start is one year after; before the game
  starts the player may move time forward. A background task then simulates family lines and item
  histories up to that year. A later start may take a while to build.
- **The war story:** James writes the story of the war and the times before it. Over time it gets
  muddled in retellings and copies, but clear versions remain in the world for players to find.
- **Families can cross race.** Elves and dwarves live longer than humans; exact lifespans to be decided.
  The prototype uses adjustable placeholders.
- **Items:** James is choosing the actual items (weapons, armour, scrolls, books). When the player takes
  an item they become a new owner in its chain. NPCs can find things the player has used or left.
- **Journal:** records everything the player has encountered, and only that. Taking something to a
  historian can open up its past in the journal. Once a world is built, a main-menu screen lets you look
  through all the items and people in the world and see their lineage (the full truth).
- **Hidden followers of the ancients:** independent pockets of believers, unaffiliated with each other,
  hidden, and *not necessarily family groups*.
- **History is fixed while you play.** Only the player's own actions (and NPCs reacting to them) add to it.
- **Hardcore / heir mode is only an idea, not planned work and not part of the prototype:** if you die
  you're dead for good, the game advances 10 years and you play as your heir.

## Design principles
- One record of events is the truth. Accounts (what a person says, what a book or inscription records)
  are separate, and can be forgotten, garbled, inflated or hidden.
- History is simulated year by year from the end of the war, every random choice hashed from the seed,
  the year and who it concerns. So the same seed and start year give the same world, and a later start
  is the earlier start plus more years: nothing before the earlier start changes.
- Once something is established (an ancestry, an item's owners), it stays put. What the player has been
  told or shown is saved, so later changes to the generator can't contradict it.
- Places stay hand-authored; history is built on them.

## Open questions
- Lifespans per race, and the inheritance rules for mixed-race families (race, lifespan, surname, where a
  couple lives). The prototype marks its temporary choices in `TEMP_RULES`.
- The longest start a player may choose: to be set from measured build times, not guessed.
- Whether a later start also changes what's built (the gazetteer's era states for war sites).
- Whether the player has their own family line and birthplace.
