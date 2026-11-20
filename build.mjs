// Build: src/ -> dist/ (production, minified + obfuscated) and dist-artifact/ (Claude preview)
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { transform } from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const SRC = 'src';
const OUT = 'dist';
const OUT_ART = 'dist-artifact';

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);

await rm(OUT, { recursive: true, force: true });
await rm(OUT_ART, { recursive: true, force: true });
await cp(SRC, OUT, { recursive: true });

// CSS
const cssSrc = await readFile(`${SRC}/assets/css/main.css`, 'utf8');
const css = (await transform(cssSrc, { loader: 'css', minify: true, legalComments: 'none' })).code;
await writeFile(`${OUT}/assets/css/main.css`, css);

// JS: minify, then obfuscate
const jsSrc = await readFile(`${SRC}/assets/js/main.js`, 'utf8');
const jsMin = (await transform(jsSrc, { loader: 'js', minify: true, target: 'es2017', legalComments: 'none' })).code;
const js = JavaScriptObfuscator.obfuscate(jsMin, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
}).getObfuscatedCode();
await writeFile(`${OUT}/assets/js/main.js`, js);

const v = hash(css + js);

// HTML
const files = await walk(OUT);
for (const f of files.filter((p) => p.endsWith('.html'))) {
  let html = await readFile(f, 'utf8');
  html = html
    .replace('assets/css/main.css', `assets/css/main.css?v=${v}`)
    .replace('assets/js/main.js', `assets/js/main.js?v=${v}`);
  const min = await minifyHtml(html, {
    collapseWhitespace: true,
    conservativeCollapse: false,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    useShortDoctype: true,
    minifyJS: false,
    minifyCSS: false,
    sortAttributes: false,
    sortClassName: false
  });
  await writeFile(f, min);
}

// Artifact preview copy: index body only (the host wraps it), no meta CSP
await cp(OUT, OUT_ART, { recursive: true });
for (const f of (await walk(OUT_ART)).filter((p) => p.endsWith('.html'))) {
  let html = await readFile(f, 'utf8');
  html = html.replace(/<meta[^>]*http-equiv="?Content-Security-Policy"?[^>]*>/i, '');
  if (path.basename(f) === 'index.html') {
    html = html
      .replace(/<!doctype html>/i, '')
      .replace(/<html[^>]*>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head>/i, '')
      .replace(/<\/head>/i, '')
      .replace(/<body[^>]*>/i, '')
      .replace(/<\/body>/i, '')
      .replace(/<meta[^>]*charset="?utf-8"?[^>]*>/i, '')
      .replace(/<meta[^>]*name="?viewport"?[^>]*>/i, '')
      .replace('</title>', '</title><meta name="claude:viewport-fit-sides" content="cover">');
  }
  await writeFile(f, html);
}
for (const junk of ['_headers', '.nojekyll', 'robots.txt', 'sitemap.xml']) await rm(path.join(OUT_ART, junk), { force: true });

const size = (await walk(OUT)).length;
console.log(`built ${OUT}/ (${size} files) and ${OUT_ART}/  v=${v}`);
