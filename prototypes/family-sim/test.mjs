// Runs the six checks for the family simulation prototype and measures generation time.
// Usage: node test.mjs   (prints a report; also writes results.txt next to this file)
import { newHistory, simulate, save, load, ancestors, sharedAncestors, relationship, describe, fullName, RACES, TEMP_RULES, RULES, CEILING } from './family-sim.mjs';
import { createHash } from 'node:crypto';
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
  const asOf = (p, y) => ({ ...p, death: p.death !== null && p.death <= y ? p.death : null, cause: p.death !== null && p.death <= y ? p.cause : null, spouses: p.spouses.filter(s => s.year <= y),
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
function sanity(H) {
  const bad = [], P = H.people;
  const born = p => p.birth, dead = p => p.death ?? Infinity;
  for (const p of P) {
    const R = RACES[TEMP_RULES.lifespanRace(p)];
    if (p.death !== null && p.death < p.birth) bad.push(`#${p.id} dies before birth`);
    if ((p.death ?? H.year) - p.birth > R.life * CEILING) bad.push(`#${p.id} outlives the ceiling for its race`);
    if ((p.death === null) !== (p.cause === null)) bad.push(`#${p.id} has a death without a cause or a cause without a death`);
    for (const [par, rel] of [[p.mother, 'mother'], [p.father, 'father']]) {
      if (par === null) continue;
      const q = P[par];
      if (born(q) >= p.birth) bad.push(`#${p.id} born before its ${rel}`);
      if (dead(q) < p.birth) bad.push(`#${p.id} born after its ${rel} died`);
      if (rel === 'mother') { const B = RACES[TEMP_RULES.birthRace(q, P[p.father])], a = p.birth - q.birth; if (p.birth > 0 && (a < B.fertile[0] || a > B.fertile[1])) bad.push(`#${p.id}'s mother outside child-bearing years (${a})`); }
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
  for (const p of dead) { const c = p.cause === 'old age' ? 'old age' : p.cause === 'childbirth' ? 'childbirth' : /drown|rockfall|skirmish|hunting|falling tree|forge|scaffold|crushing|fall|cart|fight|horse|fire|wound/.test(p.cause) ? 'injury' : 'illness'; causes[c] = (causes[c] || 0) + 1; }
  log(`  Causes: ${Object.entries(causes).map(([c, n]) => `${c} ${(n / dead.length * 100).toFixed(0)}%`).join(', ')}`);
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
