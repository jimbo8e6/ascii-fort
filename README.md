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

## The world

The world is hand-made: one continent, translated from a painted map (`map/painted-map.jpg`). Each pixel of the painting is 6 blocks, so the whole map is about 8,700 × 6,500 blocks with roughly 37 km² of land, about the size of Skyrim. Open sea surrounds it. −z is north.

- **The Greyspine:** snow-capped mountains along the whole north coast, with a smaller range in the north-west.
- **The Wenmere:** old forest filling the west, with the Mistwater lake at its heart.
- **The Hollow:** open grassland in the middle, where the Vael comes down out of the mountains.
- **The Rustwaste:** a red plateau in the east, cut into flat-topped mesas with sheer banded cliffs of red rock.
- **The south:** a sand desert, and big red dunes along the south coast.
- **The marshes:** low ground in the south-west, pocked with pools and channels.
- **Fort Greyhold** stands at Greyhold Pass, on the west bank of the Vael where it leaves the Greyspine. That's where every world starts.

## Places

The places come from the world gazetteer (draft 1) and are set by hand on the painted map, in `PLACES` in `index.html`. They're the same in every world. For now each uses one of the existing building kinds; the gazetteer's special buildings and peoples will come later.

| Region | Places |
|---|---|
| The Greyspine | **Kharn Dolum** (the dwarves' hold, by the Vael's source; see below), **Anvil's Rest** (village), **the Cold Gallery** (ruins) |
| The Hollow | **the Victory Fields** (a field of monuments and grave mounds), **the Sunken Throne** (ruins, beside the Vael), **Oathstone** (one great standing stone), **Concord Landing** (village) |
| The Vael Marches | **Hollin's Ferry**, **Kelford** and **Millbrook** (villages; Kelford and Millbrook have windmills and bakeries), **Castle Aldermere** and **Harrowgate Keep** (forts), **Greycrest** and **Scarrow Hovel** (villages) |
| The Wenmere | **Aelith Vara** (the elves' city; see below), **Mistwater** (by the lake) and **Thornwick** (villages), **the Silent Grove** (a stone ring round a fallen altar) |
| The Rustwaste | **Gor Marakh** (fort), **Ashen Camp** and **Dust Wells** (villages), **the Broken Bastion** (ruins) |
| The Saltline | **Port Cassel** (village, at the Vael's mouth), **Gullcove** (village), **Wreck Point** (a tower on the western cape) |

- **Village kinds:** a village with a windmill farms. One without lives by woodcutting and hunting.
- **Placement:** places along the Vael stand back from the water, and the River Road towns stay on its west bank.
- **No random places any more:** the seed no longer adds forts, towers, ruins or villages. Smaller places will be added by hand.

## Rivers, roads and discovery

- **Rivers:** the rivers are traced by hand from the painting, and they flow downhill. Each has its own water level along its length, falling from its source to its mouth. The water's surface slopes with it, the ripples drift downstream, and where the river drops steeply it runs white over rapids. Each river sits in a valley sloping down to a channel below its water level; the valleys are wider in the mountains.
  - **The Vael** rises in a mountain tarn in the Greyspine and runs south through Greyhold Pass and the Hollow, gathering tributaries. One of them flows out of the lake at Mistwater. The Vael splits into a delta above the desert, then runs down rapids to the sea on the south-west coast. It grows from about 5 blocks wide at its source to 13 at its mouth.
  - **The delta's side channels** split off at the Vael's level, fan out south and east and run dry in the sand.
  - **Levels:** a river's level follows the land along it, a little below it and smoothed, but never rises going downstream, so it cuts through any ridge in its way. It never falls faster than 3 blocks in 100. A tributary meets the river it joins at the same level; where it comes in lower, the main river drops to meet it from there on. The Vael meets the sea at sea level.
  - **The lake at Mistwater** sits a block below the lowest point of its shore, and its outflow starts at that level. The tarns take the level of the river running through them.
- **Roads:** the gazetteer's five roads, laid by hand in `ROADS` through places and waypoints. They wind gently between their stops.
  - **Graded:** each road's height is the land along it smoothed out, then eased so it never climbs steeper than about 1 in 8 (12%). Where it meets a hill it runs through a cutting; across a dip it rides an embankment. The cuttings and embankments blend back into the land within a few blocks, and never fill in water.
  - **A surface of its own:** like the bridges, the road is a mesh rather than blocks. It's a smooth strip of packed earth along the graded height, laid just over the ground, with dirt edges. You walk on it and carts drive on it, so it climbs a hill in one even slope.
  - **The River Road** runs down the Vael's west bank: Kharn Dolum, Fort Greyhold, past the Victory Fields, the Sunken Throne and Oathstone, then Concord Landing, Hollin's Ferry, Kelford, Millbrook, Castle Aldermere and Port Cassel.
  - **The Hollow Road** runs from the forest north of Thornwick, past Oathstone, over the Vael at Oath Ford and past the Broken Bastion to Gor Marakh.
  - **The Western Road** runs from Thornwick to Kelford.
  - **The Kelford Road** crosses the Vael on Kelford's stone bridge, then goes to Greycrest and Dust Wells.
  - **The Harrowgate road** joins Harrowgate Keep to Scarrow Hovel.
  - **Crossing the Vael:** there are only two crossings. At **Oath Ford** the riverbed rises to a single block of water and the banks slope down to it, so you wade across. **Kelford's bridge** is always stone. Hollin's Ferry has no crossing yet; its ferry will come later. Tributaries get ordinary bridges.
  - **Bridges:** where a road crosses a river it runs straight over a bridge model, with clean straight edges at any angle. The deck is level with the higher bank and carries on level until it meets ground, so you never step down more than one block. The seed picks one of two kinds:
    - **Wooden:** a slatted deck on stringer beams, posted handrails with top and middle rails, and braced piles down to the riverbed.
    - **Stone:** elliptical arches (two or three on longer spans, with piers between), parapet walls with capstones and a paved deck. Iron-posted lanterns stand on the parapets, a pair at each end and then alternating sides every ~9 blocks. They glow steadily, share the torch light pool, and light the bridge at night. Built in sandstone in the desert. Spans up to 40 blocks are stone about 55% of the time. Longer ones are usually wooden trestles, but about 1 in 8 is a long multi-arched stone viaduct.
    - **Collision** follows the real deck, and the rails and parapets stop you walking off the side. Boats fit underneath.
  - **Leaving places:** roads leave fort gates and tower doors straight outwards before turning, so they never cut across a structure's walls.
  - Trees never grow on them. They show on the map at every zoom level.
  - A guard will tell you when a road leads to a place they mention.
- **Discovery:** places are hidden on the map until you've been near one. Then a banner announces it (*DISCOVERED — Kelford*) and its marker appears. The starting fort is announced when you first enter a world. Discoveries are saved with each world.

## Villages

Villages on a road have the road meeting at a village square with a stone well (a village off the roads gets a street of its own), and cottages line each road on alternating sides, turned to face the street at any angle.

- **Cottages** are built as 3D models, not blocks:
  - **Outside:** a stone plinth, plaster walls with dark timber framing, framed windows with coloured shutters, an open door with a lantern beside it, and a pitched tiled roof with overhangs and a chimney with a pot.
  - **Single-storey:** a living room and a bedroom, split by an inner wall with a doorway.
  - **Two-storey:** a living room downstairs, stairs up the side wall, a bedroom on a proper upper floor with a banister round the stairwell.
  - **Furniture:** a table and benches, a rug, a shelf of pots, a barrel, a bed with pillow and blanket, and a chest. Inside surfaces are a little darker than outside.
  - **Fireplace:** a stone fireplace with a hearth, logs and a mantel.
- **Fires:** most houses light the fire in the evening, through the night and early morning, and some cook at midday. A lit fire flickers and lights the room. At night its windows glow, and smoke drifts up from the chimney. When the fire's out there's no flame and no smoke.
- **Solid:** walls, the plinth, floors, stairs and furniture are all solid. You go in through the door and climb the stairs, and you can't walk through tables or into the fire.
- **Windmills:** farming villages have one, a tapered tower mill with a stone base, a door facing the square with a lantern, small windows, a pointed cap and turning sails.
- **Villagers have homes, names and jobs:** each cottage houses a family of one to three, e.g. *Ulric Hollins*.
  - **Jobs:** in a village with a windmill, the miller lives in the house nearest it. The head of about half the other households farms, and the rest keep house.
- **Daily routine** (times vary a little per person):
  1. Asleep in bed overnight.
  2. Up around 6. The first one up lights the fire, then breakfast at the table.
  3. Morning work: the miller at the mill (the sails only turn while they're working), farmers in the plot behind their house, homemakers at chores and fetching water from the well.
  4. Everyone gathers at the square around midday.
  5. Afternoon work.
  6. Evenings at home by the fire and table.
  7. Bed around 21:30.
- **Fires follow the people:** a fire only burns while someone's home and awake. Chimney smoke and lit windows now mean someone's in.
- **Getting around:** villagers walk a path network covering the streets, the square, each house's door, its rooms, stairs and bed, and a path round the outside to the plot behind. They go through doorways and up the stairs instead of through walls.
- **Talking:** the panel shows their name, job and village. Ask *Who are you?*, *What are you doing?* (it depends on what they're actually doing) and, for millers and farmers, *Where do you get your wheat seed?* Seed is kept back from each harvest and stored in the house, with a count of sacks; when a harvest fails, it's bought from the merchant who comes from the nearest other village.
- **Farming:** each farming household (and the miller's) has a wheat field on the plot behind the house, with tilled soil and furrows.
  - **Sowing:** uses a sack of the household's seed, and the farmer walks up and down the rows.
  - **Growing:** the wheat takes about 40 game hours (well under two days), rising from green shoots to tall golden ears.
  - **Harvest:** a ripe field yields 4–6 sacks. One sack is kept back as seed and the rest are carried on the farmer's back to the windmill (in a village without a mill they're stored at home). The field is left as stubble until it's sown again.
  - **No seed:** with nothing to sow, the field stays bare until a merchant brings seed.
- **Milling:** the miller grinds one sack of wheat into one sack of flour every 1½ game hours. The sails turn only while there's wheat to grind and the miller is at work. Sacks of wheat and flour pile up by the mill door to show its stock. Between batches the miller works their own field.
- **More to ask:** *How are the crops?* (stage and when they'll be ready) and the miller's *How's the mill?* (wheat waiting, flour ready).
- **Bakery:** in villages with two or more cottages, the cottage nearest the square is the bakery, run by the baker's household. It has a domed stone bread oven that glows and sends smoke up the chimney while baking, a shop counter by the door showing the loaves in stock, sacks of flour and a hanging sign with a loaf.
- **Market stall:** a striped-awning stall stands on the square.
- **The baker's day:** up before dawn to bake (one sack of flour makes 8 loaves, and they only bake what will sell), at the stall at midday, minding the shop in the afternoon.
- **Coins and the bread chain:** every household has a purse of coins, and coins flow back along the chain.
  - At midday each household buys a loaf at the stall if they can afford it (2 coins). "A loaf, please." "Two coins, thank you."
  - They eat a loaf a day at breakfast.
  - In the afternoon, when the bakery's flour runs low, the miller carries up to 3 sacks over (white sacks on their back) and is paid 7 coins a sack.
  - The miller pays farmers 3 coins for each sack of wheat they deliver.
  - A village with no mill starts its bakery with flour, and the baker says a merchant brings it from the nearest village with a mill.
- **More to ask:** the baker's *How's business?* (stock, sales today, where the flour comes from), the miller's *Who buys your flour?*, and everyone else's *Where do you get your bread?*
- **Your purse and pack:** you start with 30 coins. What you carry shows in the bottom-right corner, and it's saved with your world.
- **Trading:** *Let's trade.* is now a conversation option with every villager. Prices rise when stock runs short, and people pay a little under value for what they buy.
  - **Bakers:** sell bread; buy flour.
  - **Millers:** sell flour and spare seed; buy wheat.
  - **Farmers:** sell spare seed, buy seed when they're short, and buy bread.
  - **Everyone else:** buys bread when their household is low.
  - They only pay what their household can afford.
- **Travelling merchants:** on market days (a bit over half of all days) a merchant from a neighbouring village drives a cart in along the longest street at about 9:00, parks near the square, and leaves at 16:00.
  - **Look:** a plum coat and broad feathered hat.
  - **With the village:** when they arrive they sell seed to households that have run out, sell flour to a bakery with no mill, and buy up surplus flour from the mill and surplus bread from the bakery. That's money coming in from outside.
  - **With you:** they trade every kind of goods, at a mark-up. Ask *What's the news?* to hear what they did that morning.
- **Farming and forest villages:**
  - **Farming villages** have a windmill: farmers, a miller and a bakery.
  - **Forest villages** have no mill, no fields and no bakery, so they can't make bread. Instead they have:
    - **a woodcutter** (red jerkin, axe on the shoulder), who splits lumber at a chopping block behind the house; the log stack shows the stock;
    - **a hunter** (green hood, bow and quiver), who goes out hunting on good days and hangs the hides on a drying rack behind the house. See *Hunting* below.
  - Households eat bread if they have it, otherwise meat.
- **Trade runs between villages:** each farming village's bakery is paired with a neighbouring forest village linked by road.
  - **Out:** every other day at 8:00 the bakery loads its spare bread onto a cart. A carter from the baker's household (leather jerkin, flat cap, whip) drives it along the road to the forest village, arriving around 9:30.
  - **There:** households buy bread (up to two loaves each), and the carter buys meat from the hunter, tanned hides, and lumber from the woodcutter. The cart stays parked until 12:30, and you can talk and trade with the carter.
  - **Back:** the cart is home by 14:00. Meat goes on sale at the bakery and the midday stall, and travelling merchants buy the hides and lumber, bringing coin into the village.
  - **Off-screen too:** runs happen whether or not you're nearby. Each village's roster exists as data even if you've never been there, and both villages' memories are updated at load, arrival and return. You'll see the cart on the road if you're within about 160 blocks.
  - **Asking about it:** bakers answer *Where does your cart go?* (and what the last run sold and bought); woodcutters and hunters answer *Who buys your lumber / meat and hides?*; forest villagers explain where their bread comes from.
- **Groundwork for trade:** a goods catalogue (wheat seed, wheat, flour, bread, each with a value and source) and per-household stock. Farming, milling, baking and trading will build on this.
- **Job outfits:** each job has its own look, so you can tell who's who at a glance:
  - **Baker:** white apron and cap.
  - **Miller:** flour-dusted smock and flat cap.
  - **Farmer:** straw hat and pitchfork.
  - **Homemaker:** headscarf.
- **Villages remember:** the first time a village comes to life, its roster is recorded: names, jobs, homes, household stock and coins, field progress, the mill's store and the bakery. From then on it's reused rather than worked out again, so jobs are never reassigned. The memory is kept when you leave and come back, and it's saved with your world.
- **Time passes while you're away:** each remembered village notes when you last saw it. When you come back, its life is replayed hour by hour for the time you were gone, up to 40 days:
  - crops ripen, are harvested (a sack kept back as seed) and resown;
  - wheat goes to the mill and is paid for, and the mill grinds it;
  - the baker bakes, households eat breakfast and buy bread at midday, and the miller supplies the bakery;
  - merchants visit on market days.
  
  The first villager to see you says "Welcome back! You've been away 3 days.", and anyone will answer *What's been happening?* with a summary.
- **Simulation scope:** only villages near you are fully simulated. When you arrive, everyone starts wherever their routine has them at that hour, and crops keep growing while you're away.
- **On the map:** villages show as a little house marker once discovered.

## Wildlife

The countryside has docile animals for now. Nothing attacks you, but the forest villages' hunters hunt them (see *Hunting*).

- **Deer** graze in small herds in plains and forests. The herd has a stag with antlers and a few does. Get too close and the whole herd bolts.
- **Rabbits** nibble the grass and sit up now and then. Their colour suits the land: brown, white in the snow, or sandy in the desert. They zig-zag away if you come near.
- **Squirrels** live where there are trees. When startled they run for the nearest trunk and climb it, then come back down once you've moved on.
- **Songbirds** (sparrows, robins and blackbirds) hop and peck on the ground and fly off in an arc when you approach.
- **Hawks** circle high over open country during the day.

Animals spawn with the chunks around you, so each patch of land always has the same sort of wildlife. They're quieter at night: most of them rest, and they let you get a little closer before they run.

## Hunting

The hunter in a forest village hunts real animals with a bow and arrows.

- **Going out:** on good hunting days the hunter walks to the edge of the village and looks for game within about 60 blocks. Deer come first; otherwise rabbits, squirrels or birds. If there's nothing nearby, they head further afield, out of sight, as before.
- **Stalking:** the hunter crouches and creeps in to bow range: about 20 blocks for a deer, 12 for small game. Animals let a careful hunter get closer than they'd let you. If a tree or a rise is in the way, the hunter moves closer for a clear shot.
- **The shot:** the arrow is a real projectile. It flies on an arc, can miss, and hits wherever it actually lands. Longer shots stray more.
  - **Rabbits, squirrels and birds** go down to any hit. A squirrel shot on its tree or a bird shot in the air falls to the ground.
  - **Deer:** a **head or heart** shot drops it where it stands. A **body** shot anywhere else sends it running and bleeding, leaving a trail of blood, until it collapses. The hunter follows the trail, and takes a finishing shot if the deer stops within range. An arrow in the **leg** only sends it running, and the arrow soon works loose.
  - The rest of the herd scatters at the shot.
- **Bringing it home:** the hunter carries the kill home on their back. A deer is a full load; otherwise they'll take up to three small animals. At the rack they gut it and put the meat and hide into the household's stock:
  - a deer gives 4 cuts of meat and a hide;
  - anything smaller gives 1 cut of meat.
- **Arrows:** the hunter carries up to 12. Arrows pulled out of a kill are kept; misses are lost and stay stuck in the ground for a while. They fletch new arrows at the rack, one an hour, and with none left they don't hunt.
- **Asking about it:** talk to the hunter while they're out ("Keep your voice down. There's a deer just over there.") or at the rack afterwards, where they'll tell you what they brought home.

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

## The ground

The land is a smooth, continuous surface rather than blocks: real slopes and curves, with no stair-steps. Every building stands on it as a model.

- **How it looks:** the ground is coloured by what the land is (grass, darker forest floor, sand and beaches, snow, red sand in the Rustwaste, packed earth in fort courtyards). It turns to bare rock as the slope steepens: sandstone in the desert, red rock on the mesas. It's lit with smooth shading, so hills catch the light.
- **Walking:** you walk on the surface itself, smoothly up and down. Slopes steeper than about 50° (the mesa cliffs, the sharpest ridges) are walls you can't climb. Going downhill you stay on the ground rather than stepping off into the air.
- **Water:** the sea is a flat surface just under sea level wherever the ground dips below it, so shorelines follow the land's curves. The lake and tarns are flat at their own levels, and rivers slope downstream (see *Rivers*). You can swim in any of them.
- **No caves:** a smooth surface has no underside, so the caves are gone for now. They may come back later as separate cave models behind entrances.

## Forts

Forts are stone models rather than blocks: brick, or sandstone in the desert.

- **Walls:** curtain walls 3 blocks thick with a walkway along the top, behind a parapet with merlons on the outside.
- **Corner towers:** square, with a plinth at the foot and a band of stone at walkway height. At the top is a chamber the walkways run through by doorways, then a roof and battlements.
- **The gatehouse:** two towers either side of an arched gateway, with heavy iron-banded gates standing open.
- **Stairs:** two flights of stone half steps either side of the gate, up to the walkway.
- **The keep:** a hollow keep in the courtyard with a doorway, window slits and battlements. Stacks of crates stand about.
- **Solid:** walls, towers, stairs, gates and crates are all solid. You walk the wall walks and climb the stairs, and guards patrol the walls. Walls block arrows and line of sight.

## Kharn Dolum

The dwarf capital is a hold cut into a mountain, the first place with buildings of its own.

- **The mountain:** a craggy peak of rough rock heaped over the hold, down to the ground on its flanks and back.
- **The one way in:** a walled forecourt behind an outer gatehouse, then a dressed stone facade with pilasters, a cornice and a band of runes over the great gate. The iron gates stand open.
- **Statues:** two giant dwarves with axes stand either side of the gate.
- **The great hall:** carved into the rock and lined in dark stone, with two rows of pillars running back to a dais and a high seat. Four forges stand along the walls, each with a stone hearth, a fire burning, a hood and chimney, and an anvil beside it.
- **The dwarves:** dwarf guards, short and broad, bearded, in mail under an iron helm and carrying axes. They keep the outer gate, the forecourt and the hall, and they have their own greetings (*Well met, surface-dweller.*). Talking to one shows *Dwarf guard*.
- **How it's built:** a place's `style` picks its layout. Kharn Dolum's (`buildHold`) gives a single `hold` model (`makeHold`). The rock is solid round the hall; the crags are lumpy icosahedra roughened by the hold's seed and kept above the hall's ceiling.

## Aelith Vara

The elves' city is built in giant trees, with little stone, round a shrine grove.

- **The great trees:** five huge trees, up to 30 blocks tall, with flared roots, heavy boughs and great crowns of leaves.
- **Tree-built halls:** a wooden platform rings each trunk 6 blocks up, with a rail round it. On the largest stands the great hall: a ring of pale columns under a golden dome, with a raised seat by the trunk. The others carry open pavilions under roofs of leaves.
- **Getting about:** walkways with rails join the platforms, and stairs of floating half steps on slender stems wind up round three of the trunks. You can climb them and walk the walkways.
- **The shrine grove:** a pool in a pale stone rim under a carved wooden arch, with a pale tree beside it and a ring of lantern posts.
- **Lights:** moon-pale lanterns glow on the platforms and round the shrine.
- **The elves:** elf wardens, tall and slim in long grey-green robes and cloaks, with pale hair and longbows. They watch the shrine, the paths and the platforms, and have their own greetings (*Peace on your road, stranger.*). Talking to one shows *Elf warden*.
- **Not a village (yet):** Aelith Vara keeps its village marker but has no households or trade for now.
- **How it's built:** a place's `style: 'elf'` gives a layout (`buildElfCity`) with one `elfcity` model (`makeElfCity`). The parts kit gained turned box colliders (`solidRot`), so stair steps, walkways and rails can be solid at any angle.

## Trees

Trees and cacti are low-poly models with flat-shaded facets, each turned and tinted a little differently.

- **Pines** fill the forests: three stacked cones on a tapering trunk, 9–14 blocks tall. In the snowfields they're shorter and white-tipped.
- **Oaks** stand here and there on the grassland, 6–9 blocks tall, with a lumpy round crown.
- **Cacti** dot the deserts: ribbed green columns with one or two arms.
- **Solid:** you can't walk through a trunk. Crowns block arrows and line of sight, so a hunter or a guard can't see or shoot through a tree. Squirrels climb the trunks.
- No trees grow on roads, in water, on very steep or very high ground, or inside places.

## Guards and conversations

Guards patrol the walls and courtyards and stand at the gates. They're friendly.

- **Noticing you:** a guard sees you within about 16 blocks by day and 9 at night, as long as no blocks are in the way.
- **Greeting:** once you're within about 7 blocks, they stop, turn to face you and greet you ("Good day, traveller.", "Evening. Keep to the torchlight.").
- **Carrying on:** walk off and they go back to their rounds, forgetting you after a few seconds.
- **Talking:** within about 4 blocks, press **E** (or tap **TALK**) to open a conversation. The game pauses and the mouse is freed. Pick an option with the mouse or the number keys; **Esc** leaves.
  1. **What can you tell me about this area?** The guard answers from the world itself:
     - the name of the place you're at;
     - the two nearest named forts, watchtowers or ruins, with compass direction and rough distance;
     - which way the land changes (desert, snowfields, pine woods, grassland, the sea, the lake, a mountain tarn, the marshes);
     - the nearest river, by name if it has one (*The Vael runs just to the north-east.*), or a stream;
     - a warning at night.
  2. **Goodbye.**
- **Place names:** every place has its name from the gazetteer, e.g. *Fort Greyhold*, *Kelford*, *the Sunken Throne*.
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
- Saves from before the hand-made world are ignored, so those worlds start again at Fort Greyhold.

## Day and night

A full day lasts an hour of real time, or 3 minutes at 20× fast-forward (K). The game starts at 18:30, just after sunset. Add `?time=` to the URL to start at another hour, e.g. `index.html?time=12` for noon. The clock and day number show under the minimap and on the world map.

- **Sky:** a gradient dome with a glow around the sun. Dawn and dusk are pink and orange, noon is blue, and stars fade in at night.
- **Sun and moon:** the sun rises in the east, peaks to the south and sets in the west, and the moon is always opposite it.
- **Lighting:** one directional light follows whichever of the two is up, and the sky light, ground light and fog colour all follow the time of day.
- **ASCII view:** the shader's brightness drops in daylight so bright scenes don't saturate into solid `@`.
- **Torches** dim during the day.

## World seed and map

The shape of the land, the places and the roads come from the painted map and the gazetteer, and are the same in every world. The seed decides the small-scale detail (hills, trees, wildlife) and the villagers. Add `?seed=` to the URL to get a different one, e.g. `index.html?seed=42`. The default is 1337. The world map also has a seed box and a NEW WORLD button.

The world map (M) shows biomes, water depth and hill shading, with the fort and your position and facing marked. Drag to pan, scroll or use +/− to zoom, from 256 to about 10,000 blocks across (the whole continent). Structure markers thin out when zoomed far out, and an N marker shows north, and CENTRE ON ME to jump back to yourself. A minimap in the top-left corner (N) follows you and shows the biome (or, in water, the sea, lake, tarn, river or marsh) and coordinates you're at. Both are drawn from the same climate and height functions as the 3D world, a few rows per frame so the game never stalls.

## How it works

1. **Terrain.** Height comes from layered 2D simplex noise: broad hills, smaller bumps, and occasional mountains from a second noise layer. The ground is flattened around the fort and the start of the road. Columns are rock underneath, dirt near the top, and grass on top; steep or high ground is bare rock. Pine trees are placed using a forest-density noise and a per-column hash.
2. **The painted map.** `map/build.py` (Python, with numpy, scipy and Pillow) measures the painting and writes the result into the page.
   - **What it measures:** the sea, the lakes, and how mountainous, snowy, wooded, marshy, sandy, mesa-like and dune-covered each spot is, all judged from the paint colours.
   - **What it stores:** a grid of 24-block cells, holding the signed distance to the sea and to the lakes plus those seven amounts. That's about 140 KB, compressed, in a `<script id="mapData">` block.
   - **In the game:** the page unpacks the grid when it loads and samples it smoothly. The lookup point is wobbled with noise so coasts and borders aren't smooth blobs.
   - **Height:** it rises from beaches to hills inland, and wooded country is hillier. The Greyspine is lifted with sharp ridges on top, the Rustwaste is stepped into mesas, the south gets dune ridges, the marshes sit just about at water level, and lakes are dug out to below sea level.
   - **Rivers:** they're polylines in image pixels (`RIVERS` in `index.html`), smoothed into curves and bucketed in a coarse grid so each lookup only checks nearby segments.
   - **Biomes:** snow where the painting is snowy or the ground is high, desert where it's sandy or red (with red rock and red sand in the Rustwaste and the dunes), forest where it's wooded or marshy, and grassland elsewhere.
   - **Changing the map:** paint over `map/painted-map.jpg` and run `python3 map/build.py`, or edit `RIVERS`.
   - **Ground:** beaches form where land meets the sea, and steep slopes are bare rock. Underwater is sand, and empty space below sea level fills with water.
   - **Swimming:** water is a separate see-through mesh with drifting ripples. Below the surface you swim slowly and hold jump to rise, and the fog turns murky blue.
3. **Chunks.** The world is split into 16×16×64 chunks. Each chunk is generated purely from the seed, so any chunk can be built on demand, including neighbours that the mesher or collision needs. Chunks within 6 of the player are meshed nearest-first, within a few milliseconds per frame. Far chunks are unloaded.
4. **Structures.** The world is divided into 192×192-block regions. Each place is filed under the region holding its corner, at most one per region, but its footprint and the flattened ground around it may reach into neighbouring regions, which also list it.
   - **Forts:** 44 or 48 blocks across, built as models (see *Forts* below), with torches and guards. The gate faces the place's road.
   - **Watchtowers:** 7×7 stone towers on a plinth. A doorway opens onto a stair that winds in half steps round a central pillar, up to a platform behind battlements, with window slits on the way.
   - **Ruins:** a broken ring of wall rising and falling round the edge, with gaps where it has fallen and weeds and bushes on top. A corner tower stands as a ragged shell, and tumbled stones lie half sunk all round.
   - **Standing stones:** rough five-sided monoliths, each a little out of true. A single great stone (Oathstone), a ring round a fallen altar with one stone toppled (the Silent Grove), or monuments on plinths among grave mounds (the Victory Fields).
   - All of these are models, solid where they look solid.
   - Desert structures are built of sandstone.
   - A place's plan (type, size, rotation, ground level) is worked out at startup. Its blocks are only built when a nearby chunk needs them.
   - The ground is flattened under each place, at the average height of the land there (never below the water), and blended into the surroundings.
   - **Modelled buildings:** cottages and windmills are built from a parts kit that merges each building into one mesh per material. They use general colliders (oriented boxes and cylinders), which walking, landing and step-ups all respect.
   - All forts share one layout (`buildFort`) and one model (`makeFort`), including the starting fort.
   - Torches and guards appear with the chunk they stand in. A fixed pool of 10 point lights moves to the nearest torches, so more forts never add rendering cost.
   - Places appear on the world map: red squares are forts, houses are villages, triangles are watchtowers, crosses are ruins and rings are standing stones.
5. **The smooth ground.** The height functions return smooth, unrounded heights. Each chunk stores the height at its 17×17 block corners, and the ground mesh joins them in two triangles per block, split corner to corner.
   - **Colour and lighting:** each corner gets a colour from its biome, blended towards rock by the slope. A faint noise texture adds grain, and normals come from the neighbouring heights, so shading runs smoothly across chunk edges.
   - **Collision:** `groundY` reads the same triangles, plus a road's surface where you're on one. The player, animals, hunters, carts and arrows all use it.
   - **The blocks underneath:** the chunk still holds whole-block columns of ground below the surface, for anything that asks about blocks. They're neither drawn nor collided with.
   - **Still water:** a flat surface over every block cell where a corner dips below the sea's level, the lake's or a tarn's.
   - **Rivers:** one strip of water per river, down its course at its water level and a little wider than the channel so the edges tuck under the banks. Its texture scrolls downstream, and segments that drop steeply are tinted white. Anything that asks about water (swimming, bridges, trees, animals, the map, guards) uses the water level at that spot, not sea level.
6. **Buildings and trees.** Every place is built as models; only a village's streets and well are still written as blocks.
   - **Models:** forts, the watchtower, ruins and stones are built with the same parts kit as the cottages: textured boxes in the old block layout (so guards, torches and roads line up), merged into one mesh per material, turned with the fort, with box colliders for everything solid. Steps are half a block, so the usual step-up climbs them. `colliderPoint` lets walls block arrows and sight.
   - **Trees:** each chunk records its trees (position, kind, trunk and crown size) when it's generated. When it's drawn, copies of four base shapes (a tapering trunk, a cone, a ball and a column) are scaled, turned and merged into one flat-shaded mesh with vertex colours. Trunks become cylinder colliders. `treeHit` tests trunks and crowns (a cone for a pine, a squashed ball for an oak) for arrows, hunters' shots and guards' sight.
7. **The starting fort** is built with the same `buildFort()` and `makeFort()` as the other forts, on flattened ground at the spawn, with a road leading to its gate. Its model stays built for good.
8. **Lighting.** Hemisphere sky light and a sun/moon directional light driven by the day/night cycle, exponential fog that hides the edge of the loaded area, and torchlight from the light pool described above.
9. **ASCII pass.** The 3D scene is rendered into a low-resolution target, at 2× the character grid. A full-screen shader picks a character for each cell based on its brightness, then tints it with the scene colour. The glyph atlas is redrawn at the exact on-screen cell size, so small characters stay sharp.
   - **FINE** (default): about 40 characters, sorted at startup by how much ink each covers, with some of the scene colour blended behind them. This gives smooth shading.
   - **CLASSIC**: the short ramp ` .,:-=+*o#%@` on a dark background.
10. **Animals.** Each animal is a small model made of boxes, with jointed legs, neck, tail or wings. A simple state machine (idle, walk, flee, climb, fly) moves it over the terrain heightmap, keeping it off roads and out of buildings. Animals only update within about 90 blocks of you.
11. **Arrows.** Each arrow is moved along an exact ballistic arc every frame. The path is tested against the blocks it passes through, and raycast against the hit boxes of nearby animals. A deer has a hidden heart box low in its chest: an arrow that reaches it within 0.8 blocks of entering the body counts as a heart shot.
