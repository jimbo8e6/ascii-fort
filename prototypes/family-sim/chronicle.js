// The Chronicle: browsing a finished history (people, families, deaths, killings, crimes and offices). Shared by
// viewer.html and the game (index.html); build-viewer.mjs copies it into both. It expects the simulation's
// functions in the same scope, and elements with ids stats, search, results and card.
const $ = id => document.getElementById(id);
let H = null, pickA = null, pickB = null;

const name = id => { const p = H.people[id]; return `${p.name} ${p.surname}`; };
const link = id => id === null ? '<span class="dim">unknown</span>' : `<a data-id="${id}">${name(id)}</a>${H.people[id].notable ? ' <span class="star">★</span>' : ''}`;
const life = p => `${p.birth}–${p.death ?? ''}`;
// A title, as a link to the office's own page (everyone who has held it, and how)
const officeLink = (place, office) => `<a class="office" data-office="${place}|${office}">${office} of ${place}</a>`;
const brief = (id, withTitles = true) => { const p = H.people[id], t = p.death === null && withTitles ? H._holds[id] || [] : []; return `${link(id)} <span class="dim">${p.race}${p.heritage.length > 1 ? '*' : ''} ${life(p)}${p.trade ? ' · ' + p.trade : ''}</span>${t.length ? ' ' + t.map(k => officeLink(...k.split('|'))).join(', ') : ''}`; };
const died = p => ['murder', 'execution', 'challenge'].includes(p.deathKind) ? p.cause : 'of ' + p.cause;

function stats() {
  const by = {}; for (const id of H._living) { const r = H.people[id].race; by[r] = (by[r] || 0) + 1; }
  const mu = H.events.filter(e => e.t === 'death' && e.kind === 'murder'), C = cases(H);
  return `${H.people.length} people ever, ${H._living.length} alive in year ${H.year}\n${H.events.length} events, ${H.lines.length} founding family lines\nalive: ${Object.entries(by).map(([r, n]) => `${r} ${n}`).join(', ')}` +
    `\n${mu.length} murders (${mu.filter(e => !solved(H, e)).length} unsolved), ${C.filter(c => c.victims.length).length} serial killers, ${C.filter(c => c.status === 'at large').length} at large\n${Object.values(prisoners(H)).flat().length} in the cells\n${officeHolders(H).filter(o => o.p !== null).length} offices held, ${officeHolders(H).filter(o => o.p === null).length} empty\nsearch "murder", "unsolved", "killer", "prison" or "offices" to list them`;
}
function search() {
  if (!H) return;
  const q = $('search').value.trim().toLowerCase();
  const murdered = H.events.filter(e => e.t === 'death' && e.kind === 'murder');
  let ids = q.startsWith('#') ? [+q.slice(1)].filter(i => H.people[i])
    : q === 'murder' ? murdered.map(e => e.p) : q === 'unsolved' ? murdered.filter(e => !solved(H, e)).map(e => e.p)
    : q === 'killer' ? cases(H).filter(c => c.victims.length).map(c => c.killer)
    : q === 'prison' ? Object.values(prisoners(H)).flat()
    : H.people.filter(p => !q || `${p.name} ${p.surname}`.toLowerCase().includes(q)).map(p => p.id);
  if (q === 'offices' || q === 'office') {
    $('results').innerHTML = officeHolders(H).map(o => `<div>${officeLink(o.place, o.office)} ${o.p === null ? `<span class="dim">vacant${o.since !== null ? ' since ' + o.since : ''}</span>` : brief(o.p, false) + ` <span class="dim">since ${o.since}</span>`}</div>`).join('');
    return;
  }
  if (!q) ids = [...H.people.filter(p => p.notable).map(p => p.id), ...H._living.slice(-40)];
  $('results').innerHTML = ids.slice(0, 200).map(id => `<div>${brief(id)}</div>`).join('') + (ids.length > 200 ? `<div class="dim">…${ids.length - 200} more</div>` : '');
}
function tree(id, depth) {
  const p = H.people[id];
  if (depth === 0 || (p.mother === null && p.father === null)) return '';
  return `<ul class="tree">${[['mother', p.mother], ['father', p.father]].map(([rel, x]) => `<li><span class="dim">${rel}</span> ${x === null ? '<span class="dim">unknown</span>' : brief(x) + tree(x, depth - 1)}</li>`).join('')}</ul>`;
}
function show(id) {
  const p = H.people[id], kids = H._children[id], A = ancestors(H, id);
  const notables = [...A.entries()].filter(([x]) => H.people[x].notable).sort((a, b) => a[1].depth - b[1].depth);
  const line = []; for (let x = id; x !== null; x = H.people[x].father) line.unshift(x);
  const lifeEvents = H.events.filter(e => e.p === id || e.a === id || e.b === id || e.t === 'crime' && e.victim === id || e.t === 'challenge' && e.against === id);
  // Murder: the truth, and what people believe (they may never learn it)
  const death = H.events.find(e => e.t === 'death' && e.p === id), kills = H.events.filter(e => e.t === 'death' && e.kind === 'murder' && e.by === id);
  const blamedFor = H.events.find(e => e.t === 'accused' && e.p === id), myCase = p.killer && cases(H).find(c => c.killer === id);
  const offs = holdings(H).filter(h => h.p === id), myVerdicts = verdicts(H, id);
  const cell = p.jail && p.death === null ? H.events.findLast(e => e.t === 'imprisoned' && e.p === id) : null;
  // Their death (as the victim, or put to death), their killings, and their crimes and punishments: each
  // with the truth beside what people believe
  const section = (title, items) => { const body = items.filter(Boolean).join(''); return body ? `<h3>${title}</h3><div class="crime">${body}</div>` : ''; };
  const deathPart = section('Their death', [
    death?.kind === 'murder' ? `<div><b>Murdered</b> in ${death.place}, ${MURDER.methods[death.method].cause}${death.weapon ? ' with ' + death.weapon : ''}, by ${brief(death.by)}${death.motive ? `, over ${death.motive}` : `, one of a series (${death.mark} left behind)`}.</div>
      <div>People believed: <i>${death.believed}</i>${revealedIn(H, id) !== undefined ? `; the truth came out in ${revealedIn(H, id)}, when the killer was caught` : solved(H, death) ? '' : ' <span class="temp">(not solved)</span>'}</div>` : '',
    death?.kind === 'execution' ? `<div><b>${death.cause.replace(/ for the murder of .*/, '').replace(/^./, c => c.toUpperCase())}</b> for the murder of ${brief(death.for)}${blamedFor ? ' <span class="temp">(innocent: see below)</span>' : ''}.</div>` : '',
    death?.kind === 'execution' && (death.judge !== undefined || death.presides !== undefined) ? `<div class="dim">${death.judge !== undefined ? 'Judged by ' + link(death.judge) : ''}${death.presides !== undefined ? `; ${link(death.presides)} presided` : ''}${death.hangman !== undefined ? `; hanged by ${link(death.hangman)}` : ''}</div>` : '',
    death?.kind === 'challenge' ? `<div><b>Killed in a fight to the death</b> by ${brief(death.victor)}.</div>` : '',
  ]);
  const killsPart = section(`Their killings${kills.length ? ` (${kills.length})` : ''}`, [
    myCase ? `<div><b>Serial killer</b> (${myCase.status}${myCase.caught !== null ? `, caught in ${myCase.caught}` : ''}): ${MURDER.methods[myCase.method].cause}${myCase.weapon ? ' with ' + myCase.weapon : ''}, leaves ${myCase.mark}, chooses ${MURDER.prey[myCase.prey]}, from ${myCase.from}.</div>` : '',
    kills.length ? `<div>${kills.map(e => `${e.y} ${brief(e.p, false)} <span class="dim">in ${e.place}${e.motive ? ', over ' + e.motive : ''}; people believed: ${e.believed}${revealedIn(H, e.p) !== undefined ? `; the truth came out in ${revealedIn(H, e.p)}` : solved(H, e) ? '' : ' (never solved)'}${e.blamed !== undefined ? '; ' + link(e.blamed) + ' was blamed' : ''}</span>`).join('<br>')}</div>` : '',
  ]);
  const record = H.events.filter(e => e.p === id && (e.t === 'crime' || e.t === 'imprisoned' || e.t === 'exiled' || e.t === 'released'));
  const crimePart = section('Crimes and punishment', [
    cell ? `<div><b>In the cells</b> beneath ${cell.at} since ${cell.y}, ${cell.condemned ? (H.rules.offices.seats[cell.at].justice === 'court' ? `<b>condemned to hang when the lord's court sits${cell.until <= H.year ? ' (it has not sat since ' + cell.until + ')' : ' in ' + cell.until}</b>` : `<b>condemned to die in ${cell.until}</b>`) : cell.until === null ? 'for life' : 'until ' + cell.until}, for ${cell.crime}${cell.why === 'wrongly blamed' ? ' <span class="temp">(innocent)</span>' : ''}.</div>` : '',
    blamedFor ? `<div><b>Wrongly blamed</b> for the murder of ${brief(blamedFor.for)}, and ${blamedFor.outcome}${blamedFor.judge !== undefined ? `, judged by ${link(blamedFor.judge)}` : ''}. The real killer was ${brief(H.events.find(e => e.t === 'death' && e.p === blamedFor.for).by)}.</div>` : '',
    record.length ? `<div class="dim">${record.map(e => `${e.y}: ${e.t === 'crime' ? `${e.crime}${e.victim !== null ? ' against ' + link(e.victim) : ''}${e.caught ? ', caught' : ' (never caught)'}`
      : e.t === 'imprisoned' ? `to the cells beneath ${e.at} for ${e.crime}${e.condemned ? ', condemned' : e.until === null ? ', for life' : ' until ' + e.until}${e.judge !== undefined ? ', judged by ' + link(e.judge) : ''}${e.why === 'wrongly blamed' ? ' (innocent)' : ''}`
      : e.t === 'exiled' ? `exiled to ${e.to}${e.hushed ? ', quietly' : ''}${e.judge !== undefined ? ', by ' + link(e.judge) : ''}${e.why === 'wrongly blamed' ? ' (innocent)' : ''}` : `released from ${e.from}`}`).join('<br>')}</div>` : '',
  ]);
  $('card').innerHTML = `
    <h2>${name(id)} <span class="dim">#${id}</span>${p.notable ? ` <span class="star">★ ${p.notable}</span>` : ''}</h2>
    <div>${p.race}${p.heritage.length > 1 ? ` <span class="temp">(family of ${p.heritage.join(', ')}; race chosen by a temporary rule)</span>` : ''}, ${p.sex === 'f' ? 'female' : 'male'}, born ${p.birth} in ${p.birthPlace}${p.death !== null ? `, died ${p.death} aged ${p.death - p.birth}, ${died(p)}` : `, alive, aged ${H.year - p.birth}`} · constitution ${p.constitution.toFixed(2)}</div>
    <div>${p.trade || 'no trade yet'} · lives in ${p.place} · generation ${p.gen}</div>
    ${deathPart}${killsPart}${crimePart}
    ${offs.length ? `<h3>Offices</h3><div>${offs.map(h => `${h.from}–${h.to ?? ''}: ${officeLink(h.place, h.office)} <span class="dim">${h.how}${h.after !== undefined ? ' from ' + link(h.after) : ''}${h.by !== undefined ? ' by ' + link(h.by) : ''}${h.for !== undefined ? ' for ' + link(h.for) : ''}${h.why ? '; ' + h.why : ''}</span>`).join('<br>')}</div>` : ''}
    ${myVerdicts.length ? `<h3>Verdicts given (${myVerdicts.length}, ${myVerdicts.filter(v => v.wrongful).length} wrongful)</h3><div class="dim">${myVerdicts.slice(0, 40).map(v => `${v.y}: ${link(v.p)}, ${v.crime}: ${v.sentence}${v.wrongful ? ' <span class="temp">(innocent)</span>' : ''}`).join('<br>')}${myVerdicts.length > 40 ? '<br>…' : ''}</div>` : ''}
    <div style="margin-top:8px"><button id="setA">SET AS A</button> <button id="setB">SET AS B</button></div>
    ${pickA !== null && pickB !== null ? relBox() : ''}
    <h3>Parents</h3><div>mother ${p.mother === null ? '<span class="dim">unknown (founder)</span>' : brief(p.mother)}<br>father ${p.father === null ? '<span class="dim">unknown (founder)</span>' : brief(p.father)}</div>
    <h3>Marriages</h3><div>${p.spouses.map(s => `${s.year}: ${brief(s.id)}`).join('<br>') || '<span class="dim">none</span>'}</div>
    <h3>Children (${kids.length})</h3><div>${kids.map(brief).join('<br>') || '<span class="dim">none</span>'}</div>
    <h3>Life</h3><div class="dim">${lifeEvents.map(e => `${e.y}: ${e.t === 'wed' ? 'married ' + link(e.a === id ? e.b : e.a) : e.t === 'move' ? `moved ${e.from} → ${e.to}${e.why ? ' (' + e.why + ')' : ''}` : e.t === 'office' ? `became ${officeLink(e.place, e.office)} (${e.how})` : e.t === 'left office' ? `ceased to be ${officeLink(e.place, e.office)}: ${e.why}` : e.t === 'vow' ? `vowed revenge on ${link(e.against)} for ${link(e.for)}` : e.t === 'challenge' ? `fought ${link(e.p === id ? e.against : e.p)} to the death${e.chieftaincy ? ' for the chieftaincy' : ''}${e.revenge !== undefined ? ', avenging ' + link(e.revenge) : ''}` : e.t === 'trade' ? 'became a ' + e.trade : e.t === 'found' ? 'living at the end of the war' : e.t === 'death' ? (['murder', 'execution', 'challenge'].includes(e.kind) ? e.cause : 'died of ' + e.cause) : e.t === 'caught' ? (e.hushed ? `caught after ${e.victims.length} killings; the case was hushed up` : `caught, ${e.victims.length} killings brought to light`) : e.t === 'exiled' ? `exiled from ${e.from} to ${e.to}${e.why === 'wrongly blamed' ? ' for a murder they didn\'t commit' : e.hushed ? ', quietly' : ' for murder'}` : e.t === 'accused' ? `blamed for the murder of ${link(e.for)}` : e.t === 'imprisoned' ? `sent to the cells beneath ${e.at} for ${e.crime}, ${e.condemned ? 'condemned to die in ' + e.until + (H.rules.offices.seats[e.at].justice === 'court' ? ', when the court sits' : '') : e.until === null ? 'for life' : 'until ' + e.until}` : e.t === 'released' ? `released from ${e.from}` : e.t === 'crime' ? `${e.crime}${e.victim !== null ? ' against ' + link(e.victim) : ''}${e.caught ? ', caught' : ' (never caught)'}` : e.t === 'turned' ? 'turned killer (known to no one)' : e.t}`).join('<br>')}</div>
    <h3>Ancestors: ${A.size} known, ${notables.length} notable</h3>
    <div>${notables.slice(0, 10).map(([x, e]) => `<span class="star">★</span> ${link(x)}, ${H.people[x].notable} <span class="dim">(${e.depth} generations back, via ${e.routes[0].join(' → ')})</span>`).join('<br>') || '<span class="dim">no notable ancestors: an ordinary family</span>'}</div>
    <h3>Family line (father's side, as surnames pass under the temporary rule)</h3><div>${line.map(brief).join('<br>')}</div>
    <h3>Ancestry, 4 generations</h3><ul class="tree root"><li>${brief(id)}${tree(id, 4)}</li></ul>`;
  $('setA').onclick = () => { pickA = id; show(id); };
  $('setB').onclick = () => { pickB = id; show(id); };
}
// An office's page: every holder in turn, how they came to it and how it ended, and the gaps between
function showOffice(key) {
  const [place, office] = key.split('|'), all = holdings(H), hs = all.filter(h => h.place === place && h.office === office);
  const gaps = H.events.filter(e => e.t === 'vacant' && e.place === place && e.office === office);
  const S = H.rules.offices.seats[place];
  const how = h => {
    if (h.how === 'founding') return 'the first, at the end of the war';
    if (h.how === 'inherited') { const r = relationship(H, h.after, h.p); return `inherited from ${link(h.after)}${r ? ` <span class="dim">(${r})</span>` : ''}${H._children[h.after].includes(h.p) ? '' : `: ${link(h.after)} left no child who could take it, so it went to the nearest relative`}`; }
    if (h.how === 'next in rank') { const was = all.find(x => x.p === h.p && x.place === place && x.to === h.from && /^became/.test(x.why || '')); return `next in rank${was ? ` (was ${was.office})` : ''}: there was no heir`; }
    if (h.how === 'chosen by the household') return 'chosen by the household: no heir, and no one in rank to take it';
    if (h.how === 'appointed') return h.by !== undefined ? `appointed by ${link(h.by)}` : 'appointed by its own people (no ruler over them then)';
    if (h.how === 'regent') return `regent for ${link(h.for)}, a child`;
    if (/fight|challenge/.test(h.how)) { const f = H.events.find(e => e.t === 'challenge' && e.y === h.from && e.chieftaincy && (e.p === h.p && e.won || e.against === h.p && !e.won));
      return f ? `${h.how}: killed ${link(f.won ? f.against : f.p)}${f.revenge !== undefined ? `, avenging ${link(f.revenge)}` : ''}` : h.how; }
    return h.how;
  };
  // Holdings and vacancies, in order
  const rows = [...hs.map(h => ({ y: h.from, h })), ...gaps.map(g => ({ y: g.y, g }))].sort((a, b) => a.y - b.y || !!a.g - !!b.g);   // a vacancy after a holding of the same year
  const staff = officeHolders(H).filter(o => o.place === place && `${o.place}|${o.office}` !== key);
  $('card').innerHTML = `
    <h2><span class="office">${office} of ${place}</span></h2>
    <div class="dim">${S ? (office === S.ruler ? (S.rule === 'inherit' ? 'passes to the eldest child, then the nearest relative, then the next highest in rank' : S.rule === 'chosen' ? 'chosen by the circle of elders, usually the eldest' : 'held by challenge to the death') : office === 'Regent' ? 'rules for a child ' + S.ruler : 'appointed by the ' + S.ruler) : 'appointed by the ruler over this place'} · ${hs.length} holders since the war</div>
    <h3>Holders</h3><div>${rows.map(r => r.g ? `<div class="dim">${r.g.y}: <i>vacant</i>: ${r.g.why}</div>`
      : `<div style="margin-bottom:6px"><b>${r.h.from}–${r.h.to ?? 'now'}</b> ${brief(r.h.p, false)}<br><span class="dim">how:</span> ${how(r.h)}${r.h.why ? `<br><span class="dim">ended:</span> ${r.h.why}` : ''}</div>`).join('') || '<span class="dim">no one yet</span>'}</div>
    ${staff.length ? `<h3>Other offices at ${place}</h3><div>${staff.map(o => `${officeLink(o.place, o.office)} ${o.p === null ? '<span class="dim">vacant</span>' : brief(o.p, false)}`).join('<br>')}</div>` : ''}`;
}
function relBox() {
  const r = relationship(H, pickA, pickB), { nearest, common } = sharedAncestors(H, pickA, pickB);
  const route = (from, steps) => { let x = from, out = [link(x)]; for (const s of steps) { x = H.people[x][s]; out.push(`<span class="dim">${s}</span> ${link(x)}`); } return out.join(' → '); };
  return `<div class="rel">A: ${brief(pickA)}<br>B: ${brief(pickB)}<br><b>${r ? r : 'not related'}</b>${common.length ? ` <span class="dim">(${common.length} shared ancestors)</span>` : ''}
    ${nearest.slice(0, 6).map(n => `<div style="margin-top:6px">${brief(n.id)}<br><span class="dim">A:</span> ${route(pickA, n.fromA.routes[0])}<br><span class="dim">B:</span> ${route(pickB, n.fromB.routes[0])}</div>`).join('')}</div>`;
}
document.body.addEventListener('click', e => { const o = e.target.closest('a[data-office]'); if (o) return showOffice(o.dataset.office); const a = e.target.closest('a[data-id]'); if (a) show(+a.dataset.id); });
$('search').oninput = search;
