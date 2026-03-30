#!/usr/bin/env node
/**
 * Build script: bundelt src/ → dist/adviseurstool.html
 * Inlines alle CSS en JS in één standalone HTML bestand.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

// CSS bestanden in volgorde
const cssFiles = [
  'css/base.css',
  'css/components.css',
  'css/layout.css',
  'css/results.css',
  'css/print.css',
];

// Vendor libraries (inlined, no CDN dependency)
const libFiles = [
  'lib/jspdf.umd.min.js',
  'lib/html2canvas.min.js',
];

// JS bestanden in volgorde (afhankelijkheden eerst)
const jsFiles = [
  'js/state.js',
  'js/calc.js',
  'js/ui.js',
  'js/charts.js',
  'js/render.js',
  'js/pdf.js',
  'js/wix.js',
  'js/main.js',
];

function readFile(relPath) {
  return fs.readFileSync(path.join(SRC, relPath), 'utf8');
}

function build() {
  let html = readFile('index.html');

  // Bundle CSS
  const css = cssFiles.map(f => readFile(f)).join('\n');

  // Bundle vendor libs + app JS
  const libs = libFiles.map(f => readFile(f)).join('\n');
  // Escape </script> literals inside inlined JS to prevent HTML parser from
  // prematurely closing the <script> block
  const js = (libs + '\n\n' + jsFiles.map(f => readFile(f)).join('\n\n'))
    .replace(/<\/script>/gi, '<\\/script>');

  // Replace placeholders in index.html
  html = html.replace('/* __CSS_BUNDLE__ */', css);
  html = html.replace('/* __JS_BUNDLE__ */', js);

  // Ensure dist/ exists
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const outPath = path.join(DIST, 'adviseurstool.html');
  fs.writeFileSync(outPath, html, 'utf8');

  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`✓ Built dist/adviseurstool.html (${sizeKb} KB)`);
}

build();
