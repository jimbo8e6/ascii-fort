// Runs the six checks for the family simulation prototype and measures generation time.
// Usage: node test.mjs   (prints a report; also writes results.txt next to this file)
import { newHistory, simulate, save, load, ancestors, sharedAncestors, relationship, describe, fullName, cases, prisoners, revealedIn, solved, RACES, TEMP_RULES, RULES, MURDER } from './family-sim.mjs';
import { createHash } from 'node:crypto';
import { buildViewer } from './build-viewer.mjs';
buildViewer();                                   // keep viewer.html's copy of the simulation up to date
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const lines = [], log = (...a) => { const s = a.join(' '); lines.push(s); console.log(s); };
const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
const run = (seed, years) => simulate(newHistory(seed), years);
let failures = 0;
const check = (ok, what) => { log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failures++; };
const SEED = 1337;

// ---------------------------------------------------------------------------------------------
log('1. Same seed and start year give the same people and ancestry');
{
  const a = run(SEED, 150), b = run(SEED, 150), c = run(SEED + 1, 150);
  const ha = sha(save(a)), hb = sha(save(b)), hc = sha(save(c));
  log(`  seed ${SEED}, 150 years: run 1 ${ha}, run 2 ${hb} (${a.people.length} people, ${a.events.length} events)`);
  log(`  seed ${SEED + 1}, 150 years: ${hc}`);
  check(ha === hb, 'two runs give byte-identical histories');
  check(ha !== hc, 'a different seed gives a different history');
  const someone = a._living.at(-1), A1 = ancestors(a, someone), A2 = ancestors(b, someone);
  check(JSON.stringify([...A1]) === JSON.stringify([...A2]), `the same ancestry for ${fullName(a, someone)} (${A1.size} ancestors) in both runs`);
}

// ---------------------------------------------------------------------------------------------
log('\n2. Shared ancestors between relatives, through both parents and across family lines');
const H = run(SEED, 200);
{
  // Independent check: X is a shared ancestor of a and b exactly when walking down X's children reaches both
  const descends = (x, target) => { const seen = new Set([x]), st = [x]; while (st.length) { const y = st.pop(); if (y === target) return true; for (const c of H._children[y]) if (!seen.has(c)) { seen.add(c); st.push(c); } } return false; };
  const verify = (a, b) => {
    const { common } = sharedAncestors(H, a, b), A = ancestors(H, a);
    const brute = [...A.keys()].filter(x => descends(x, b));
    return common.filter(x => x !== a && x !== b).sort().join() === brute.sort().join();
  };
  // Find a pair of living cousins with different surnames whose link runs through a mother
  const living = H._living.filter(id => H.people[id].birth > 150);
  let shown = null, checked = 0, agree = 0;
  for (let i = 0; i < living.length && checked < 400; i += 3) for (let j = i + 1; j < living.length && j < i + 60; j += 2) {
    const a = living[i], b = living[j], r = relationship(H, a, b);
    if (!r) continue;
    checked++; if (verify(a, b)) agree++;
    if (!shown && H.people[a].surname !== H.people[b].surname && /cousins/.test(r)) {
      const { nearest } = sharedAncestors(H, a, b);
      if (nearest.some(n => n.fromA.routes[0].includes('mother') || n.fromB.routes[0].includes('mother'))) shown = [a, b];
    }
  }
  check(checked > 0 && agree === checked, `shared ancestors match an independent walk down the family tree for all ${checked} related pairs tried`);
  if (shown) {
    const [a, b] = shown, { nearest, common } = sharedAncestors(H, a, b);
    log(`  Example: ${describe(H, a)}`);
    log(`       and ${describe(H, b)}`);
    log(`  Different surnames. They are ${relationship(H, a, b)}, with ${common.length} shared ancestors in all; nearest:`);
    for (const n of nearest) {
      const step = (from, route) => { let x = from, out = [fullName(H, x)]; for (const v of route) { x = H.people[x][v]; out.push(`${v} ${fullName(H, x)}`); } return out.join(' → '); };
      log(`   • ${describe(H, n.id)}`);
      log(`       from ${H.people[a].name}: ${step(a, n.fromA.routes[0])}`);
      log(`       from ${H.people[b].name}: ${step(b, n.fromB.routes[0])}`);
    }
  }
  // A marriage between two lines: the child counts both lines' ancestors
  const mixedLines = H._living.map(id => H.people[id]).find(p => p.mother !== null && H.people[p.mother].line !== p.line && p.gen >= 4);
  const A = ancestors(H, mixedLines.id), ls = new Set([...A.keys()].map(x => H.people[x].surname));
  log(`  ${describe(H, mixedLines.id)} has ${A.size} ancestors from ${ls.size} family names, e.g. ${[...ls].slice(0, 8).join(', ')}`);
  check(ls.size > 1, 'ancestry crosses family lines through marriages, not just the surname');
  // The same surname does not make people related
  const bySurname = {};
  for (const id of H._living) (bySurname[H.people[id].surname] ||= []).push(id);
  let unrelated = null;
  for (const ids of Object.values(bySurname)) { for (let i = 0; i < ids.length && !unrelated; i++) for (let j = i + 1; j < ids.length && !unrelated; j++) if (!relationship(H, ids[i], ids[j])) unrelated = [ids[i], ids[j]]; if (unrelated) break; }
  if (unrelated) {
    log(`  Same surname, not related: ${describe(H, unrelated[0])} and ${describe(H, unrelated[1])}`);
    check(sharedAncestors(H, ...unrelated).common.length === 0, 'two people with the same surname can have no shared ancestor');
  }
  // A child of two races
  const mixed = H.people.find(p => p.heritage.length > 1 && p.mother !== null && H.people[p.mother].race !== H.people[p.father].race);
  if (mixed) log(`  Mixed-race family: ${describe(H, mixed.id)}, mother ${describe(H, mixed.mother)}, father ${describe(H, mixed.father)}  [⚠ TEMPORARY rule: child takes one parent's race at random]`);
}

// ---------------------------------------------------------------------------------------------
log('\n3. An early start and a later start from the same seed: the later one only adds history');
{
  const early = 40, late = 300, E = run(SEED, early), L = run(SEED, late);
  const evE = E.events, evL = L.events.filter(e => e.y <= early);
  check(JSON.stringify(evE) === JSON.stringify(evL), `all ${evE.length} events up to year ${early} are identical in the ${late}-year history`);
  // People as they stood at year `early`, rebuilt from the longer history
  // (a trade is only known once its trade event has happened; place is left out, as people move later)
  const lateTrade = new Set(L.events.filter(e => e.t === 'trade' && e.y > early).map(e => e.p));
  const asOf = (p, y) => ({ ...p, death: p.death !== null && p.death <= y ? p.death : null, cause: p.death !== null && p.death <= y ? p.cause : null,
    deathKind: p.death !== null && p.death <= y ? p.deathKind : null,
    killer: p.killer && p.killer.from <= y ? { ...p.killer, caught: p.killer.caught !== null && p.killer.caught <= y ? p.killer.caught : null } : null, jail: null, spouses: p.spouses.filter(s => s.year <= y),
    trade: lateTrade.has(p.id) ? null : p.trade, place: null });
  const same = E.people.every((p, i) => JSON.stringify({ ...asOf(p, early) }) === JSON.stringify(asOf(L.people[i], early)));
  check(same && L.people.length > E.people.length, `the ${E.people.length} people of year ${early} have the same births, parents, marriages and deaths; ${L.people.length - E.people.length} more people come later`);
  check(L.events.length > E.events.length && L.events.slice(evE.length).every(e => e.y > early), `${L.events.length - evE.length} later events, all after year ${early}`);
  // Saved at the early start, then carried on: the same as running straight through
  const resumed = simulate(load(save(E)), late);
  check(sha(save(resumed)) === sha(save(L)), `saving at year ${early} and carrying on to ${late} gives exactly the straight-through history`);
}

// ---------------------------------------------------------------------------------------------
log('\n4. An ordinary family line: generations of bakers, no famous ancestor');
{
  // Follow every father-to-son chain of bakers and keep the longest
  const best = { len: 0, end: null };
  const baker = p => p.trade === 'baker';
  for (const p of H.people) {
    if (!baker(p)) continue;
    let len = 1, x = p;
    while (x.father !== null && baker(H.people[x.father])) { len++; x = H.people[x.father]; }
    const famous = [...ancestors(H, p.id).keys()].some(a => H.people[a].notable) || p.notable;
    if (len > best.len && !famous) Object.assign(best, { len, end: p.id });
  }
  const chain = []; for (let x = best.end; x !== null; x = H.people[x].father) chain.unshift(x);
  log(`  The ${H.people[best.end].surname} line, ${chain.length} generations (father to son), oldest first:`);
  for (const id of chain) log(`   ${describe(H, id)}`);
  const all = ancestors(H, best.end);
  check(![...all.keys()].some(a => H.people[a].notable), `none of the youngest's ${all.size} ancestors, on any side, is a notable figure`);
  const famousLiving = H._living.filter(id => [...ancestors(H, id).keys()].some(a => H.people[a].notable)).length;
  log(`  For comparison, ${famousLiving} of ${H._living.length} living people do descend from one of the placeholder notables (5 founders).`);
}

// ---------------------------------------------------------------------------------------------
log('\n5. Births, marriages and deaths make sense under the placeholder rules');
{
  // The cases found in review (seed 1337, 200 years), checked by name since ids change with the fixes
  const X = run(SEED, 200), find = (n, s) => X.people.find(p => p.name === n && p.surname === s);
  const ruk = X.people.filter(p => p.name === 'Ruk' && p.surname === 'Stonefist');
  check(!ruk.some(r => r.spouses.some(s => ancestors(X, r.id).has(s.id))), `review case: no Ruk Stonefist (${ruk.length} of that name) marries an ancestor`);
  const joan = find('Joan', 'Wren'), jf = joan && joan.father !== null ? X.people[joan.father] : null;
  check(!jf || joan.birth - jf.birth >= X.rules.races[jf.race].adult, `review case: Joan Wren's father ${jf ? `was ${joan.birth - jf.birth} at her birth` : 'is not recorded'} (adulthood ${X.rules.races.human.adult})`);
  check(relationship(X, 0, 0) === 'the same person' && relationship(X, X._living[0], X._living[0]) === 'the same person', 'a founder, and anyone else, compared with themselves is "the same person"');
}
function sanity(H) {
  const bad = [], P = H.people, RACES = H.rules.races, CEILING = H.rules.ceiling;
  const born = p => p.birth, dead = p => p.death ?? Infinity;
  for (const p of P) {
    const R = RACES[TEMP_RULES.lifespanRace(p)];
    if (p.death !== null && p.death < p.birth) bad.push(`#${p.id} dies before birth`);
    if ((p.death ?? H.year) - p.birth > R.life * CEILING) bad.push(`#${p.id} outlives the ceiling for its race`);
    if ((p.death === null) !== (p.cause === null) || (p.death === null) !== (p.deathKind === null)) bad.push(`#${p.id} has a death without a cause and kind, or the other way round`);
    for (const [par, rel] of [[p.mother, 'mother'], [p.father, 'father']]) {
      if (par === null) continue;
      const q = P[par];
      if (born(q) >= p.birth) bad.push(`#${p.id} born before its ${rel}`);
      if (dead(q) < p.birth) bad.push(`#${p.id} born after its ${rel} died`);
      if (p.birth - q.birth < RACES[q.race].adult) bad.push(`#${p.id}'s ${rel} #${q.id} was not yet an adult (${p.birth - q.birth}) at the birth`);
      if (rel === 'mother') { const B = RACES[TEMP_RULES.birthRace(q, P[p.father])], a = p.birth - q.birth; if (a < B.fertile[0] || a > B.fertile[1]) bad.push(`#${p.id}'s mother outside child-bearing years (${a})`); }
    }
    if (p.mother !== null && p.mother === p.father) bad.push(`#${p.id} has one person as both parents`);
    for (const s of p.spouses) {
      const q = P[s.id];
      if (s.year > 0 && (s.year < p.birth + RACES[p.race].adult || s.year > dead(p) || s.year > dead(q))) bad.push(`#${p.id} wed when underage or dead`);
      if (!q.spouses.some(t => t.id === p.id && t.year === s.year)) bad.push(`#${p.id}'s marriage not recorded on both sides`);
    }
    // Only one living spouse at a time: each new marriage comes after the previous spouse's death
    for (let i = 1; i < p.spouses.length; i++) if (dead(P[p.spouses[i - 1].id]) > p.spouses[i].year) bad.push(`#${p.id} remarried while the earlier spouse lived`);
  }
  // No one married an ancestor or descendant (any depth), or anyone sharing a parent or grandparent
  for (const p of P) for (const s of p.spouses) {
    if (s.id < p.id) continue;
    const A = ancestors(H, p.id), B = ancestors(H, s.id);
    if (A.has(s.id) || B.has(p.id)) bad.push(`#${p.id} married their own ${A.has(s.id) ? 'ancestor' : 'descendant'} #${s.id}`);
    else if ([...A].some(([x, e]) => e.depth <= H.rules.kinDepth && B.has(x) && B.get(x).depth <= H.rules.kinDepth)) bad.push(`#${p.id} married close kin #${s.id}`);
  }
  // No one is their own ancestor
  const state = new Uint8Array(P.length);
  const visit = id => { if (state[id] === 2) return; if (state[id] === 1) { bad.push(`#${id} is its own ancestor`); return; } state[id] = 1; for (const par of [P[id].mother, P[id].father]) if (par !== null) visit(par); state[id] = 2; };
  P.forEach(p => visit(p.id));
  // Events in order, and none about a person outside their lifetime
  for (let i = 1; i < H.events.length; i++) if (H.events[i].y < H.events[i - 1].y) { bad.push('events out of order'); break; }
  for (const e of H.events) for (const k of ['p', 'a', 'b']) {
    if (e[k] === undefined) continue;
    const p = P[e[k]];
    if (e.t !== 'found' && (e.y < p.birth || e.y > dead(p) && e.t !== 'death')) bad.push(`${e.t} event for #${p.id} outside their life`);
  }
  return bad;
}
for (const yrs of [1, 100, 500]) {
  const X = yrs === 100 ? run(SEED, 100) : run(SEED + yrs, yrs), bad = sanity(X);
  check(bad.length === 0, `${yrs} years (seed ${X.seed}): ${X.people.length} people, ${X.events.length} events, ${bad.length} problems${bad.length ? ': ' + bad.slice(0, 5).join('; ') : ''}`);
}
log('  Checked: no one dies before birth or outlives the ceiling (1.6 × their race\'s typical life); every death has a cause; every child is born after both parents');
log('  (both adults at the birth, founders included, the mother in her child-bearing years); no one married an ancestor');
log('  or descendant at any depth, a sibling, half sibling or first cousin;');
log('  and before either died, to a mother in her child-bearing years; marriages are of adults, while both');
log('  live, recorded on both sides, one at a time; no one is their own ancestor; events are in order and');
log('  none concerns someone before birth or after death.');

// ---------------------------------------------------------------------------------------------
log('\nLifespans and causes of death (seed 1337, 2,000 years, everyone who died after year 0)');
{
  const X = run(SEED, 2000), dead = X.people.filter(p => p.death !== null && p.birth > 0);
  const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
  log('  race    typical  deaths  died as   age at death, adults    old-age deaths  outliers                          oldest');
  log('                           children  (10% / 50% / 90%)       median');
  for (const race of Object.keys(RACES)) {
    const R = RACES[race], ds = dead.filter(p => p.race === race), adults = ds.filter(p => p.death - p.birth >= R.adult).map(p => p.death - p.birth).sort((a, b) => a - b);
    const kids = ds.length - adults.length, long = adults.filter(a => a > R.life * 1.15).length, short = adults.filter(a => a < R.life * .5).length;
    const oldAge = ds.filter(p => p.cause === 'old age').map(p => p.death - p.birth).sort((a, b) => a - b);
    log(`  ${race.padEnd(6)} ${String(R.life).padStart(6)}  ${String(ds.length).padStart(6)}  ${(kids / ds.length * 100).toFixed(0).padStart(5)}%    ${pct(adults, .1)} / ${pct(adults, .5)} / ${pct(adults, .9)}`.padEnd(64) + `${pct(oldAge, .5)}`.padEnd(16) +
      `${(long / adults.length * 100).toFixed(1)}% past ${Math.round(R.life * 1.15)}, ${(short / adults.length * 100).toFixed(0)}% before ${R.life / 2}`.padEnd(34) + `${adults.at(-1)}`);
  }
  const causes = {};
  for (const p of dead) causes[p.deathKind] = (causes[p.deathKind] || 0) + 1;
  log(`  Causes: ${Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${(n / dead.length * 100).toFixed(1)}%`).join(', ')}`);
  const oldest = (race) => { const ds = dead.filter(p => p.race === race).sort((a, b) => (b.death - b.birth) - (a.death - a.birth)); return ds[0]; };
  for (const race of ['human', 'elf']) { const p = oldest(race); log(`  Longest-lived ${race}: ${describe(X, p.id)}, constitution ${p.constitution.toFixed(2)}`); }
  const youngElf = dead.filter(p => p.race === 'elf' && p.death - p.birth >= RACES.elf.adult).sort((a, b) => (a.death - a.birth) - (b.death - b.birth))[0];
  log(`  Shortest-lived adult elf: ${describe(X, youngElf.id)}`);
  const sample = dead.filter(p => p.race === 'human').slice(-6);
  log('  A few human deaths:'); for (const p of sample) log(`   ${describe(X, p.id)}`);
}

// ---------------------------------------------------------------------------------------------
log('\n6. Save and reload');
{
  mkdirSync(here + 'out', { recursive: true });
  const file = here + 'out/history-1337-200.json', text = save(H);
  writeFileSync(file, text);
  const R = load(readFileSync(file, 'utf8'));
  check(sha(save(R)) === sha(text), `reloaded ${(text.length / 1024).toFixed(0)} KB file is identical: ${R.people.length} people, ${R.events.length} events`);
  const probe = H._living.slice(0, 40);
  check(probe.every(id => JSON.stringify([...ancestors(R, id)]) === JSON.stringify([...ancestors(H, id)])), 'ancestry of 40 living people is the same after reloading');
  check(probe.every((a, i) => relationship(R, a, probe[(i + 7) % 40]) === relationship(H, a, probe[(i + 7) % 40])), 'relationships between them are the same after reloading');
}

// ---------------------------------------------------------------------------------------------
log('\n8. Murders and serial killers');
function murderProblems(X) {
  const bad = [], P = X.people, R = X.rules.races, ev = X.events;
  const caughtAt = {}; for (const e of ev) if (e.t === 'caught') caughtAt[e.p] = e.y;
  for (const e of ev) {
    if (e.t !== 'death' || e.kind !== 'murder') continue;
    const v = P[e.p], k = P[e.by], a = e.y - k.birth;
    if (!k || k.id === v.id) { bad.push(`#${v.id}: no killer, or killed themselves`); continue; }
    if (v.death !== e.y || v.deathKind !== 'murder') bad.push(`#${v.id}: the victim's record doesn't match the killing`);
    if (k.birth >= e.y || a < R[k.race].adult) bad.push(`#${k.id} killed #${v.id} before adulthood`);
    if (k.death !== null && k.death < e.y) bad.push(`#${k.id} killed #${v.id} after dying`);
    if (caughtAt[k.id] !== undefined && caughtAt[k.id] < e.y) bad.push(`#${k.id} killed #${v.id} after being caught`);
    if (e.serial) {
      const s = k.killer;
      if (!s || e.y < s.from || e.method !== s.method || e.mark !== s.mark) bad.push(`#${k.id}'s killing of #${v.id} doesn't match their signature`);
      const ra = e.y - v.birth, rv = R[v.race];
      const fits = s.prey === 'travellers' ? v.birthPlace !== e.place || ['trader', 'carter', 'sailor', 'stablehand'].includes(v.trade)
        : s.prey === 'young' ? v.sex === 'f' && ra >= rv.adult && ra < rv.adult + rv.life * .2 : s.prey === 'old' ? ra > rv.life * .6 : ra >= rv.adult;
      if (!fits) bad.push(`#${v.id} isn't the kind of victim #${k.id} chooses (${s.prey})`);
    } else if (!MURDER.motives.includes(e.motive)) bad.push(`#${v.id}'s killing has no motive`);
    if (!/murder/.test(e.believed) && e.solved) bad.push(`#${v.id}'s death passed for natural yet counts as solved at the time`);
    const rev = revealedIn(X, v.id);
    if (rev !== undefined && (!e.serial || rev < e.y || !ev.some(x => x.t === 'caught' && x.p === k.id && x.y === rev))) bad.push(`#${v.id}'s killing came to light without its killer being caught then`);
    if (e.blamed !== undefined && (e.blamed === k.id || e.solved)) bad.push(`#${v.id}: the blamed person is the killer, or the case was solved`);
  }
  for (const e of ev) if (e.t === 'caught') {
    const after = ev.find(x => x.y === e.y && x.p === e.p && (x.t === 'imprisoned' || x.t === 'death' && x.kind === 'execution'));
    if (!after) bad.push(`serial killer #${e.p} was caught but neither hanged nor imprisoned`);
  }
  for (const e of ev) if (e.t === 'death' && e.kind === 'execution' && P[e.for]?.deathKind !== 'murder') bad.push(`#${e.p} hanged for a death that wasn't a murder`);
  return bad;
}
for (const [seed, yrs] of [[1337, 500], [1837, 500], [42, 1000]]) {
  const X = run(seed, yrs), mu = X.events.filter(e => e.t === 'death' && e.kind === 'murder'), C = cases(X), bad = murderProblems(X);
  const n = f => mu.filter(f).length;
  check(bad.length === 0, `seed ${seed}, ${yrs} years: ${mu.length} murders (${n(e => !e.serial)} ordinary, ${n(e => e.serial)} by ${C.filter(c => c.victims.length).length} serial killers), ` +
    `${n(e => solved(X, e))} solved, ${n(e => !/murder/.test(e.believed))} passed for natural deaths, ${n(e => e.blamed !== undefined)} pinned on an innocent; ` +
    `${bad.length} problems${bad.length ? ': ' + bad.slice(0, 4).join('; ') : ''}`);
}
log('  Checked for every murder: the killer was alive and an adult, not the victim, and not yet caught; a serial');
log('  killing matches the killer\'s method, calling card and choice of victim; a killing that passed for natural is');
log('  unsolved; an innocent who was blamed is not the killer; a killing taken for natural is only solved\n  when its killer is caught later; a caught serial killer was hanged or imprisoned for\n  life; every hanging');
log('  was for a real murder.');
{
  const X = run(1837, 500), C = cases(X), P = X.people, nm = id => fullName(X, id);
  const story = (c, label) => {
    log(`  ${label}: ${describe(X, c.killer)}`);
    log(`    signature: ${MURDER.methods[c.method].cause}, leaves ${c.mark}, chooses ${MURDER.prey[c.prey]}; status: ${c.status}${c.caught !== null ? ` (caught ${c.caught})` : ''}`);
    for (const e of c.victims) log(`    ${e.y}  ${nm(e.p).padEnd(20)} ${e.place.padEnd(16)} people believed: ${e.believed}${revealedIn(X, e.p) !== undefined ? `; the truth came out in ${revealedIn(X, e.p)}` : ''}`);
  };
  const caught = C.filter(c => c.status === 'caught').sort((a, b) => b.victims.length - a.victims.length)[0];
  const free = C.find(c => c.status === 'died, never caught' || c.status === 'at large');
  if (caught) story(caught, 'A series that was caught');
  if (free) story(free, 'A series never solved');
  const ord = X.events.find(e => e.t === 'death' && e.kind === 'murder' && !e.serial && e.blamed !== undefined);
  if (ord) log(`  Pinned on an innocent: ${nm(ord.p)} (${ord.y}, ${ord.place}) was ${MURDER.methods[ord.method].cause} by ${nm(ord.by)} over ${ord.motive}; ` +
    `${nm(ord.blamed)} was blamed and ${X.events.find(e => e.t === 'accused' && e.p === ord.blamed).outcome}.`);
  const hidden = X.events.find(e => e.t === 'death' && e.kind === 'murder' && !/murder/.test(e.believed));
  if (hidden) log(`  Passed for natural: ${nm(hidden.p)} (${hidden.y}) was ${MURDER.methods[hidden.method].cause} by ${nm(hidden.by)}${hidden.motive ? ' over ' + hidden.motive : ''}; people believe: ${hidden.believed}.`);
  const open = C.filter(c => c.status === 'at large');
  log(`  Serial killers still at large at the end (a mystery waiting for a player): ${open.length ? open.map(c => `${nm(c.killer)} (${c.victims.length} victims)`).join(', ') : 'none in this history'}`);
}

log('\n9. One serial killer at large at any start');
{
  const starts = Array.from({ length: 300 }, (_, i) => i + 1), dist = [];   // every start year from 1 to 300
  let ok = true, where = '';
  for (const seed of [1337, 1837, 42, 7, 2024]) {
    const X = newHistory(seed);
    for (const y of starts) {
      simulate(X, y);
      const free = cases(X).filter(c => c.status === 'at large');
      if (free.length !== 1 || !free[0].victims.length) { ok = false; where += ` seed ${seed} year ${y}: ${free.length} at large;`; continue; }
      dist.push(free[0].victims.length);
    }
  }
  dist.sort((a, b) => a - b);
  check(ok, `in 5 seeds, at every start year from 1 to 300 (${5 * starts.length} in all), exactly one serial killer is at large, with victims already${where}`);
  log(`  victims so far, at those starts: fewest ${dist[0]}, median ${dist[dist.length >> 1]}, most ${dist.at(-1)}`);
  const X = run(SEED, 500), turned = X.events.filter(e => e.t === 'turned').length;
  log(`  ${turned} serial killers over 500 years (seed ${SEED}): one about every ${Math.round(500 / (turned - 1))} years`);
  const first = cases(run(SEED, 1)).find(c => c.status === 'at large');
  log(`  At the default start (year 1, seed ${SEED}): ${describe(run(SEED, 1), first.killer)}`);
  log(`    ${MURDER.methods[first.method].cause}, leaves ${first.mark}, chooses ${MURDER.prey[first.prey]}; ${first.victims.length} victims, from the last years of the war:`);
  for (const e of first.victims) log(`    ${e.y}  ${fullName(run(SEED, 1), e.p).padEnd(20)} people believe: ${e.believed}`);
}

log('\n10. Prisons');
function prisonProblems(X) {
  const bad = [], P = X.people, ev = X.events, R = X.rules;
  const terms = [];
  for (const e of ev) if (e.t === 'imprisoned') {
    const p = P[e.p], rel = ev.find(x => x.t === 'released' && x.p === e.p && x.y > e.y), end = rel ? rel.y : p.death ?? Infinity;
    terms.push({ p: e.p, since: e.y, end, until: e.until, at: e.at });
    const want = R.prisons[p.race] || (R.prisons.westPlaces.includes(e.from) ? R.prisons.west : R.prisons.rest);
    if (e.at !== want) bad.push(`#${e.p} sent to ${e.at}, not ${want}`);
    if (e.until !== null && X.year >= e.until && (p.death === null || p.death > e.until) && (!rel || rel.y !== e.until)) bad.push(`#${e.p} not released when their time was up (${e.until})`);
    if (e.until === null && rel) bad.push(`#${e.p} was released from a life sentence`);
  }
  for (const tm of terms) {
    const during = y => y > tm.since && y < tm.end, at = y => y >= tm.since && y < tm.end;
    for (const e of ev) {
      if (e.t === 'wed' && (e.a === tm.p || e.b === tm.p) && at(e.y)) bad.push(`#${tm.p} married while in the cells`);
      if (e.t === 'birth' && (e.mother === tm.p || e.father === tm.p) && at(e.y)) bad.push(`#${tm.p} had a child while in the cells`);
      if ((e.t === 'crime' && e.p === tm.p || e.t === 'death' && e.kind === 'murder' && e.by === tm.p) && during(e.y)) bad.push(`#${tm.p} committed a crime from the cells`);
      if ((e.t === 'crime' && e.victim === tm.p || e.t === 'death' && e.kind === 'murder' && e.p === tm.p) && during(e.y)) bad.push(`#${tm.p} was a victim while in the cells`);
      if (e.t === 'death' && e.p === tm.p && at(e.y) && e.place !== tm.at) bad.push(`#${tm.p} died in the cells but not at ${tm.at}`);
    }
  }
  return bad;
}
for (const [seed, yrs] of [[1337, 300], [1837, 500]]) {
  const X = run(seed, yrs), bad = prisonProblems(X), crimes = {};
  for (const e of X.events) if (e.t === 'crime') { const c = crimes[e.crime] ||= { n: 0, caught: 0 }; c.n++; if (e.caught) c.caught++; }
  const jailed = X.events.filter(e => e.t === 'imprisoned');
  check(bad.length === 0, `seed ${seed}, ${yrs} years: ${Object.entries(crimes).map(([k, c]) => `${c.n} ${k} (${c.caught} caught)`).join(', ')}; ${jailed.length} sent to the cells ` +
    `(${jailed.filter(e => e.crime === 'murder').length} for murder, ${jailed.filter(e => e.why === 'wrongly blamed').length} of them innocent); ${bad.length} problems${bad.length ? ': ' + bad.slice(0, 4).join('; ') : ''}`);
}
log('  Checked: each prisoner went to the right castle, was released when their time was up (never from a life');
log('  sentence), and while inside didn\'t marry, have children, commit crimes or suffer them; those who died inside died there.');
{
  const X = run(SEED, 200), cells = prisoners(X);
  log(`  In the cells at year 200 (seed ${SEED}):`);
  for (const [castle, ids] of Object.entries(cells)) {
    log(`   ${castle}:`);
    for (const id of ids) { const p = X.people[id], e = X.events.findLast(x => x.t === 'imprisoned' && x.p === id);
      log(`     ${fullName(X, id).padEnd(20)} ${p.race.padEnd(6)} ${e.crime.padEnd(9)} since ${e.y}, ${e.until === null ? 'for life' : 'until ' + e.until}${e.why === 'wrongly blamed' ? '  (innocent: blamed for a murder they didn\'t commit)' : ''}`); }
  }
}

log('\n7. A saved history keeps its own rules');
{
  const keep = JSON.stringify(RACES);
  RACES.human.life = 50; RACES.elf.life = 300; RACES.orc.adult = 15;           // non-default lifespans
  const straight = run(SEED, 300), early = run(SEED, 60), text = save(early);
  for (const [k, v] of Object.entries(JSON.parse(keep))) RACES[k] = v;          // back to the defaults
  RACES.human.life = 999;                                                        // and then something else again
  const R = load(text);
  check(R.rules.races.human.life === 50 && R.rules.races.elf.life === 300 && R.rules.races.orc.adult === 15, 'the reloaded history keeps the lifespans it was made with, not the current ones');
  check(sha(save(simulate(R, 300))) === sha(save(straight)), 'carried on from year 60 after reloading, under different current settings, it matches a straight run under its own rules');
  check(!R.rulesCodeChanged && !R.rulesGuessed, 'no rule-code version mismatch flagged');
  for (const [k, v] of Object.entries(JSON.parse(keep))) RACES[k] = v;
}

log('\nGeneration time (seed 1337; each length run 3 times, fastest shown)');
log('  years   time      people ever  alive at end  events    saved size  alive by race (human/elf/dwarf/orc), deepest generation');
for (const yrs of [1, 50, 100, 200, 500, 1000, 2000]) {
  let best = Infinity, X;
  for (let k = 0; k < (yrs > 1000 ? 1 : 3); k++) { const t = performance.now(); X = run(SEED, yrs); best = Math.min(best, performance.now() - t); }
  const by = r => X._living.filter(id => X.people[id].race === r).length, deep = Math.max(...X._living.map(id => X.people[id].gen));
  log(`  ${String(yrs).padStart(5)}  ${(best / 1000).toFixed(2).padStart(6)} s  ${String(X.people.length).padStart(11)}  ${String(X._living.length).padStart(12)}  ${String(X.events.length).padStart(7)}  ${(save(X).length / 1048576).toFixed(1).padStart(7)} MB  ${['human', 'elf', 'dwarf', 'orc'].map(by).join('/')}, ${deep}`);
}
log(`  (Node ${process.version}, one thread. A browser should be similar; not measured yet.)`);

log(`\n${failures ? failures + ' CHECK(S) FAILED' : 'All checks passed.'}`);
writeFileSync(here + 'results.txt', lines.join('\n') + '\n');
