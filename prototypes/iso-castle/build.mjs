// Builds iso.html from iso.template.html: the castle-building code (textures, Kit, makeFort, buildCastle, the cells
// and their furniture...) is copied out of the game's index.html, by name, between the `// <castle-code>` markers,
// so the isometric test always shows the same Castle Aldermere as the game. Run: node prototypes/iso-castle/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url), game = readFileSync(new URL('../../index.html', here), 'utf8');
const NAMES = ['mulberry32', 'const rand', 'canvasTexture', 'noiseFill', 'TEX', 'Object.assign(TEX', 'scaledBox', 'BDEF', 'BMAT', 'buildingMat', 'mergeGeos', 'scaleUV',
  'Kit', 'kitTools', 'stoneKey', 'hangDoor', 'buildFort', 'makeFort', 'SLATE', 'spire', 'SCHOOL_ROWS', 'CRADLES', 'CASTLE_ROOMS', 'BUNK_X',
  'buildCastle', 'DUNGEON', 'buildDungeon', 'CELL_SPOTS', 'JAILER_ROOM', 'furnishDungeon'];
// One top-level declaration, from its first line to its closing brace (or the semicolon ending a const). A name
// may say which kind ('const rand': the game's, not the history's function of that name)
function extract(name) {
  const m = new RegExp(/[ (]/.test(name) ? '^' + name.replace(/[.()]/g, '\\$&') : `^(?:(?:async )?function ${name}\\b|class ${name}\\b|const ${name}\\b)`, 'm').exec(game);
  if (!m) throw new Error('not found in index.html: ' + name);
  const isConst = !/^(async |function|class)/.test(m[0]);
  let i = m.index, depth = 0, opened = false;
  const stack = [];                                                // inside template literals: the depth their ${ opened at
  while (i < game.length) {
    const c = game[i], n = game[i + 1];
    if (c === '/' && n === '/') { i = game.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = game.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"') { i++; while (game[i] !== c) i += game[i] === '\\' ? 2 : 1; i++; continue; }
    if (c === '`' || c === '}' && stack.length && stack.at(-1) === depth) {
      if (c === '}') stack.pop();
      i++;                                                         // through the template's text, to its end or a ${
      while (game[i] !== '`') { if (game[i] === '\\') { i += 2; continue; } if (game[i] === '$' && game[i + 1] === '{') { stack.push(depth); i += 2; break; } i++; }
      if (game[i] === '`') i++;
      continue;
    }
    if ('([{'.includes(c)) { if (c === '{' && depth === 0) opened = true; depth++; }                 // (opened: the body, not the parameters)
    else if (')]}'.includes(c)) { depth--; if (!isConst && opened && depth === 0) return game.slice(m.index, i + 1); }
    else if (c === ';' && depth === 0 && isConst) return game.slice(m.index, i + 1);
    i++;
  }
  throw new Error('unterminated: ' + name);
}
const code = NAMES.map(extract).join('\n');
const tpl = readFileSync(new URL('iso.template.html', here), 'utf8');
const out = tpl.replace(/\/\/ <castle-code>[\s\S]*?\/\/ <\/castle-code>/, `// <castle-code> (copied from index.html by build.mjs; edit it there)\n${code}\n// </castle-code>`);
writeFileSync(new URL('iso.html', here), out);
console.log(`iso.html: ${NAMES.length} pieces of the game, ${code.length} characters`);
