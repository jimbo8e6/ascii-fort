// Copies the simulation (family-sim.mjs) into viewer.html, so the viewer is one self-contained file
// that works when opened straight from disk. Run after changing family-sim.mjs (test.mjs runs it too).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
export function buildViewer() {
  const sim = readFileSync(here + 'family-sim.mjs', 'utf8').replace(/^export /gm, '');
  const page = readFileSync(here + 'viewer.html', 'utf8');
  const a = page.indexOf('// <family-sim>'), b = page.indexOf('// </family-sim>');
  if (a < 0 || b < 0) throw new Error('viewer.html is missing its // <family-sim> markers');
  const out = page.slice(0, a) + '// <family-sim> (copied from family-sim.mjs by build-viewer.mjs; edit that file, not this block)\n' + sim + page.slice(b);
  if (out !== page) writeFileSync(here + 'viewer.html', out);
  return out !== page;
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
  else console.log(buildViewer() ? 'viewer.html updated' : 'viewer.html already up to date');
}
