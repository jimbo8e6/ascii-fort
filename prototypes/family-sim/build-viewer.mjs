// Copies the simulation (family-sim.mjs) and the Chronicle browser (chronicle.js) into viewer.html and the
// game's index.html, so each is one self-contained file that works when opened straight from disk. Run after
// changing either (test.mjs runs it too).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
// Put `content` between a page's `// <tag>` and `// </tag>` marker lines
function fill(page, tag, content, file) {
  const a = page.indexOf(`// <${tag}>`), b = page.indexOf(`// </${tag}>`);
  if (a < 0 || b < 0) throw new Error(`${file} is missing its // <${tag}> markers`);
  const src = tag === 'family-sim' ? 'family-sim.mjs' : 'chronicle.js';
  return page.slice(0, a) + `// <${tag}> (copied from prototypes/family-sim/${src} by build-viewer.mjs; edit that file, not this block)\n` + content + page.slice(b);
}
const sources = () => ({ sim: readFileSync(here + 'family-sim.mjs', 'utf8').replace(/^export /gm, ''), ui: readFileSync(here + 'chronicle.js', 'utf8') });
// The viewer, and the game (which builds a history in the background and opens it as its Chronicle)
export function buildViewer() {
  const { sim, ui } = sources();
  let changed = false;
  for (const file of [here + 'viewer.html', here + '../../index.html']) {
    const page = readFileSync(file, 'utf8'), out = fill(fill(page, 'family-sim', sim, file), 'chronicle', ui, file);
    if (out.includes('</script', out.indexOf('// <family-sim>')) && out.indexOf('</script', out.indexOf('// <family-sim>')) < out.indexOf('// </family-sim>')) throw new Error('the simulation contains </script');
    if (out !== page) { writeFileSync(file, out); changed = true; }
  }
  return changed;
}
// A copy for hosting as a web page (node build-viewer.mjs --hosted <file>): without the outer document
// tags, which the host adds, and without SAVE JSON, since hosted pages can't start downloads
export function hostedViewer(path) {
  buildViewer();
  let page = readFileSync(here + 'viewer.html', 'utf8');
  page = page.replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<\/head>\s*<body>\s*/i, '').replace(/\s*<\/body>\s*<\/html>\s*$/i, '\n')
    .replace(/\s*<button class="btn"? ?id="saveBtn">SAVE JSON<\/button>/, '').replace(/<button id="saveBtn">SAVE JSON<\/button>\s*/, '');
  writeFileSync(path, page);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--hosted');
  if (i > 0) { hostedViewer(process.argv[i + 1]); console.log('hosted copy written to', process.argv[i + 1]); }
  else console.log(buildViewer() ? 'viewer.html / index.html updated' : 'viewer.html and index.html already up to date');
}
