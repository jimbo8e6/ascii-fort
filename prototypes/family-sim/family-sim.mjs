// Family simulation prototype for Connected Histories. Standalone: nothing in the game uses it yet.
//
// The world's families are simulated year by year from the end of the war (year 0). Every random
// choice comes from a hash of (seed, year, what is being decided, who it concerns), never from a
// running random stream, so:
//  - the same seed and length always give the same history;
//  - nothing about year y depends on anything after y, so a longer run is the shorter run plus more
//    years, and a saved history can be resumed and comes out the same as one run straight through.
// The history is people (with mother, father and marriages) and a log of events. Everything else
// (children, ancestors, relationships) is worked out from those.

// ---- Placeholder lifespans and fertility, per race (years). Adjust freely. ----
export const RACES = {
  //        age of adulthood, child-bearing years, old from, can't outlive, yearly chances: birth (per couple), death (adult; child)
  human: { adult: 16, fertile: [16, 45], old: 60, max: 95, birth: .3, death: .006, childDeath: .015 },
  elf:   { adult: 50, fertile: [50, 450], old: 550, max: 750, birth: .03, death: .0008, childDeath: .002 },
  dwarf: { adult: 30, fertile: [30, 160], old: 200, max: 300, birth: .08, death: .002, childDeath: .006 },
  orc:   { adult: 13, fertile: [13, 35], old: 40, max: 65, birth: .35, death: .01, childDeath: .03 },
};

// ---- ⚠ TEMPORARY inheritance rules, for James to decide. Each one is a single function to swap. ----
export const TEMP_RULES = {
  // A child of two races takes one parent's race at random (and keeps both in `heritage`)
  childRace: (mother, father, r) => mother.race === father.race ? mother.race : r < .5 ? mother.race : father.race,
  // Lifespan follows the race the child takes
  lifespanRace: child => child.race,
  // A couple's chance of a child, and her child-bearing years, follow the mother's race
  birthRace: (mother, father) => mother.race,
  // Children take their father's surname and family line
  lineParent: (mother, father) => father,
  // After a wedding, the wife moves to the husband's home
  newHome: (wife, husband) => husband.place,
  // How likely a match across races is, against a match within one
  crossRaceWeight: .15,
};

// ---- Other placeholder rules (not about inheritance) ----
export const RULES = {
  marryChance: .3,           // an unmarried adult's yearly chance of looking for a match
  awayMatch: .12,            // ...of looking in another place rather than at home
  tradeFromFather: .55, tradeFromMother: .2,   // otherwise a trade of the place they grow up in
  leaveHome: .06,            // chance on coming of age of moving to another place (more when crowded)
  maxChildren: 9,
  // Kin who may not marry: anyone sharing a parent or grandparent (siblings, half siblings, first cousins)
  kinDepth: 2,
};

// ---- Places (a subset of the gazetteer). Who lives there, how many it holds, and its trades. ----
export const PLACES = [
  { name: 'Kharn Dolum', races: { dwarf: 1 }, cap: 140, trades: ['miner', 'smith', 'mason', 'brewer', 'guard'] },
  { name: "Anvil's Rest", races: { dwarf: .5, human: .5 }, cap: 60, trades: ['miner', 'smith', 'carter', 'innkeeper'] },
  { name: 'Aelith Vara', races: { elf: 1 }, cap: 90, trades: ['warden', 'weaver', 'herbalist', 'carver', 'singer'] },
  { name: 'Mistwater', races: { elf: .8, human: .2 }, cap: 40, trades: ['fisher', 'herbalist', 'healer'] },
  { name: 'Thornwick', races: { human: .7, elf: .3 }, cap: 70, trades: ['trader', 'woodcutter', 'hunter', 'guard'] },
  { name: 'Gor Marakh', races: { orc: 1 }, cap: 140, trades: ['warrior', 'smith', 'tanner', 'herder'] },
  { name: 'Ashen Camp', races: { orc: 1 }, cap: 60, trades: ['herder', 'tanner'] },
  { name: 'Dust Wells', races: { human: .5, orc: .3, dwarf: .2 }, cap: 60, trades: ['trader', 'stablehand', 'innkeeper', 'well-keeper'] },
  { name: 'Kelford', races: { human: 1 }, cap: 110, trades: ['baker', 'trader', 'mason', 'carter', 'guard'] },
  { name: 'Millbrook', races: { human: 1 }, cap: 70, trades: ['baker', 'miller', 'farmer', 'farmer'] },
  { name: "Hollin's Ferry", races: { human: 1 }, cap: 50, trades: ['ferryman', 'innkeeper', 'boatwright'] },
  { name: 'Castle Aldermere', races: { human: 1 }, cap: 90, trades: ['guard', 'farmer', 'smith', 'servant'] },
  { name: 'Concord Landing', races: { human: .4, elf: .2, dwarf: .2, orc: .2 }, cap: 70, trades: ['carpenter', 'trader', 'healer', 'farmer'] },
  { name: 'Port Cassel', races: { human: .9, elf: .1 }, cap: 100, trades: ['sailor', 'docker', 'trader', 'clerk'] },
  { name: 'Harrowgate Keep', races: { human: 1 }, cap: 60, trades: ['guard', 'farmer', 'servant'] },
];

// A few founders known for their part in the war. Placeholders, not canon: they show that a famous
// ancestor is carried down every line descending from them, and that most lines have none.
export const NOTABLES = [
  { place: 'Castle Aldermere', race: 'human', sex: 'm', title: 'war hero, held the Aldermere bridge' },
  { place: 'Harrowgate Keep', race: 'human', sex: 'm', title: 'king displaced in the war' },
  { place: 'Kharn Dolum', race: 'dwarf', sex: 'f', title: 'thane who held Greyhold Pass' },
  { place: 'Aelith Vara', race: 'elf', sex: 'f', title: 'keeper of the Silent Grove' },
  { place: 'Gor Marakh', race: 'orc', sex: 'm', title: 'warchief at the Broken Bastion' },
];

const NAMES = {
  human: { m: ['Aldric', 'Bram', 'Cedric', 'Dunstan', 'Edwin', 'Fenn', 'Garret', 'Hal', 'Ivo', 'Jory', 'Kit', 'Leof', 'Merric', 'Ned', 'Osric', 'Piers', 'Rowan', 'Simon', 'Tobin', 'Ulric', 'Wat'],
           f: ['Ada', 'Bess', 'Cora', 'Daisy', 'Edith', 'Fern', 'Gwen', 'Hilda', 'Ida', 'Joan', 'Kate', 'Lena', 'Maud', 'Nell', 'Orla', 'Peg', 'Rose', 'Sybil', 'Tess', 'Una', 'Wynn'],
           s: ['Baker', 'Miller', 'Hollins', 'Thatcher', 'Cooper', 'Fletcher', 'Ashby', 'Brook', 'Carver', 'Dale', 'Fenwick', 'Greaves', 'Harrow', 'Kell', 'Marsh', 'Nash', 'Oakes', 'Pike', 'Reeve', 'Stone', 'Tanner', 'Ward', 'Webb', 'Wren'] },
  elf: { m: ['Aerin', 'Caelum', 'Elorin', 'Faelar', 'Ilthan', 'Lirael', 'Naeris', 'Sylvar', 'Thalion', 'Vaelis'],
         f: ['Aelith', 'Caelia', 'Elowen', 'Faenya', 'Ilyra', 'Lethiel', 'Miriel', 'Naeva', 'Sariel', 'Thessa'],
         s: ['Silverleaf', 'Moonbrook', 'Starwhisper', 'Dawnmere', 'Ashvale', 'Thornsong', 'Mistweaver', 'Brightwater'] },
  dwarf: { m: ['Bofur', 'Dain', 'Durgan', 'Grimli', 'Harl', 'Korin', 'Nori', 'Orrin', 'Thrain', 'Vorn'],
           f: ['Bera', 'Dagna', 'Disa', 'Helga', 'Kara', 'Magna', 'Nala', 'Rika', 'Thora', 'Ylva'],
           s: ['Ironfoot', 'Stonehelm', 'Deepdelve', 'Copperbeard', 'Hammerfall', 'Goldvein', 'Anvilborn', 'Granitehand'] },
  orc: { m: ['Azog', 'Brak', 'Durz', 'Gorr', 'Krag', 'Lurk', 'Mog', 'Narg', 'Ruk', 'Thrak'],
         f: ['Agra', 'Bula', 'Dura', 'Ghora', 'Kesha', 'Mazga', 'Rasha', 'Shagra', 'Ugra', 'Vorka'],
         s: ['Bloodtusk', 'Ironjaw', 'Skullsplitter', 'Ashhide', 'Redfang', 'Stonefist'] },
};

// ---- Hashed randomness: a number in [0, 1) from the seed and up to four whole numbers ----
const TAG = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
function rand(seed, tag, a = 0, b = 0, c = 0) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ tag;
  for (const v of [a, b, c]) { h = Math.imul(h ^ (v | 0), 0xcc9e2d51); h = (h << 15 | h >>> 17); h = Math.imul(h, 0x1b873593) ^ 0xe6546b64; }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const T = Object.fromEntries(['death', 'wed', 'wedPick', 'away', 'awayPlace', 'birth', 'sex', 'race', 'name', 'trade', 'tradePick', 'leave', 'leavePlace', 'found', 'foundAge', 'foundKids', 'foundRace', 'foundSurname', 'foundTrade'].map(k => [k, TAG(k)]));
const pickW = (weights, r) => { let t = 0; for (const [, w] of weights) t += w; let x = r * t; for (const [k, w] of weights) { if ((x -= w) < 0) return k; } return weights.at(-1)[0]; };

// ---- The history ----
// A person: id, name, surname, line (family line id), sex, race, heritage (all races in the family),
// birth, death (or null), mother, father (ids, or null for founders), spouses [{ id, year }], place,
// birthPlace, trade, notable (a title, founders only), gen (generations from the founders).
// An event: { y, t, ... } with t one of found, birth, wed, death, trade, move.
export function newHistory(seed) {
  const H = { version: 1, seed: seed | 0, year: 0, people: [], lines: [], events: [] };
  found(H);
  index(H);
  return H;
}

// Year 0: each place's families at the end of the war, couples with children born before it
function found(H) {
  const { seed } = H;
  let n = 0;
  const person = (o) => { const p = { id: H.people.length, spouses: [], death: null, mother: null, father: null, gen: 0, trade: null, notable: null, ...o }; H.people.push(p); return p; };
  const firstName = (race, sex, id) => NAMES[race][sex][rand(seed, T.name, id) * NAMES[race][sex].length | 0];
  const notables = NOTABLES.map(x => ({ ...x }));
  PLACES.forEach((pl, pi) => {
    const target = Math.round(pl.cap * .6);
    let made = 0, hh = 0;
    while (made < target) {
      const race = pickW(Object.entries(pl.races), rand(seed, T.foundRace, pi, hh)), R = RACES[race];
      const nb = notables.find(x => x.place === pl.name && x.race === race && !x.used);
      const span = R.fertile[1] - R.adult;
      const ageH = R.adult + Math.floor(rand(seed, T.foundAge, pi, hh) * span * .8), ageW = Math.max(R.adult, ageH - 3 + Math.floor(rand(seed, T.foundAge, pi, hh + 9999) * 6));
      const surname = NAMES[race].s[rand(seed, T.foundSurname, pi, hh) * NAMES[race].s.length | 0];
      const line = { id: H.lines.length, surname, origin: pl.name };
      H.lines.push(line);
      const husband = person({ sex: 'm', race, heritage: [race], birth: -ageH, place: pl.name, birthPlace: pl.name, surname, line: line.id });
      const wifeRace = race, wifeSurname = NAMES[wifeRace].s[rand(seed, T.foundSurname, pi, hh + 7777) * NAMES[wifeRace].s.length | 0];
      const wifeLine = { id: H.lines.length, surname: wifeSurname, origin: pl.name };
      H.lines.push(wifeLine);
      const wife = person({ sex: 'f', race: wifeRace, heritage: [wifeRace], birth: -ageW, place: pl.name, birthPlace: pl.name, surname: wifeSurname, line: wifeLine.id });
      line.founder = husband.id; wifeLine.founder = wife.id;
      for (const p of [husband, wife]) {
        p.name = firstName(p.race, p.sex, p.id);
        p.trade = pl.trades[rand(seed, T.foundTrade, p.id) * pl.trades.length | 0];
        H.events.push({ y: 0, t: 'found', p: p.id, place: pl.name });
      }
      if (nb) { nb.used = true; (nb.sex === 'f' ? wife : husband).notable = nb.title; }
      const wed = -Math.min(ageH, ageW) + R.adult;
      husband.spouses.push({ id: wife.id, year: wed }); wife.spouses.push({ id: husband.id, year: wed });
      made += 2;
      // Children already born before the war ended
      const kids = Math.floor(rand(seed, T.foundKids, pi, hh) * 4);
      for (let k = 0; k < kids && made < target; k++) {
        const age = Math.floor(rand(seed, T.foundAge, pi, hh * 16 + k) * (ageW - R.adult));
        if (ageW - age < R.fertile[0]) continue;
        const c = person({ sex: rand(seed, T.sex, pi * 1000 + hh, k) < .5 ? 'm' : 'f', race, heritage: [race], birth: -age, place: pl.name, birthPlace: pl.name,
          surname, line: line.id, mother: wife.id, father: husband.id, gen: 1 });
        c.name = firstName(race, c.sex, c.id);
        if (age >= R.adult) c.trade = husband.trade;
        H.events.push({ y: 0, t: 'found', p: c.id, place: pl.name });
        made++;
      }
      hh++;
    }
  });
}

// Derived lookups (rebuilt after loading): children, living people
function index(H) {
  H._children = H.people.map(() => []);
  for (const p of H.people) for (const par of [p.mother, p.father]) if (par !== null) H._children[par].push(p.id);
  H._living = H.people.filter(p => p.death === null).map(p => p.id);
}

const age = (p, y) => y - p.birth;
const spouseNow = (H, p) => { const s = p.spouses.at(-1); return s && H.people[s.id].death === null ? H.people[s.id] : null; };
// A person's ancestors up to `depth` generations, as a set of ids (parents are depth 1)
function nearAncestors(H, p, depth) {
  const out = new Set(); let front = [p];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const q of front) for (const par of [q.mother, q.father]) if (par !== null && !out.has(par)) { out.add(par); next.push(H.people[par]); }
    front = next;
  }
  return out;
}
const closeKin = (H, a, b) => {
  const A = nearAncestors(H, a, RULES.kinDepth), B = nearAncestors(H, b, RULES.kinDepth);
  if (A.has(b.id) || B.has(a.id)) return true;
  for (const x of A) if (B.has(x)) return true;
  return false;
};

// Run the history on to year `to`. Can be called again later to carry on from where it stopped.
export function simulate(H, to) {
  const { seed } = H, placeIndex = Object.fromEntries(PLACES.map((p, i) => [p.name, i]));
  for (let y = H.year + 1; y <= to; y++) {
    const living = H._living.map(id => H.people[id]);
    // Head counts per place and race: each race has its own share of a place's room
    const pop = {}, key = (place, race) => place + '|' + race;
    const add = (p, n) => { pop[key(p.place, p.race)] = (pop[key(p.place, p.race)] || 0) + n; };
    const room = (place, race) => PLACES[placeIndex[place]].cap * (PLACES[placeIndex[place]].races[race] || 0);
    for (const p of living) add(p, 1);
    // Deaths
    for (const p of living) {
      const R = RACES[TEMP_RULES.lifespanRace(p)], a = age(p, y);
      let h = a < R.adult / 3 ? R.childDeath : R.death;
      if (a > R.old) h += .55 * ((a - R.old) / (R.max - R.old)) ** 2;
      if (a >= R.max || rand(seed, T.death, y, p.id) < h) { p.death = y; H.events.push({ y, t: 'death', p: p.id, place: p.place }); add(p, -1); }
    }
    const alive = living.filter(p => p.death === null);
    // Coming of age: a trade, and perhaps a move away
    for (const p of alive) {
      const R = RACES[p.race];
      if (age(p, y) !== R.adult) continue;
      const pl = PLACES[placeIndex[p.place]], f = p.father !== null ? H.people[p.father] : null, m = p.mother !== null ? H.people[p.mother] : null;
      const r = rand(seed, T.trade, y, p.id);
      p.trade = r < RULES.tradeFromFather && f?.trade ? f.trade : r < RULES.tradeFromFather + RULES.tradeFromMother && m?.trade ? m.trade
        : pl.trades[rand(seed, T.tradePick, y, p.id) * pl.trades.length | 0];
      H.events.push({ y, t: 'trade', p: p.id, trade: p.trade });
      const crowded = (pop[key(p.place, p.race)] || 0) / Math.max(1, room(p.place, p.race));
      if (rand(seed, T.leave, y, p.id) < RULES.leaveHome + Math.max(0, crowded - .8)) {
        // Only to places where their own race lives, and there's room for them
        const options = PLACES.filter(q => q.name !== p.place && q.races[p.race] && (pop[key(q.name, p.race)] || 0) < room(q.name, p.race) * .9);
        if (options.length) {
          const to = options[rand(seed, T.leavePlace, y, p.id) * options.length | 0];
          H.events.push({ y, t: 'move', p: p.id, from: p.place, to: to.name });
          add(p, -1); p.place = to.name; add(p, 1);
        }
      }
    }
    // Weddings: unmarried women look for a match, at home or now and then further away
    const single = p => !spouseNow(H, p) && age(p, y) >= RACES[p.race].adult && age(p, y) <= RACES[p.race].fertile[1] + 10;
    const menBy = {};
    for (const p of alive) if (p.sex === 'm' && single(p)) (menBy[p.place] ||= []).push(p);
    const taken = new Set();
    for (const w of alive) {
      if (w.sex !== 'f' || !single(w) || rand(seed, T.wed, y, w.id) >= RULES.marryChance) continue;
      let where = w.place;
      if (rand(seed, T.away, y, w.id) < RULES.awayMatch) where = PLACES[rand(seed, T.awayPlace, y, w.id) * PLACES.length | 0].name;
      const cands = (menBy[where] || []).filter(m => !taken.has(m.id) && !closeKin(H, w, m));
      if (!cands.length) continue;
      const weights = cands.map(m => {
        const span = RACES[m.race].fertile[1] - RACES[m.race].adult, gap = Math.abs((age(m, y) - RACES[m.race].adult) / span - (age(w, y) - RACES[w.race].adult) / (RACES[w.race].fertile[1] - RACES[w.race].adult));
        return [m, Math.max(.01, 1 - gap * 3) * (m.race === w.race ? 1 : TEMP_RULES.crossRaceWeight)];
      });
      const m = pickW(weights, rand(seed, T.wedPick, y, w.id));
      taken.add(m.id);
      w.spouses.push({ id: m.id, year: y }); m.spouses.push({ id: w.id, year: y });
      const home = TEMP_RULES.newHome(w, m);
      H.events.push({ y, t: 'wed', a: w.id, b: m.id, place: home });
      for (const p of [w, m]) if (p.place !== home) { H.events.push({ y, t: 'move', p: p.id, from: p.place, to: home }); add(p, -1); p.place = home; add(p, 1); }
    }
    // Births
    const born = [];
    for (const w of alive) {
      if (w.sex !== 'f') continue;
      const h = spouseNow(H, w);
      if (!h) continue;
      const R = RACES[TEMP_RULES.birthRace(w, h)], a = age(w, y);
      if (a < R.fertile[0] || a > R.fertile[1]) continue;
      const kids = H._children[w.id], last = kids.length ? H.people[kids.at(-1)].birth : -1e9;
      if (kids.length >= RULES.maxChildren || y - last < 1) continue;
      // The child's race is settled first, then whether there's room for one more of that race at home
      // (a race that doesn't belong to the place gets a small allowance, so mixed families anywhere can grow)
      const race = TEMP_RULES.childRace(w, h, rand(seed, T.race, y, w.id));
      const cap = Math.max(room(w.place, race), PLACES[placeIndex[w.place]].cap * .05);
      const space = Math.max(0, 1.5 * (1 - (pop[key(w.place, race)] || 0) / cap));
      if (rand(seed, T.birth, y, w.id) >= R.birth * Math.min(1, space) * .88 ** kids.length) continue;
      born.push([w, h, race]);
    }
    for (const [w, h, race] of born) {
      const id = H.people.length, lineParent = TEMP_RULES.lineParent(w, h);
      const c = { id, sex: rand(seed, T.sex, y, id) < .5 ? 'm' : 'f', birth: y, death: null, mother: w.id, father: h.id, spouses: [], place: w.place, birthPlace: w.place,
        surname: lineParent.surname, line: lineParent.line, trade: null, notable: null, gen: Math.max(w.gen, h.gen) + 1 };
      c.race = race;
      c.heritage = [...new Set([...w.heritage, ...h.heritage])].sort();
      c.name = NAMES[c.race][c.sex][rand(seed, T.name, id) * NAMES[c.race][c.sex].length | 0];
      H.people.push(c); H._children.push([]); H._children[w.id].push(id); H._children[h.id].push(id);
      H.events.push({ y, t: 'birth', p: id, mother: w.id, father: h.id, place: w.place });
      add(c, 1);
    }
    H._living = H.people.filter(p => p.death === null).map(p => p.id);
    H.year = y;
  }
  return H;
}

// ---- Saving and loading: a plain JSON copy, without the derived lookups ----
export const save = H => JSON.stringify({ version: H.version, seed: H.seed, year: H.year, people: H.people, lines: H.lines, events: H.events });
export function load(text) { const H = JSON.parse(text); index(H); return H; }

// ---- Questions about the history ----
export const children = (H, id) => H._children[id];
// Every ancestor of a person: how many generations back (the nearest way), and up to four routes
// there, each a list of 'mother'/'father' steps. Searched a generation at a time, so each ancestor
// is visited once however often families have married back into each other.
export function ancestors(H, id) {
  const out = new Map();
  let front = new Map([[id, [[]]]]);
  for (let d = 1; front.size; d++) {
    const next = new Map();
    for (const [x, routes] of front) {
      const p = H.people[x];
      for (const [par, via] of [[p.mother, 'mother'], [p.father, 'father']]) {
        if (par === null || out.has(par) && out.get(par).depth < d) continue;
        const got = next.get(par) || [];
        for (const r of routes) if (got.length < 4) got.push([...r, via]);
        next.set(par, got);
      }
    }
    for (const [x, routes] of next) out.set(x, { depth: d, routes });
    front = next;
  }
  return out;
}
// The nearest ancestors two people share (shared ancestors who aren't an ancestor of another shared one)
export function sharedAncestors(H, a, b) {
  const A = ancestors(H, a), B = ancestors(H, b);
  for (const [x, e] of [[a, { depth: 0, routes: [[]] }], [b, { depth: 0, routes: [[]] }]]) { if (x === a) A.set(a, e); else B.set(b, e); }
  const common = [...A.keys()].filter(x => B.has(x));
  const nearest = common.filter(x => !common.some(y => y !== x && ancestors(H, y).has(x)));
  return { common, nearest: nearest.map(x => ({ id: x, fromA: A.get(x), fromB: B.get(x) })) };
}
export function relationship(H, a, b) {
  const { nearest } = sharedAncestors(H, a, b);
  if (!nearest.length) return null;
  // Named by the closest link (fewest generations in all); when families have married back into each
  // other there can be several, and the closest is the one people would use
  const best = nearest.reduce((x, n) => n.fromA.depth + n.fromB.depth < x.fromA.depth + x.fromB.depth ? n : x);
  const da = best.fromA.depth, db = best.fromB.depth;
  const top = nearest.filter(n => n.fromA.depth === da && n.fromB.depth === db);
  const half = top.length < 2 ? 'half ' : '';
  const ord = n => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'][n - 1] || `${n}th`;
  if (da === 0 || db === 0) { const g = Math.max(da, db); return `${g > 2 ? 'great-'.repeat(g - 2) : ''}${g > 1 ? 'grand' : ''}${g ? 'parent and child' : 'the same person'}`; }
  if (da === 1 && db === 1) return `${half}siblings`;
  if (Math.min(da, db) === 1) { const g = Math.max(da, db) - 2; return `${half}${'great-'.repeat(Math.max(0, g - 1))}${g ? 'grand' : ''}aunt or uncle and niece or nephew`; }
  const k = Math.min(da, db) - 1, r = Math.abs(da - db);
  return `${half}${ord(k)} cousins${r ? ` ${r === 1 ? 'once' : r === 2 ? 'twice' : r + ' times'} removed` : ''}`;
}
export const fullName = (H, id) => { const p = H.people[id]; return `${p.name} ${p.surname}`; };
export const describe = (H, id) => {
  const p = H.people[id];
  return `${p.name} ${p.surname} (#${id}, ${p.race}${p.heritage.length > 1 ? ' of ' + p.heritage.join('-') + ' family' : ''}, ${p.sex === 'f' ? 'f' : 'm'}, born ${p.birth}${p.death !== null ? ', died ' + p.death : ''}${p.trade ? ', ' + p.trade : ''}, ${p.place}${p.notable ? ', ★ ' + p.notable : ''})`;
};
